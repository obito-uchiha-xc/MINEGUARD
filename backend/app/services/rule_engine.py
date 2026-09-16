"""Rule Evaluation Engine.

Phase 6 Scope: Pure domain evaluation functions testing sensor readings against
active threshold rules and multi-parameter correlation rules.
Decoupled from HTTP and database layers for maximum testability.
"""

from typing import Dict, List, Optional
from backend.app.models.rule import MultiParameterRule, ThresholdRule
from backend.app.schemas.risk import ContributingFactor


def evaluate_comparison(observed: float, operator: str, threshold: float) -> bool:
    """Evaluate a numerical comparison according to the operator.

    Operators supported:
      - "GT":  observed > threshold
      - "GTE": observed >= threshold
      - "LT":  observed < threshold
      - "LTE": observed <= threshold
    """
    op = operator.upper()
    if op == "GT":
        return observed > threshold
    if op == "GTE":
        return observed >= threshold
    if op == "LT":
        return observed < threshold
    if op == "LTE":
        return observed <= threshold
    return False


class RuleEngine:
    """Deterministic evaluation engine for configurable safety rules."""

    @staticmethod
    def evaluate_threshold_rule(
        rule: ThresholdRule,
        observed_value: float,
    ) -> Optional[ContributingFactor]:
        """Evaluate a single active threshold rule against an observed sensor value.

        Returns a ContributingFactor if the threshold condition is crossed; otherwise None.
        """
        if not rule.is_active:
            return None

        if evaluate_comparison(observed_value, rule.operator, rule.threshold_value):
            return ContributingFactor(
                factor_type="THRESHOLD_BREACH",
                sensor_type=rule.sensor_type,
                observed_value=observed_value,
                threshold_value=rule.threshold_value,
                operator=rule.operator,
                rule_name=rule.name,
                severity=rule.severity,
                message=(
                    f"Sensor '{rule.sensor_type}' observed value {observed_value} crossed "
                    f"configured threshold ({rule.operator} {rule.threshold_value}) in rule '{rule.name}'."
                ),
            )
        return None

    @staticmethod
    def evaluate_multi_parameter_rule(
        rule: MultiParameterRule,
        readings_by_sensor_type: Dict[str, float],
    ) -> Optional[ContributingFactor]:
        """Evaluate a multi-parameter correlation rule against a map of latest readings.

        🟢 SPEC: BE-REQ-014, BE-REQ-022 — Multi-parameter correlation condition.
        All sub-conditions in the rule must be simultaneously satisfied.
        """
        if not rule.is_active or not rule.conditions:
            return None

        satisfied_conditions: List[str] = []

        for cond in rule.conditions:
            sensor_type = cond.get("sensor_type")
            operator = cond.get("operator", "GT")
            threshold = cond.get("threshold_value")

            if sensor_type is None or threshold is None:
                return None  # Incomplete condition definition

            if sensor_type not in readings_by_sensor_type:
                # Sensor not present in this telemetry frame/snapshot
                return None

            observed = readings_by_sensor_type[sensor_type]
            if not evaluate_comparison(observed, operator, float(threshold)):
                return None  # One sub-condition not satisfied

            satisfied_conditions.append(
                f"{sensor_type}={observed} ({operator} {threshold})"
            )

        # All sub-conditions are satisfied!
        cond_str = ", ".join(satisfied_conditions)
        return ContributingFactor(
            factor_type="MULTI_PARAMETER_CORRELATION",
            rule_name=rule.name,
            severity=rule.severity,
            message=(
                f"Multi-parameter correlation rule '{rule.name}' triggered: "
                f"all joint conditions satisfied [{cond_str}]."
            ),
        )
