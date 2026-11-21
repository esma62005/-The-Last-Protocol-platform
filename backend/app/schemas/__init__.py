from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.user import Role, Status

TRACKS = ("AI", "Cybersecurity", "Web & Mobile", "Startup & Impact")
StatusT = Literal["pending", "accepted", "rejected"]


class ORM(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------- auth ----------
class RegisterIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    phone: str = Field(min_length=6, max_length=30)
    university: str = Field(min_length=2, max_length=160)
    field_of_study: str = Field(min_length=2, max_length=120)
    level: str = "Licence 3"
    skills: str = ""
    experience: Literal["Beginner", "Intermediate", "Advanced"] = "Beginner"
    github: str = ""
    portfolio: str = ""
    participation_type: Literal["Individual", "Team"] = "Individual"
    track: Literal["AI", "Cybersecurity", "Web & Mobile", "Startup & Impact"] = "AI"
    motivation: str = ""
    previous_hackathons: str = ""
    special_requirements: str = ""
    accept_rules: Literal[True]


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: str


# ---------- users ----------
class UserOut(ORM):
    id: str
    name: str
    email: EmailStr
    role: Role
    status: Status
    phone: str
    university: str
    field_of_study: str
    level: str
    skills: str
    experience: str
    track: str
    participation_type: str
    submission_url: str
    team_id: str | None
    created_at: datetime


class SubmissionIn(BaseModel):
    url: str = Field(max_length=500)


# ---------- teams ----------
class TeamCreateIn(BaseModel):
    name: str = Field(min_length=2, max_length=80)


class TeamJoinIn(BaseModel):
    code: str


class MemberOut(ORM):
    id: str
    name: str
    status: Status


class TeamOut(ORM):
    id: str
    name: str
    code: str
    lead_id: str | None
    members: list[MemberOut]


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
    total: int
    accepted: int
    pending: int
    rejected: int
    capacity: int
    seats_left: int
    by_track: dict[str, int]
    teams: int


class AdminTeamOut(ORM):
    id: str
    name: str
    code: str
    size: int
    lead_name: str | None
