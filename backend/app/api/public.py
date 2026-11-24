
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Announcement, Team, User
from app.schemas import (
    AnnouncementOut,
    PublicStats,
    PublicTeamStatusIn,
    PublicTeamStatusOut,
)
from app.services.registration import get_capacity, seats_taken

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/stats", response_model=PublicStats)
def stats(db: Session = Depends(get_db)):
    return PublicStats(
        capacity=get_capacity(db),
        taken=seats_taken(db),
    )


@router.get("/announcements", response_model=list[AnnouncementOut])
def announcements(db: Session = Depends(get_db)):
    return db.scalars(
        select(Announcement).order_by(Announcement.id.desc())
    ).all()


@router.post("/status", response_model=PublicTeamStatusOut)
def team_status(
    data: PublicTeamStatusIn,
    db: Session = Depends(get_db),
):
    # Find the team using its registration code.
    team = db.get(Team, data.code.strip())

    # Use the same generic error for invalid codes and emails.
    if not team or not team.lead_id:
        raise HTTPException(
            status_code=404,
            detail="Team not found or email does not match.",
        )

    # The leader's account stores the team's registration status.
    leader = db.get(User, team.lead_id)

    if not leader:
        raise HTTPException(
            status_code=404,
            detail="Team not found or email does not match.",
        )

    # Only the leader or a registered team member can check the status.
    allowed_emails = {
        leader.email.strip().lower(),
        *(email.strip().lower() for email in team.member_emails),
    }

    if str(data.email).strip().lower() not in allowed_emails:
        raise HTTPException(
            status_code=404,
            detail="Team not found or email does not match.",
        )

    return PublicTeamStatusOut(
        team_name=team.name,
        code=team.id,
        members=[
            leader.email,
            *team.member_emails,
        ],
        status=leader.status.value,
    )

