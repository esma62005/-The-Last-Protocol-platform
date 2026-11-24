from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import current_user
from app.db.session import get_db
from app.models import Team, User
from app.schemas import SubmissionIn, TeamOut

router = APIRouter(prefix="/teams", tags=["teams"])


def _mine(db: Session, user: User) -> Team | None:
    return db.scalar(select(Team).where(Team.leader_id == user.id))


@router.get("/me", response_model=TeamOut | None)
def my_team(user: User = Depends(current_user), db: Session = Depends(get_db)):
    return _mine(db, user)


@router.put("/me/submission", response_model=TeamOut)
def set_submission(data: SubmissionIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    team = _mine(db, user)
    if not team:
        raise HTTPException(404, "Team not found.")
    team.submission_url = data.url.strip()
    db.commit()
    return team
