from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password, new_code
from app.models import Role, Setting, Status, User
from app.schemas import RegisterIn


def get_capacity(db: Session) -> int:
    row = db.get(Setting, "capacity")
    return int(row.value) if row else settings.default_capacity


def set_capacity(db: Session, value: int) -> None:
    row = db.get(Setting, "capacity")
    if row:
        row.value = str(value)
    else:
        db.add(Setting(key="capacity", value=str(value)))
    db.commit()


def seats_taken(db: Session) -> int:
    q = select(func.count(User.id)).where(User.role == Role.participant, User.status != Status.rejected)
    return db.scalar(q) or 0


def unique_id(db: Session, model) -> str:
    while True:
        code = new_code()
        if not db.get(model, code):
            return code


def register_user(db: Session, data: RegisterIn) -> User:
    email = data.email.lower()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered.")
    if seats_taken(db) >= get_capacity(db):
        raise HTTPException(status.HTTP_409_CONFLICT, "No seats left.")
    payload = data.model_dump(exclude={"password", "accept_rules", "email"})
    user = User(id=unique_id(db, User), email=email, password_hash=hash_password(data.password), **payload)
    db.add(user)
    db.commit()
    return user
