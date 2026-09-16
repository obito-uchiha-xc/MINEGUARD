"""Configurable Rule Entity Models.

Phase 6 Scope: Defines configurable threshold and multi-parameter correlation
rules for safety monitoring. No numerical safety thresholds are hardcoded.
"""

from typing import Any, Dict, List, Optional
from sqlalchemy import Boolean, Float, JSON, String
from sqlalchemy.orm import Mapped, mapped_column
from backend.app.db.base import Base


class ThresholdRule(Base):
    """Configurable safety threshold rule for a single sensor type.

    🟢 SPEC: BE-REQ-020 — Alerts triggered when sensor values cross defined thresholds.
    🟡 TBD: Numerical thresholds are not prescribed by project overview; must be configurable.
    """

    __tablename__ = "threshold_rules"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    sensor_type: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    # Comparison operator: GT (>), GTE (>=), LT (<), LTE (<=)
    operator: Mapped[str] = mapped_column(String(8), default="GT", nullable=False)
    threshold_value: Mapped[float] = mapped_column(Float, nullable=False)
    # 🔵 DECISION D-026: Severity classification (WARNING / CRITICAL)
    severity: Mapped[str] = mapped_column(String(32), default="WARNING", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    def __repr__(self) -> str:
        return (
            f"<ThresholdRule(id={self.id}, name='{self.name}', "
            f"sensor='{self.sensor_type}', {self.operator} {self.threshold_value})>"
        )


class MultiParameterRule(Base):
    """Configurable joint multi-parameter correlation rule.

    🟢 SPEC: BE-REQ-014, BE-REQ-022 — Safety monitoring must consider multiple
    parameters jointly rather than in isolation.
    """

    __tablename__ = "multi_parameter_rules"

    id: Mapped[int] = mapped_column(primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False)
    # List of individual conditions, e.g. [{"sensor_type": "methane_ch4", "operator": "GT", "threshold_value": 1.0}]
    conditions: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, nullable=False)
    severity: Mapped[str] = mapped_column(String(32), default="CRITICAL", nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    description: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)

    def __repr__(self) -> str:
        return f"<MultiParameterRule(id={self.id}, name='{self.name}', active={self.is_active})>"
