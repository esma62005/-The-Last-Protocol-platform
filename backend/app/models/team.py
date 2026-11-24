import json
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Team(Base):
    """A team registers as one unit: the leader owns the account, the other members are identified by Gmail."""

    __tablename__ = "teams"

    id: Mapped[str] = mapped_column(String(16), primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
    lead_id: Mapped[str | None] = mapped_column(
        ForeignKey("users.id", use_alter=True, name="fk_team_lead", ondelete="SET NULL"), nullable=True
    )
    members_json: Mapped[str] = mapped_column(Text, default="[]")  # JSON list of the other members' Gmail addresses
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    members = relationship("User", back_populates="team", foreign_keys="User.team_id")
    lead = relationship("User", foreign_keys=[lead_id], post_update=True)

    @property
    def member_emails(self) -> list[str]:
        return json.loads(self.members_json or "[]")
