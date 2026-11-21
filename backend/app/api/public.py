from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Announcement
from app.schemas import AnnouncementOut, PublicStats
from app.services.registration import get_capacity, seats_taken

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/stats", response_model=PublicStats)
def stats(db: Session = Depends(get_db)):
    return PublicStats(capacity=get_capacity(db), taken=seats_taken(db))


@router.get("/announcements", response_model=list[AnnouncementOut])
def announcements(db: Session = Depends(get_db)):
    return db.scalars(select(Announcement).order_by(Announcement.id.desc())).all()
