"""AI Anomaly Detection Models.

Phase 7 Scope: Defines persistent records of statistical anomaly evaluations.
"""

from datetime import datetime
from typing import Any, Dict, Optional
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.db.base import Base


class AIAnomalyRecord(Base):
    """Persistent record of an AI / statistical anomaly evaluation.

    🟢 SPEC: BE-REQ-015 — Anomaly detection across sensor streams.
    🔵 DECISION D-029: Statistical unsupervised anomaly detection (rolling Z-score).
    🔵 DECISION D-030: Decision threshold distinct from engineering safety limits.
    """

    __tablename__ = "ai_anomalies"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    node_id: Mapped[int] = mapped_column(
        ForeignKey("integrated_nodes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    sensor_type: Mapped[Optional[str]] = mapped_column(
        String(64),
        nullable=True,
        index=True,
    )
    is_anomaly: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
        nullable=False,
        index=True,
    )
    anomaly_score: Mapped[float] = mapped_column(Float, nullable=False)
    threshold: Mapped[float] = mapped_column(Float, nullable=False)
    model_name: Mapped[str] = mapped_column(String(64), nullable=False)
    model_version: Mapped[str] = mapped_column(String(32), nullable=False)
    features: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    explanation: Mapped[str] = mapped_column(String(255), nullable=False)
    detected_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )

    # Relationships
    node: Mapped["IntegratedNode"] = relationship("IntegratedNode", lazy="selectin")

    def __repr__(self) -> str:
        return (
            f"<AIAnomalyRecord(id={self.id}, node_id={self.node_id}, "
            f"sensor='{self.sensor_type}', is_anomaly={self.is_anomaly}, score={self.anomaly_score:.2f})>"
        )
