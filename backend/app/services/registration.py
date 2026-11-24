import json

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_password, new_code
from app.models import Role, Setting, Status, Team, User
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
    """One seat = one team (= its leader account), unless the team was rejected."""
    q = select(func.count(User.id)).where(User.role == Role.participant, User.status != Status.rejected)
    return db.scalar(q) or 0


def unique_id(db: Session, model, prefix: str = "TLP") -> str:
    while True:
        code = new_code(prefix)
        if not db.get(model, code):
            return code


def _known_emails(db: Session) -> set[str]:
    emails = {e.lower() for e in db.scalars(select(User.email))}
    for t in db.scalars(select(Team)):
        emails.update(t.member_emails)
    return emails


def register_user(db: Session, data: RegisterIn) -> User:
    email = data.email.lower()
    clash = _known_emails(db) & {email, *data.member_emails}
    if clash:
        raise HTTPException(status.HTTP_409_CONFLICT, f"{sorted(clash)[0]} is already registered in a team.")
    if seats_taken(db) >= get_capacity(db):
        raise HTTPException(status.HTTP_409_CONFLICT, "Registrations are full.")

    team = Team(id=unique_id(db, Team), name=data.team_name.strip(), members_json=json.dumps(data.member_emails))
    db.add(team)
    db.flush()
    payload = data.model_dump(exclude={"password", "accept_rules", "email", "team_name", "member_emails"})
    user = User(id=unique_id(db, User), email=email, password_hash=hash_password(data.password),
                team_id=team.id, **payload)
    db.add(user)
    db.flush()
    team.lead_id = user.id
    db.commit()
    return user
