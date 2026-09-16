"""Sensor Entity Model.

Represents a specific sensing modality mounted on an Integrated Node.
Phase 0 Reference: Sec. 4.1-4.5; BE-REQ-008 to BE-REQ-013
"""

from typing import List, Optional
from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.db.base import Base


class Sensor(Base):
    """Sensor capability persistent entity."""

    __tablename__ = "sensors"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    node_id: Mapped[int] = mapped_column(
        ForeignKey("integrated_nodes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # Extensible string representation (NOT a rigid enum)
    sensor_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    # Optional sub-sensor/channel identifier (e.g. "axis_x", "ch4_main")
    sensor_identifier: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    # Physical unit: marked TBD (column provided for flexibility without assumed defaults)
    unit: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    node: Mapped["IntegratedNode"] = relationship("IntegratedNode", back_populates="sensors")
    readings: Mapped[List["SensorReading"]] = relationship(
        "SensorReading",
        back_populates="sensor",
        cascade="save-update, merge",
    )

    def __repr__(self) -> str:
        return (
            f"<Sensor(id={self.id}, type='{self.sensor_type}', "
            f"node_id={self.node_id}, active={self.is_active})>"
        )
