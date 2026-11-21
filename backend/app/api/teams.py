from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import current_user
from app.db.session import get_db
from app.models import Team, User
from app.schemas import TeamCreateIn, TeamJoinIn, TeamOut
from app.services import teams as svc

router = APIRouter(prefix="/teams", tags=["teams"])


@router.get("/me", response_model=TeamOut | None)
def my_team(user: User = Depends(current_user)) -> Team | None:
    return user.team


@router.post("", response_model=TeamOut, status_code=201)
def create(data: TeamCreateIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    return svc.create_team(db, user, data.name)


@router.post("/join", response_model=TeamOut)
def join(data: TeamJoinIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    return svc.join_team(db, user, data.code)


@router.post("/leave", status_code=204)
def leave(user: User = Depends(current_user), db: Session = Depends(get_db)):
    svc.leave_team(db, user)
