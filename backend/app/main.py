from contextlib import asynccontextmanager

import logging

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import inspect, select, text

import app.models  # noqa: F401  (register models)
from app.api.router import api_router
from app.core.config import settings
from app.core.security import hash_password
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models import Announcement, Role, Setting, Status, User
from app.core.security import verify_password
from app.services import mailer
from app.services.registration import set_capacity


def migrate_legacy() -> None:
    """Upgrade a database created by the previous version (tracks + team codes) to the team-registration schema.
    Without this, inserts hit the old NOT NULL columns, the server answers 500 and the browser shows "Failed to fetch"."""
    insp = inspect(engine)
    steps: list[str] = []
    if insp.has_table("users"):
        cols = {c["name"] for c in insp.get_columns("users")}
        steps += [f"ALTER TABLE users DROP COLUMN {c}" for c in ("track", "participation_type", "phone") if c in cols]
        if "checked_in_at" not in cols:
            steps.append("ALTER TABLE users ADD COLUMN checked_in_at TIMESTAMP WITH TIME ZONE")
        if "checked_in_by" not in cols:
            steps.append("ALTER TABLE users ADD COLUMN checked_in_by VARCHAR(16)")
    if insp.has_table("teams"):
        cols = {c["name"] for c in insp.get_columns("teams")}
        if "code" in cols:
            steps.append("ALTER TABLE teams DROP COLUMN code")
        if "members_json" not in cols:
            steps.append("ALTER TABLE teams ADD COLUMN members_json TEXT NOT NULL DEFAULT '[]'")
    for sql in steps:  # one transaction per statement so a failure cannot poison the others
        try:
            with engine.begin() as conn:
                conn.execute(text(sql))
        except Exception:
            logging.getLogger("migrate").exception("Legacy migration step failed: %s", sql)


def seed() -> None:
    """Create/refresh the main admin without taking an email already owned by another user."""
    log = logging.getLogger("seed")
    with SessionLocal() as db:
        email, password = settings.admin_email.strip().lower(), settings.admin_password
        fresh = False

        if not email or not password:
            log.warning("ADMIN_EMAIL / ADMIN_PASSWORD are not set in .env: no admin account was created.")
        else:
            main_admin = db.get(User, "TLP-ADMIN")

            # Never assign an address that belongs to a different account.
            email_owner = db.scalar(
                select(User).where(User.email == email, User.id != "TLP-ADMIN")
            )

            if main_admin:
                if main_admin.email != email:
                    if email_owner:
                        log.error(
                            "Cannot change TLP-ADMIN email: ADMIN_EMAIL is already assigned "
                            "to another user (id=%s). Keeping the current admin email.",
                            email_owner.id,
                        )
                    else:
                        main_admin.email = email
                if not verify_password(password, main_admin.password_hash):
                    main_admin.password_hash = hash_password(password)
                main_admin.role, main_admin.status = Role.admin, Status.accepted
            elif email_owner:
                log.error(
                    "Cannot create TLP-ADMIN: ADMIN_EMAIL is already assigned "
                    "to another user (id=%s). No account was modified.",
                    email_owner.id,
                )
            else:
                db.add(
                    User(
                        id="TLP-ADMIN",
                        name="Organizer",
                        email=email,
                        password_hash=hash_password(password),
                        role=Role.admin,
                        status=Status.accepted,
                    )
                )
                fresh = True
            db.commit()

        if fresh:
            db.add(Announcement(text="Registration is open for teams of 3 to 5. Welcome, agents."))
            db.commit()

        if not db.get(Setting, "capacity"):
            set_capacity(db, settings.default_capacity)


@asynccontextmanager
async def lifespan(_: FastAPI):
    if not settings.is_production:  # production schema is managed ONLY by Alembic (alembic upgrade head)
        migrate_legacy()
        Base.metadata.create_all(engine)
    seed()
    mailer.start_worker(SessionLocal)
    yield
    mailer.stop_worker()


app = FastAPI(title="The Last Protocol – CYWORK Hackathon API", lifespan=lifespan)


@app.middleware("http")
async def json_errors(request: Request, call_next):
    """Turn crashes into a JSON 500 *inside* the CORS layer, so the browser shows the real error, not "Failed to fetch"."""
    try:
        return await call_next(request)
    except Exception:
        logging.getLogger("api").exception("Unhandled error on %s %s", request.method, request.url.path)
        return JSONResponse({"detail": "Server error. Check the backend logs."}, status_code=500)


# added last = outermost: every response (including errors) gets CORS headers
app.add_middleware(CORSMiddleware, allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip()],
                   allow_origin_regex=None if settings.is_production else r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
                   allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(api_router)


@app.get("/health")
def health():
    return {"ok": True}
