"""Mine Entity Model.

Represents a monitored mining facility or site.
Phase 0 Reference: Sec. 1, 12, BE-REQ-001
"""

from typing import List, Optional
from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.db.base import Base


class Mine(Base):
    """Mine facility persistent entity."""

    __tablename__ = "mines"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    code: Mapped[Optional[str]] = mapped_column(String(64), unique=True, nullable=True, index=True)

    # 1-to-many relationship with zones
    zones: Mapped[List["Zone"]] = relationship(
        "Zone",
        back_populates="mine",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    def __repr__(self) -> str:
        return f"<Mine(id={self.id}, name='{self.name}', code='{self.code}')>"
