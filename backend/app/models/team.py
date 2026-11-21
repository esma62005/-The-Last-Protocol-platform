from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Team(Base):
    __tablename__ = "teams"

    id: Mapped[str] = mapped_column(String(16), primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
    code: Mapped[str] = mapped_column(String(16), unique=True, index=True)  # invitation code
    lead_id: Mapped[str | None] = mapped_column(
        ForeignKey("users.id", use_alter=True, name="fk_team_lead", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    members = relationship("User", back_populates="team", foreign_keys="User.team_id")
    lead = relationship("User", foreign_keys=[lead_id], post_update=True)
