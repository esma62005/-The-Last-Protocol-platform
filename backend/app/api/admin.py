import csv
import io
import logging
import re
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.api.deps import admin_only
from app.core.security import hash_password
from app.db.session import get_db
from app.models import Announcement, Role, Status, Team, User
from app.schemas import (
    AdminCreateIn, AdminOut, AdminStats, AdminTeamOut, AnnouncementIn, AnnouncementOut, CapacityIn, CheckInIn,
    CheckInOut, OutboxStats, StatusIn, UserOut,
)
from app.services.mailer import outbox_stats, queue_status, retry_failed
from app.services.registration import _known_emails, get_capacity, seats_taken, set_capacity, unique_id

log = logging.getLogger("admin")
TICKET = re.compile(r"^TLP-[A-Z0-9]{6}$")

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(admin_only)])
PARTICIPANT = User.role == Role.participant


@router.get("/stats", response_model=AdminStats)
def stats(db: Session = Depends(get_db)):
    count = lambda *w: db.scalar(select(func.count(User.id)).where(PARTICIPANT, *w)) or 0  # noqa: E731
    cap = get_capacity(db)
    sizes: dict[str, int] = {"3": 0, "4": 0, "5": 0}
    people = 0
    for u in db.scalars(select(User).where(PARTICIPANT, User.status != Status.rejected)):
        n = 1 + (len(u.team.member_emails) if u.team else 0)
        people += n
        sizes[str(n)] = sizes.get(str(n), 0) + 1
    return AdminStats(
        total=count(),
        accepted=count(User.status == Status.accepted),
        pending=count(User.status == Status.pending),
        rejected=count(User.status == Status.rejected),
        capacity=cap,
        seats_left=max(0, cap - seats_taken(db)),
        participants=people,
        by_size=sizes,
        teams=db.scalar(select(func.count(Team.id))) or 0,
        checked_in=count(User.checked_in_at.is_not(None)),
    )


def _query(status_: str | None, q: str | None):
    stmt = select(User).outerjoin(Team, User.team_id == Team.id).where(PARTICIPANT).order_by(User.created_at.desc())
    if status_ and status_ != "all":
        stmt = stmt.where(User.status == Status(status_))
    if q:
        like = f"%{q.lower()}%"
        stmt = stmt.where(or_(func.lower(User.name).like(like), func.lower(User.email).like(like),
                              func.lower(User.university).like(like), func.lower(Team.name).like(like),
                              func.lower(Team.members_json).like(like)))
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
    changed = user.status.value != data.status
    user.status = Status(data.status)
    db.commit()
    if changed and data.status in ("accepted", "rejected"):  # queue one private e-mail per member (leader included)
        queue_status(db, user, data.status)
    return user


@router.get("/teams", response_model=list[AdminTeamOut])
def teams(db: Session = Depends(get_db)):
    return [AdminTeamOut(id=t.id, name=t.name, size=1 + len(t.member_emails),
                         lead_name=t.lead.name if t.lead else None,
                         lead_email=t.lead.email if t.lead else None, member_emails=t.member_emails)
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
    taken = seats_taken(db)
    if data.capacity < taken:  # would leave more registered teams than seats
        raise HTTPException(409, f"Cannot set the capacity to {data.capacity}: {taken} teams are already registered "
                                 f"(not rejected). Choose {taken} or more, or reject some teams first.")
    set_capacity(db, data.capacity)
    return stats(db)


# ---------- admin accounts ----------
@router.get("/admins", response_model=list[AdminOut])
def list_admins(db: Session = Depends(get_db)):
    return db.scalars(select(User).where(User.role == Role.admin).order_by(User.created_at)).all()


@router.post("/admins", response_model=AdminOut, status_code=201)
def add_admin(data: AdminCreateIn, me: User = Depends(admin_only), db: Session = Depends(get_db)):
    email = data.email.lower()
    if email in _known_emails(db):
        raise HTTPException(409, f"{email} is already used by another account.")
    admin = User(id=unique_id(db, User, "ADM"), name=data.name.strip(), email=email,
                 password_hash=hash_password(data.password), role=Role.admin, status=Status.accepted)
    db.add(admin)
    db.commit()
    log.info("Admin %s created by %s", email, me.email)
    return admin


@router.delete("/admins/{admin_id}", status_code=204)
def remove_admin(admin_id: str, me: User = Depends(admin_only), db: Session = Depends(get_db)):
    target = db.get(User, admin_id)
    if not target or target.role != Role.admin:
        raise HTTPException(404, "Admin not found.")
    if target.id == me.id:
        raise HTTPException(409, "You cannot remove your own account.")
    if target.id == "TLP-ADMIN":
        raise HTTPException(409, "The main admin (defined in .env) cannot be removed here.")
    db.delete(target)
    db.commit()
    log.info("Admin %s removed by %s", target.email, me.email)


# ---------- event-day check-in (QR scanner) ----------
@router.post("/checkin", response_model=CheckInOut)
def check_in(data: CheckInIn, me: User = Depends(admin_only), db: Session = Depends(get_db)):
    code = data.code.strip().upper()
    if not TICKET.match(code):
        raise HTTPException(422, "This is not a valid ticket QR code.")
    user = db.get(User, code)
    if not user or user.role != Role.participant:
        raise HTTPException(404, "Unknown ticket.")
    if user.status != Status.accepted:
        raise HTTPException(409, f"Team \"{user.team.name if user.team else user.name}\" is {user.status.value}: entry not allowed.")
    already = user.checked_in_at is not None
    if not already:
        user.checked_in_at, user.checked_in_by = datetime.now(timezone.utc), me.id
        db.commit()
    members = user.team.member_emails if user.team else []
    return CheckInOut(ticket=user.id, team_name=user.team.name if user.team else user.name, leader_name=user.name,
                      size=1 + len(members), member_emails=members, status=user.status.value,
                      checked_in_at=user.checked_in_at, already_checked_in=already)


@router.delete("/checkin/{ticket}", status_code=204)
def undo_check_in(ticket: str, db: Session = Depends(get_db)):
    user = db.get(User, ticket.upper())
    if not user or user.role != Role.participant:
        raise HTTPException(404, "Unknown ticket.")
    user.checked_in_at = user.checked_in_by = None
    db.commit()


# ---------- e-mail queue ----------
@router.get("/outbox", response_model=OutboxStats)
def outbox(db: Session = Depends(get_db)):
    return outbox_stats(db)


@router.post("/outbox/retry", response_model=OutboxStats)
def outbox_retry(db: Session = Depends(get_db)):
    retry_failed(db)
    return outbox_stats(db)


def csv_safe(value) -> str:
    """Neutralise CSV/Excel formula injection: a cell starting with = + - @ (or tab / CR) is prefixed with an apostrophe."""
    text = "" if value is None else str(value)
    if text[:1] in ("=", "+", "-", "@", "\t", "\r") or text.lstrip()[:1] in ("=", "+", "-", "@"):
        return "'" + text
    return text


@router.get("/export.csv")
def export_csv(db: Session = Depends(get_db)):
    cols = ["id", "team", "leader", "email", "member_emails", "university", "field_of_study", "level",
            "skills", "experience", "status", "checked_in_at", "submission_url"]
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(cols)
    for u in db.scalars(_query(None, None)):
        w.writerow([csv_safe(c) for c in (
            u.id, u.team.name if u.team else "", u.name, u.email,
            " ; ".join(u.team.member_emails) if u.team else "", u.university, u.field_of_study,
            u.level, u.skills, u.experience, u.status.value,
            u.checked_in_at.isoformat() if u.checked_in_at else "", u.submission_url)])
    return Response(buf.getvalue(), media_type="text/csv",
                    headers={"Content-Disposition": "attachment; filename=participants.csv"})
