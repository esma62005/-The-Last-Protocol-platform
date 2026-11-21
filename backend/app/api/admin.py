import csv
import io

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.api.deps import admin_only
from app.db.session import get_db
from app.models import Announcement, Role, Status, Team, User
from app.schemas import (
    TRACKS, AdminStats, AdminTeamOut, AnnouncementIn, AnnouncementOut, CapacityIn, StatusIn, UserOut,
)
from app.services.registration import get_capacity, seats_taken, set_capacity

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(admin_only)])
PARTICIPANT = User.role == Role.participant


@router.get("/stats", response_model=AdminStats)
def stats(db: Session = Depends(get_db)):
    count = lambda *w: db.scalar(select(func.count(User.id)).where(PARTICIPANT, *w)) or 0  # noqa: E731
    cap = get_capacity(db)
    return AdminStats(
        total=count(),
        accepted=count(User.status == Status.accepted),
        pending=count(User.status == Status.pending),
        rejected=count(User.status == Status.rejected),
        capacity=cap,
        seats_left=max(0, cap - seats_taken(db)),
        by_track={t: count(User.track == t) for t in TRACKS},
        teams=db.scalar(select(func.count(Team.id))) or 0,
    )


def _query(status_: str | None, q: str | None):
    stmt = select(User).where(PARTICIPANT).order_by(User.created_at.desc())
    if status_ and status_ != "all":
        stmt = stmt.where(User.status == Status(status_))
    if q:
        like = f"%{q.lower()}%"
        stmt = stmt.where(or_(func.lower(User.name).like(like), func.lower(User.email).like(like),
                              func.lower(User.university).like(like)))
    return stmt


@router.get("/users", response_model=list[UserOut])
def users(status: str | None = Query(None, pattern="^(all|pending|accepted|rejected)$"),
          q: str | None = None, db: Session = Depends(get_db)):
    return db.scalars(_query(status, q)).all()


@router.patch("/users/{user_id}/status", response_model=UserOut)
def set_status(user_id: str, data: StatusIn, db: Session = Depends(get_db)):
    user = db.get(User, user_id)
    if not user or user.role != Role.participant:
        raise HTTPException(404, "User not found.")
    user.status = Status(data.status)
    db.commit()
    return user


@router.get("/teams", response_model=list[AdminTeamOut])
def teams(db: Session = Depends(get_db)):
    return [AdminTeamOut(id=t.id, name=t.name, code=t.code, size=len(t.members),
                         lead_name=t.lead.name if t.lead else None)
            for t in db.scalars(select(Team).order_by(Team.created_at.desc()))]


@router.post("/announcements", response_model=AnnouncementOut, status_code=201)
def add_announcement(data: AnnouncementIn, db: Session = Depends(get_db)):
    a = Announcement(text=data.text.strip())
    db.add(a)
    db.commit()
    return a


@router.delete("/announcements/{ann_id}", status_code=204)
def delete_announcement(ann_id: int, db: Session = Depends(get_db)):
    a = db.get(Announcement, ann_id)
    if a:
        db.delete(a)
        db.commit()


@router.put("/capacity", response_model=AdminStats)
def capacity(data: CapacityIn, db: Session = Depends(get_db)):
    set_capacity(db, data.capacity)
    return stats(db)


@router.get("/export.csv")
def export_csv(db: Session = Depends(get_db)):
    cols = ["id", "name", "email", "phone", "university", "field_of_study", "level", "skills",
            "experience", "track", "participation_type", "status", "team_id", "submission_url"]
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(cols)
    for u in db.scalars(_query(None, None)):
        w.writerow([getattr(u, c).value if hasattr(getattr(u, c), "value") else getattr(u, c) or "" for c in cols])
    return Response(buf.getvalue(), media_type="text/csv",
                    headers={"Content-Disposition": "attachment; filename=participants.csv"})
