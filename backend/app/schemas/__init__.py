import re
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator

from app.models.user import Role, Status

StatusT = Literal["pending", "accepted", "rejected"]
GMAIL = re.compile(r"^[A-Za-z0-9._%+\-]+@(gmail|googlemail)\.com$", re.I)


class ORM(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------- auth ----------
class RegisterIn(BaseModel):
    """A whole team registers at once: the leader (account owner) + 2 to 4 other members (Gmail) = 3 to 5 people."""

    # team + leader
    team_name: str = Field(min_length=2, max_length=80)
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    university: str = Field(min_length=2, max_length=160)
    field_of_study: str = Field(min_length=2, max_length=120)
    level: str = "Licence 3"
    # other members
    member_emails: list[str] = Field(min_length=2, max_length=4)
    # optional info
    skills: str = ""
    experience: Literal["Beginner", "Intermediate", "Advanced"] = "Beginner"
    github: str = ""
    portfolio: str = ""
    motivation: str = ""
    previous_hackathons: str = ""
    special_requirements: str = ""
    accept_rules: Literal[True]

    @field_validator("member_emails")
    @classmethod
    def _gmail_only(cls, v: list[str]) -> list[str]:
        out = [e.strip().lower() for e in v]
        for e in out:
            if not GMAIL.match(e):
                raise ValueError(f"{e or 'Empty address'} is not a Gmail address.")
        if len(set(out)) != len(out):
            raise ValueError("Each member needs a different Gmail address.")
        return out

    @model_validator(mode="after")
    def _leader_not_member(self):
        if self.email.lower() in self.member_emails:
            raise ValueError("The leader's email must not be repeated in the members list.")
        return self


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    """The JWT itself travels in an HttpOnly cookie; JavaScript only gets the CSRF value."""

    role: str
    user_id: str
    csrf_token: str


# ---------- teams / users ----------
class TeamOut(ORM):
    id: str
    name: str
    lead_id: str | None
    member_emails: list[str]


class UserOut(ORM):
    id: str
    name: str
    email: EmailStr
    role: Role
    status: Status
    university: str
    field_of_study: str
    level: str
    skills: str
    experience: str
    submission_url: str
    team_id: str | None
    team: TeamOut | None = None
    checked_in_at: datetime | None = None
    created_at: datetime


class SubmissionIn(BaseModel):
    url: str = Field(max_length=500)


# ---------- public / admin ----------
class AnnouncementIn(BaseModel):
    text: str = Field(min_length=1, max_length=1000)


class AnnouncementOut(ORM):
    id: int
    text: str
    created_at: datetime


class PublicStats(BaseModel):
    capacity: int
    taken: int


class StatusIn(BaseModel):
    status: StatusT


class CapacityIn(BaseModel):
    capacity: int = Field(ge=1, le=10000)


class AdminStats(BaseModel):
    total: int  # teams registered
    accepted: int
    pending: int
    rejected: int
    capacity: int
    seats_left: int
    participants: int  # people in non-rejected teams
    by_size: dict[str, int]
    teams: int
    checked_in: int = 0  # teams already scanned at the entrance


class AdminTeamOut(ORM):
    id: str
    name: str
    size: int
    lead_name: str | None
    lead_email: str | None
    member_emails: list[str]


class AdminCreateIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=12, max_length=72)


class AdminOut(ORM):
    id: str
    name: str
    email: EmailStr
    created_at: datetime


class CheckInIn(BaseModel):
    code: str = Field(min_length=1, max_length=64)


class CheckInOut(BaseModel):
    ticket: str
    team_name: str
    leader_name: str
    size: int
    member_emails: list[str]
    status: StatusT
    checked_in_at: datetime
    already_checked_in: bool


class OutboxStats(BaseModel):
    pending: int
    sent: int
    failed: int
