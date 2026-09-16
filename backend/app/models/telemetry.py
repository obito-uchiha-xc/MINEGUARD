"""Sensor Reading (Telemetry Observation) Entity Model.

Represents an individual time-series observation from an Integrated Node sensor.
Phase 0 Reference: Sec. 7, 9; BE-REQ-004, BE-REQ-005, BE-REQ-006
"""

from datetime import datetime
from sqlalchemy import DateTime, Float, ForeignKey, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.db.base import Base


class SensorReading(Base):
    """Time-series sensor observation persistent entity."""

    __tablename__ = "sensor_readings"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    sensor_id: Mapped[int] = mapped_column(
        ForeignKey("sensors.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    node_id: Mapped[int] = mapped_column(
        ForeignKey("integrated_nodes.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )
    # Observation timestamp in UTC
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )
    # Measured numerical value
    value: Mapped[float] = mapped_column(Float, nullable=False)

    # Relationships
    sensor: Mapped["Sensor"] = relationship("Sensor", back_populates="readings")
    node: Mapped["IntegratedNode"] = relationship("IntegratedNode", back_populates="readings")

    # Composite indexes for high-frequency time-series querying
    __table_args__ = (
        Index("ix_sensor_readings_node_timestamp", "node_id", "timestamp"),
        Index("ix_sensor_readings_sensor_timestamp", "sensor_id", "timestamp"),
    )

    def __repr__(self) -> str:
        return (
            f"<SensorReading(id={self.id}, sensor_id={self.sensor_id}, "
            f"node_id={self.node_id}, timestamp='{self.timestamp}', value={self.value})>"
        )
