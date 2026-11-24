import csv
import io

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.main as main
from app.core.config import Settings, settings
from app.core.security import hash_password
from app.core.throttle import throttle
from app.db.base import Base
from app.db.session import get_db
from app.models import EmailOutbox, Role, Status, User
from app.services import mailer

engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
Session = sessionmaker(bind=engine, expire_on_commit=False)
ADMIN_EMAIL, ADMIN_PW = "admin@test.dz", "S3cure-Admin-Pass!"


@pytest.fixture()
def app_(monkeypatch):
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    monkeypatch.setattr(main, "engine", engine)
    monkeypatch.setattr(main, "SessionLocal", Session)
    monkeypatch.setattr(settings, "admin_email", ADMIN_EMAIL)
    monkeypatch.setattr(settings, "admin_password", ADMIN_PW)
    monkeypatch.setattr(settings, "smtp_host", "")
    throttle.reset()
    main.seed()

    def override():
        with Session() as db:
            yield db

    main.app.dependency_overrides[get_db] = override
    yield main.app
    main.app.dependency_overrides.clear()


def new_client(app_) -> TestClient:
    return TestClient(app_)


def login(app_, email, password) -> TestClient:
    c = new_client(app_)
    r = c.post("/api/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    c.headers["X-CSRF-Token"] = r.json()["csrf_token"]
    return c


def body(n=1, **kw):
    d = dict(name=f"Leader {n}", email=f"leader{n}@mail.dz", password="password1",
             university="Univ. Tlemcen", field_of_study="CS", team_name=f"Team {n}",
             member_emails=[f"m{n}a@gmail.com", f"m{n}b@gmail.com"], accept_rules=True)
    d.update(kw)
    return d


def reg(app_, n=1, **kw) -> TestClient:
    c = new_client(app_)
    r = c.post("/api/auth/register", json=body(n, **kw))
    assert r.status_code == 201, r.text
    c.headers["X-CSRF-Token"] = r.json()["csrf_token"]
    return c


def admin(app_) -> TestClient:
    return login(app_, ADMIN_EMAIL, ADMIN_PW)


def outbox_rows():
    with Session() as db:
        return db.scalars(select(EmailOutbox).order_by(EmailOutbox.id)).all()


# ---------------------------------------------------------------- auth / cookies / CSRF
def test_register_login_me_cookie_session(app_):
    c = reg(app_)
    me = c.get("/api/users/me").json()
    assert me["status"] == "pending" and me["id"].startswith("TLP-")
    assert me["team"]["name"] == "Team 1" and me["team"]["member_emails"] == ["m1a@gmail.com", "m1b@gmail.com"]
    bad = new_client(app_).post("/api/auth/login", json={"email": "leader1@mail.dz", "password": "bad"})
    assert bad.status_code == 401


def test_token_is_httponly_cookie_not_json(app_):
    r = new_client(app_).post("/api/auth/register", json=body())
    assert "access_token" not in r.json() and r.json()["csrf_token"]
    cookie = r.headers["set-cookie"].lower()
    assert "tlp_session=" in cookie and "httponly" in cookie and "samesite=lax" in cookie


def test_requires_auth_and_csrf(app_):
    assert new_client(app_).get("/api/users/me").status_code == 401
    c = reg(app_)
    assert c.put("/api/users/me/submission", json={"url": "https://x.dz"}).status_code == 200
    del c.headers["X-CSRF-Token"]
    assert c.put("/api/users/me/submission", json={"url": "https://x.dz"}).status_code == 403
    c.headers["X-CSRF-Token"] = "wrong"
    assert c.put("/api/users/me/submission", json={"url": "https://x.dz"}).status_code == 403
    assert c.get("/api/users/me").status_code == 200  # safe methods need no CSRF header
    assert c.get("/api/auth/session").json()["csrf_token"]


def test_logout_clears_session(app_):
    c = reg(app_)
    assert c.post("/api/auth/logout").status_code == 204
    assert c.get("/api/users/me").status_code == 401


def test_login_rate_limit(app_):
    c = new_client(app_)
    for _ in range(settings.login_max_failures):
        assert c.post("/api/auth/login", json={"email": ADMIN_EMAIL, "password": "nope"}).status_code == 401
    r = c.post("/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PW})  # even the right password is blocked
    assert r.status_code == 429 and int(r.headers["retry-after"]) > 0


# ---------------------------------------------------------------- registration
def test_member_validation(app_):
    c = new_client(app_)
    post = lambda **kw: c.post("/api/auth/register", json=body(**kw))  # noqa: E731
    assert post(member_emails=["only@gmail.com"]).status_code == 422
    assert post(member_emails=[f"x{i}@gmail.com" for i in range(5)]).status_code == 422
    assert post(member_emails=["a@gmail.com", "b@yahoo.com"]).status_code == 422
    assert post(member_emails=["a@gmail.com", "A@gmail.com"]).status_code == 422
    assert post(member_emails=["leader1@mail.dz", "b@gmail.com"]).status_code == 422
    assert post().status_code == 201


def test_no_double_registration(app_):
    reg(app_, 1)
    c = new_client(app_)
    assert c.post("/api/auth/register", json=body(2, member_emails=["m1a@gmail.com", "other@gmail.com"])).status_code == 409
    assert c.post("/api/auth/register", json=body(1)).status_code == 409


# ---------------------------------------------------------------- admin review + private mails
def test_admin_only_review_and_private_notifications(app_):
    h = reg(app_)
    assert h.get("/api/admin/stats").status_code == 403
    adm = admin(app_)
    uid = h.get("/api/users/me").json()["id"]
    rows = outbox_rows()  # registration confirmation: ONE row per address, never a shared To
    assert sorted(r.to_addr for r in rows) == ["leader1@mail.dz", "m1a@gmail.com", "m1b@gmail.com"]
    assert all("," not in r.to_addr for r in rows)
    before = len(rows)
    r = adm.patch(f"/api/admin/users/{uid}/status", json={"status": "accepted"})
    assert r.json()["status"] == "accepted"
    new = outbox_rows()[before:]
    assert sorted(x.to_addr for x in new) == ["leader1@mail.dz", "m1a@gmail.com", "m1b@gmail.com"]
    assert all(x.subject == "THE LAST PROTOCOL - your team is ACCEPTED / équipe ACCEPTÉE" for x in new)
    adm.patch(f"/api/admin/users/{uid}/status", json={"status": "accepted"})  # unchanged -> no extra mail
    assert len(outbox_rows()) == before + 3
    st = adm.get("/api/admin/stats").json()
    assert st["accepted"] == 1 and st["participants"] == 3 and st["by_size"]["3"] == 1
    assert "participants" in adm.get("/api/admin/export.csv").headers["content-disposition"]
    assert adm.get("/api/admin/users?q=team 1").json()[0]["team"]["name"] == "Team 1"


# ---------------------------------------------------------------- mail queue / retry
def test_outbox_delivery_retry_and_giveup(app_, monkeypatch):
    reg(app_)
    adm = admin(app_)
    calls = []
    monkeypatch.setattr(mailer, "deliver", lambda rows: calls.append(len(rows)) or {r.id: "SMTP down" for r in rows})
    assert mailer.process_outbox(Session) == 0
    assert adm.get("/api/admin/outbox").json() == {"pending": 3, "sent": 0, "failed": 0}
    monkeypatch.setattr(settings, "mail_max_attempts", 2)
    with Session() as db:  # make them due again
        for r in db.scalars(select(EmailOutbox)):
            r.next_attempt_at = r.created_at
        db.commit()
    mailer.process_outbox(Session)
    assert adm.get("/api/admin/outbox").json() == {"pending": 0, "sent": 0, "failed": 3}
    monkeypatch.setattr(mailer, "deliver", lambda rows: {r.id: None for r in rows})
    assert adm.post("/api/admin/outbox/retry").json()["pending"] == 3
    assert mailer.process_outbox(Session) == 3
    assert adm.get("/api/admin/outbox").json() == {"pending": 0, "sent": 3, "failed": 0}


def test_mail_is_sent_from_admin_address(monkeypatch):
    monkeypatch.setattr(settings, "mail_from", "")
    monkeypatch.setattr(settings, "smtp_user", "")
    monkeypatch.setattr(settings, "admin_email", ADMIN_EMAIL)
    row = EmailOutbox(to_addr="a@gmail.com", subject="s", body="b")
    msg = mailer._build(row)
    assert msg["From"] == ADMIN_EMAIL and msg["To"] == "a@gmail.com"


# ---------------------------------------------------------------- capacity
def test_capacity_limit_and_no_lowering_below_taken(app_):
    adm = admin(app_)
    assert adm.put("/api/admin/capacity", json={"capacity": 2}).status_code == 200
    reg(app_, 1)
    reg(app_, 2)
    assert new_client(app_).post("/api/auth/register", json=body(3)).status_code == 409  # full
    r = adm.put("/api/admin/capacity", json={"capacity": 1})  # 2 teams already registered
    assert r.status_code == 409 and "2" in r.json()["detail"]
    assert adm.get("/api/admin/stats").json()["capacity"] == 2
    assert adm.put("/api/admin/capacity", json={"capacity": 5}).status_code == 200


# ---------------------------------------------------------------- CSV injection
def test_csv_formula_injection_is_neutralised(app_):
    reg(app_, 1, team_name="=HYPERLINK(\"http://evil\")", university="+cmd|' /C calc'!A0", name="@SUM(1+1)")
    text = admin(app_).get("/api/admin/export.csv").text
    row = list(csv.reader(io.StringIO(text)))[1]
    assert row[1].startswith("'=") and row[2].startswith("'@") and row[5].startswith("'+")
    assert not any(cell[:1] in "=+-@" for cell in row if cell)


# ---------------------------------------------------------------- admin accounts
def test_add_and_remove_admins(app_):
    adm = admin(app_)
    r = adm.post("/api/admin/admins", json={"name": "Second Admin", "email": "second@test.dz", "password": "AnotherLongPass1"})
    assert r.status_code == 201, r.text
    new_id = r.json()["id"]
    assert adm.post("/api/admin/admins", json={"name": "Dup", "email": "SECOND@test.dz", "password": "AnotherLongPass1"}).status_code == 409
    assert adm.post("/api/admin/admins", json={"name": "Weak", "email": "w@test.dz", "password": "short"}).status_code == 422
    assert len(adm.get("/api/admin/admins").json()) == 2
    second = login(app_, "second@test.dz", "AnotherLongPass1")
    assert second.get("/api/admin/stats").status_code == 200
    assert second.delete(f"/api/admin/admins/{new_id}").status_code == 409        # not yourself
    assert second.delete("/api/admin/admins/TLP-ADMIN").status_code == 409        # not the main admin
    assert adm.delete(f"/api/admin/admins/{new_id}").status_code == 204
    assert new_client(app_).post("/api/auth/login", json={"email": "second@test.dz", "password": "AnotherLongPass1"}).status_code == 401
    assert reg(app_).post("/api/admin/admins", json={"name": "X", "email": "x@test.dz", "password": "AnotherLongPass1"}).status_code == 403


# ---------------------------------------------------------------- QR check-in
def test_checkin_flow(app_):
    h = reg(app_)
    adm = admin(app_)
    ticket = h.get("/api/users/me").json()["id"]
    assert adm.post("/api/admin/checkin", json={"code": ticket}).status_code == 409        # still pending
    adm.patch(f"/api/admin/users/{ticket}/status", json={"status": "accepted"})
    first = adm.post("/api/admin/checkin", json={"code": ticket.lower()}).json()
    assert first["already_checked_in"] is False and first["team_name"] == "Team 1" and first["size"] == 3
    again = adm.post("/api/admin/checkin", json={"code": ticket}).json()
    assert again["already_checked_in"] is True and again["checked_in_at"] == first["checked_in_at"]
    assert adm.get("/api/admin/stats").json()["checked_in"] == 1
    assert adm.post("/api/admin/checkin", json={"code": "TLP-ZZZZZZ"}).status_code == 404
    assert adm.post("/api/admin/checkin", json={"code": "hello world"}).status_code == 422
    assert h.post("/api/admin/checkin", json={"code": ticket}).status_code == 403
    assert adm.delete(f"/api/admin/checkin/{ticket}").status_code == 204
    assert adm.get("/api/admin/stats").json()["checked_in"] == 0


# ---------------------------------------------------------------- configuration / seed
def test_production_refuses_unsafe_config():
    good = dict(_env_file=None, environment="production", secret_key="x" * 40,
                admin_email="boss@example.dz", admin_password="a-long-random-Password-42")
    assert Settings(**good).cookie_secure is True
    for bad in ({"secret_key": "dev-secret-change-me"}, {"secret_key": "short"}, {"admin_password": "admin2049"},
                {"admin_password": ""}, {"admin_email": ""}, {"secret_key": "CHANGE_ME" + "x" * 40}):
        with pytest.raises(ValueError):
            Settings(**{**good, **bad})


def test_seed_replaces_old_default_admin(app_, monkeypatch):
    with Session() as db:  # database created by the previous version
        old = db.get(User, "TLP-ADMIN")
        old.email, old.password_hash = "admin@cywork.dz", hash_password("admin2049")
        db.commit()
    main.seed()
    c = new_client(app_)
    assert c.post("/api/auth/login", json={"email": "admin@cywork.dz", "password": "admin2049"}).status_code == 401
    assert c.post("/api/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PW}).status_code == 200
    with Session() as db:
        assert db.get(User, "TLP-ADMIN").role == Role.admin and db.get(User, "TLP-ADMIN").status == Status.accepted
