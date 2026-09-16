"""Risk Assessment Entity Models.

Phase 6 Scope: Defines persistent explainable risk assessment records for nodes.
Risk classifications are prototype implementation choices (🔵 D-025).
"""

from datetime import datetime
from typing import Any, Dict, List
from sqlalchemy import DateTime, ForeignKey, JSON, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.db.base import Base


class RiskAssessmentRecord(Base):
    """Persistent log of an explainable node risk assessment.

    🟢 SPEC: BE-REQ-016 — Node-level risk assessment and classification.
    🔵 DECISION D-025: Prototype risk classification (NORMAL / ELEVATED / HIGH).
        Not an official or regulatory mine-safety classification.
    """

    __tablename__ = "risk_assessments"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    node_id: Mapped[int] = mapped_column(
        ForeignKey("integrated_nodes.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    risk_level: Mapped[str] = mapped_column(
        String(32),
        default="NORMAL",
        nullable=False,
        index=True,
    )
    # Explainable contributing factors: list of dicts describing triggered rules or liveness state
    contributing_factors: Mapped[List[Dict[str, Any]]] = mapped_column(
        JSON,
        default=list,
        nullable=False,
    )
    assessed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )

    # Relationships
    node: Mapped["IntegratedNode"] = relationship("IntegratedNode", lazy="selectin")

    def __repr__(self) -> str:
        return (
            f"<RiskAssessmentRecord(id={self.id}, node_id={self.node_id}, "
            f"level='{self.risk_level}', assessed_at='{self.assessed_at}')>"
        )
