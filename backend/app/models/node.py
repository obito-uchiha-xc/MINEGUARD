"""Integrated Node Entity Model.

Represents a field-deployed Integrated Node monitoring physical and environmental parameters.
Phase 0 Reference: Sec. 4, 6, 12; BE-REQ-001, BE-REQ-003, BE-REQ-023
"""

from datetime import datetime
from typing import List, Optional
from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.db.base import Base


class IntegratedNode(Base):
    """Integrated Node persistent entity."""

    __tablename__ = "integrated_nodes"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    zone_id: Mapped[int] = mapped_column(
        ForeignKey("zones.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    # External / physical identifier (format marked TBD)
    node_identifier: Mapped[str] = mapped_column(
        String(128),
        unique=True,
        nullable=False,
        index=True,
    )
    # Operational status: e.g. ACTIVE, UNRESPONSIVE (supporting BE-REQ-023)
    status: Mapped[str] = mapped_column(
        String(32),
        default="ACTIVE",
        nullable=False,
        index=True,
    )
    # Heartbeat / latest telemetry timestamp
    last_seen_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
    )

    # Relationships
    zone: Mapped["Zone"] = relationship("Zone", back_populates="nodes", lazy="selectin")
    sensors: Mapped[List["Sensor"]] = relationship(
        "Sensor",
        back_populates="node",
        cascade="all, delete-orphan",
        lazy="selectin",
    )
    readings: Mapped[List["SensorReading"]] = relationship(
        "SensorReading",
        back_populates="node",
        cascade="save-update, merge",
    )

    def __repr__(self) -> str:
        return (
            f"<IntegratedNode(id={self.id}, identifier='{self.node_identifier}', "
            f"status='{self.status}', zone_id={self.zone_id})>"
        )
