from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

import app.models  # noqa: F401  (register models)
from app.api.router import api_router
from app.core.config import settings
from app.core.security import hash_password
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models import Announcement, Role, Status, User
from app.services.registration import set_capacity


def seed() -> None:
    """Create the admin account + defaults on first start."""
    with SessionLocal() as db:
        if not db.scalar(select(User).where(User.email == settings.admin_email)):
            db.add(User(id="TLP-ADMIN", name="Organizer", email=settings.admin_email,
                        password_hash=hash_password(settings.admin_password),
                        role=Role.admin, status=Status.accepted))
            db.add(Announcement(text="Registration is open. Welcome, agents."))
            db.commit()
            set_capacity(db, settings.default_capacity)


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(engine)  # dev convenience; use Alembic migrations in production
    seed()
    yield


app = FastAPI(title="The Last Protocol – CYWORK Hackathon API", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=settings.cors_origins.split(","),
                   allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.include_router(api_router)


@app.get("/health")
def health():
    return {"ok": True}
