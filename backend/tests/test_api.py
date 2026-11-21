import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import app.main as main
from app.db.base import Base
from app.db.session import get_db

engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
Session = sessionmaker(bind=engine, expire_on_commit=False)


@pytest.fixture()
def client(monkeypatch):
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    monkeypatch.setattr(main, "engine", engine)
    monkeypatch.setattr(main, "SessionLocal", Session)
    main.seed()

    def override():
        with Session() as db:
            yield db

    main.app.dependency_overrides[get_db] = override
    yield TestClient(main.app)
    main.app.dependency_overrides.clear()


def reg(client, n=1, **kw):
    body = dict(name=f"User {n}", email=f"u{n}@mail.dz", password="password1", phone="0550000000",
                university="Univ. Tlemcen", field_of_study="CS", accept_rules=True, **kw)
    r = client.post("/api/auth/register", json=body)
    assert r.status_code == 201, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def admin(client):
    r = client.post("/api/auth/login", json={"email": "admin@cywork.dz", "password": "admin2049"})
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def test_register_login_me(client):
    h = reg(client)
    me = client.get("/api/users/me", headers=h).json()
    assert me["status"] == "pending" and me["id"].startswith("TLP-")
    assert client.post("/api/auth/register", json={"email": "u1@mail.dz"}).status_code == 422
    assert client.post("/api/auth/login", json={"email": "u1@mail.dz", "password": "bad"}).status_code == 401


def test_team_flow(client):
    a, b = reg(client, 1), reg(client, 2)
    team = client.post("/api/teams", json={"name": "Alpha"}, headers=a).json()
    joined = client.post("/api/teams/join", json={"code": team["code"]}, headers=b).json()
    assert len(joined["members"]) == 2
    assert client.post("/api/teams/leave", headers=a).status_code == 204
    assert client.get("/api/teams/me", headers=b).json()["lead_id"] == client.get("/api/users/me", headers=b).json()["id"]


def test_admin_only_and_review(client):
    h = reg(client)
    assert client.get("/api/admin/stats", headers=h).status_code == 403
    adm = admin(client)
    uid = client.get("/api/users/me", headers=h).json()["id"]
    r = client.patch(f"/api/admin/users/{uid}/status", json={"status": "accepted"}, headers=adm)
    assert r.json()["status"] == "accepted"
    assert client.get("/api/admin/stats", headers=adm).json()["accepted"] == 1
    assert "participants" in client.get("/api/admin/export.csv", headers=adm).headers["content-disposition"]


def test_capacity_limit(client):
    adm = admin(client)
    client.put("/api/admin/capacity", json={"capacity": 1}, headers=adm)
    reg(client, 1)
    r = client.post("/api/auth/register", json=dict(name="U2", email="u2@mail.dz", password="password1",
                    phone="0550000000", university="X", field_of_study="CS", accept_rules=True))
    assert r.status_code == 409
