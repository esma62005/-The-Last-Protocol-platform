from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import new_code
from app.models import Team, User
from app.services.registration import unique_id


def create_team(db: Session, user: User, name: str) -> Team:
    if user.team_id:
        raise HTTPException(status.HTTP_409_CONFLICT, "You are already in a team.")
    team = Team(id=unique_id(db, Team), name=name.strip(), code=new_code())
    db.add(team)
    db.flush()
    team.lead_id = user.id
    user.team_id = team.id
    db.commit()
    return team


def join_team(db: Session, user: User, code: str) -> Team:
    if user.team_id:
        raise HTTPException(status.HTTP_409_CONFLICT, "You are already in a team.")
    team = db.scalar(select(Team).where(Team.code == code.strip().upper()))
    if not team:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Code not found.")
    if len(team.members) >= settings.max_team_size:
        raise HTTPException(status.HTTP_409_CONFLICT, f"Team is full ({settings.max_team_size} max).")
    user.team_id = team.id
    db.commit()
    db.refresh(team)
    return team


def leave_team(db: Session, user: User) -> None:
    team = user.team
    if not team:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "You are not in a team.")
    user.team_id = None
    db.flush()
    remaining = [m for m in team.members if m.id != user.id]
    if not remaining:
        team.lead_id = None
        db.flush()
        db.delete(team)
    elif team.lead_id == user.id:
        team.lead_id = remaining[0].id
    db.commit()
