"""Zone Entity Model.

Represents a monitored operational sector/zone in a mine (e.g., Zone A, Zone B).
Phase 0 Reference: Sec. 9 (p. 6), BE-REQ-019
"""

from typing import List, Optional
from sqlalchemy import ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.db.base import Base


class Zone(Base):
    """Monitored zone persistent entity."""

    __tablename__ = "zones"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    mine_id: Mapped[int] = mapped_column(
        ForeignKey("mines.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    code: Mapped[Optional[str]] = mapped_column(String(64), nullable=True, index=True)

    # Relationships
    mine: Mapped["Mine"] = relationship("Mine", back_populates="zones", lazy="selectin")
    nodes: Mapped[List["IntegratedNode"]] = relationship(
        "IntegratedNode",
        back_populates="zone",
        cascade="save-update, merge",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Zone(id={self.id}, name='{self.name}', mine_id={self.mine_id})>"
