"""Alert Entity Models.

Phase 6 Scope: Defines persistent alerts with lifecycle (ACTIVE/RESOLVED)
and deduplication keys.
"""

from datetime import datetime
from typing import Any, Dict, Optional
from sqlalchemy import DateTime, ForeignKey, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.db.base import Base


class Alert(Base):
    """Persistent safety alert entity.

    🟢 SPEC: BE-REQ-020, BE-REQ-022, BE-REQ-023 — Threshold, multi-parameter,
    and node-unresponsive alert conditions.
    🔵 DECISION D-026: Alert severity tiers (WARNING / CRITICAL).
    🔵 DECISION D-028: Alert deduplication via (node_id, condition_key, status='ACTIVE').
    """

    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    node_id: Mapped[int] = mapped_column(
        ForeignKey("integrated_nodes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    # Alert category: THRESHOLD, MULTI_PARAMETER, NODE_UNRESPONSIVE
    alert_type: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    # Deduplication key to prevent duplicate alerts for the same active condition
    condition_key: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    # Severity: WARNING or CRITICAL
    severity: Mapped[str] = mapped_column(String(32), default="WARNING", nullable=False)
    # Lifecycle: ACTIVE or RESOLVED
    status: Mapped[str] = mapped_column(String(32), default="ACTIVE", nullable=False, index=True)
    message: Mapped[str] = mapped_column(String(255), nullable=False)
    # Telemetry snapshot / context for explainability
    context_data: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    triggered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )
    resolved_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    # Relationships
    node: Mapped["IntegratedNode"] = relationship("IntegratedNode", lazy="selectin")

    def __repr__(self) -> str:
        return (
            f"<Alert(id={self.id}, node_id={self.node_id}, type='{self.alert_type}', "
            f"severity='{self.severity}', status='{self.status}')>"
        )
