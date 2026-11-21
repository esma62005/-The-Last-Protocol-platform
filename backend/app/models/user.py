import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Status(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"


class Role(str, enum.Enum):
    participant = "participant"
    admin = "admin"


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(16), primary_key=True)  # ticket id TLP-XXXXXX (QR)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[Role] = mapped_column(Enum(Role), default=Role.participant)
    status: Mapped[Status] = mapped_column(Enum(Status), default=Status.pending, index=True)

    # A · personal
    phone: Mapped[str] = mapped_column(String(30), default="")
    university: Mapped[str] = mapped_column(String(160), default="")
    field_of_study: Mapped[str] = mapped_column(String(120), default="")
    level: Mapped[str] = mapped_column(String(40), default="")
    # B · technical
    skills: Mapped[str] = mapped_column(Text, default="")
    experience: Mapped[str] = mapped_column(String(20), default="Beginner")
    github: Mapped[str] = mapped_column(String(255), default="")
    portfolio: Mapped[str] = mapped_column(String(255), default="")
    # C · participation
    participation_type: Mapped[str] = mapped_column(String(20), default="Individual")
    track: Mapped[str] = mapped_column(String(40), default="AI", index=True)
    # D · additional
    motivation: Mapped[str] = mapped_column(Text, default="")
    previous_hackathons: Mapped[str] = mapped_column(String(255), default="")
    special_requirements: Mapped[str] = mapped_column(String(255), default="")

    submission_url: Mapped[str] = mapped_column(String(500), default="")
    team_id: Mapped[str | None] = mapped_column(ForeignKey("teams.id", ondelete="SET NULL"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    team = relationship("Team", back_populates="members", foreign_keys=[team_id])
