from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import current_user
from app.db.session import get_db
from app.models import User
from app.schemas import SubmissionIn, UserOut

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(current_user)):
    return user


@router.put("/me/submission", response_model=UserOut)
def set_submission(data: SubmissionIn, user: User = Depends(current_user), db: Session = Depends(get_db)):
    user.submission_url = data.url.strip()
    db.commit()
    return user
