"""AI Anomaly Detection Engines.

Phase 7 Scope: Unsupervised statistical anomaly detection algorithms.
Implements:
  - BaseAnomalyDetector (abstract base contract)
  - StatisticalAnomalyDetector (rolling Z-score univariate baseline)
  - MultiVariateAnomalyDetector (compound normalized Euclidean deviation across multiple sensors)

🟢 SPEC: BE-REQ-015 — Anomaly detection across sensor streams.
🔵 DECISION D-029: Statistical unsupervised anomaly detection (rolling Z-score).
🔵 DECISION D-030: Decision threshold distinct from engineering safety limits.
"""

from abc import ABC, abstractmethod
from datetime import datetime, timezone
import math
from typing import Any, Dict, List, Optional
import numpy as np

from backend.app.schemas.ai import AnomalyEvaluationResult


class BaseAnomalyDetector(ABC):
    """Abstract base class for assistive anomaly detection models."""

    @property
    @abstractmethod
    def model_name(self) -> str:
        """Name of the detection model."""
        pass

    @property
    @abstractmethod
    def model_version(self) -> str:
        """Version identifier of the model."""
        pass


class StatisticalAnomalyDetector(BaseAnomalyDetector):
    """Univariate statistical anomaly detector using rolling Z-score.

    Computes:
        Z = |x - μ| / max(σ, σ_min)
    where:
        x = current observation
        μ = baseline mean over sliding window
        σ = baseline standard deviation
        σ_min = variance floor (1e-4) to prevent division by zero on flatline data.

    Decision Rule:
        Z >= threshold => is_anomaly = True
    """

    def __init__(
        self,
        threshold: float = 3.0,
        min_samples: int = 5,
        variance_floor: float = 1e-4,
    ) -> None:
        self.threshold = float(threshold)
        self.min_samples = int(min_samples)
        self.variance_floor = float(variance_floor)

    @property
    def model_name(self) -> str:
        return "StatisticalZScoreDetector"

    @property
    def model_version(self) -> str:
        return "1.0.0"

    def evaluate(
        self,
        node_id: int,
        sensor_type: str,
        current_value: float,
        history_values: List[float],
        timestamp: Optional[datetime] = None,
    ) -> AnomalyEvaluationResult:
        """Evaluate a single sensor value against its historical baseline."""
        eval_time = timestamp or datetime.now(timezone.utc)
        if eval_time.tzinfo is None:
            eval_time = eval_time.replace(tzinfo=timezone.utc)

        n = len(history_values)
        if n < self.min_samples:
            return AnomalyEvaluationResult(
                node_id=node_id,
                sensor_type=sensor_type,
                is_anomaly=False,
                anomaly_score=0.0,
                threshold=self.threshold,
                model_name=self.model_name,
                model_version=self.model_version,
                features={
                    "sample_count": n,
                    "min_required": self.min_samples,
                    "current_value": round(float(current_value), 4),
                },
                explanation=f"Baseline warming up (insufficient samples: {n}/{self.min_samples})",
                detected_at=eval_time,
            )

        mean = float(np.mean(history_values))
        std = float(np.std(history_values, ddof=1 if n > 1 else 0))
        effective_std = max(std, self.variance_floor)
        z_score = abs(current_value - mean) / effective_std

        is_anomaly = bool(z_score >= self.threshold)

        if is_anomaly:
            explanation = (
                f"Statistical anomaly detected for {sensor_type}: value {current_value:.2f} "
                f"deviates by {z_score:.2f}σ from baseline mean {mean:.2f} "
                f"(σ={std:.2f}, threshold={self.threshold:.1f}σ)"
            )
        else:
            explanation = (
                f"Normal variation for {sensor_type}: value {current_value:.2f} "
                f"is within {z_score:.2f}σ of baseline mean {mean:.2f} "
                f"(threshold={self.threshold:.1f}σ)"
            )

        return AnomalyEvaluationResult(
            node_id=node_id,
            sensor_type=sensor_type,
            is_anomaly=is_anomaly,
            anomaly_score=round(z_score, 4),
            threshold=self.threshold,
            model_name=self.model_name,
            model_version=self.model_version,
            features={
                "current_value": round(float(current_value), 4),
                "mean": round(mean, 4),
                "std": round(std, 4),
                "z_score": round(z_score, 4),
                "sample_count": n,
            },
            explanation=explanation,
            detected_at=eval_time,
        )


class MultiVariateAnomalyDetector(BaseAnomalyDetector):
    """Multivariate compound anomaly detector across multiple sensor streams on a node.

    Computes normalized Euclidean root-mean-square deviation:
        D = sqrt((1/K) * sum(Z_k^2))
    where:
        Z_k = |x_k - μ_k| / max(σ_k, σ_min) for each evaluated sensor k.
    """

    def __init__(
        self,
        threshold: float = 3.0,
        min_samples: int = 5,
        variance_floor: float = 1e-4,
    ) -> None:
        self.threshold = float(threshold)
        self.min_samples = int(min_samples)
        self.variance_floor = float(variance_floor)

    @property
    def model_name(self) -> str:
        return "MultiVariateCompoundDetector"

    @property
    def model_version(self) -> str:
        return "1.0.0"

    def evaluate_cluster(
        self,
        node_id: int,
        current_readings: Dict[str, float],
        history_by_sensor: Dict[str, List[float]],
        timestamp: Optional[datetime] = None,
    ) -> Optional[AnomalyEvaluationResult]:
        """Evaluate compound multi-sensor deviation across all available sensors on a node."""
        eval_time = timestamp or datetime.now(timezone.utc)
        if eval_time.tzinfo is None:
            eval_time = eval_time.replace(tzinfo=timezone.utc)

        z_scores: Dict[str, float] = {}
        sensor_details: Dict[str, Any] = {}

        for sensor_type, current_val in current_readings.items():
            hist = history_by_sensor.get(sensor_type, [])
            if len(hist) < self.min_samples:
                continue

            mean = float(np.mean(hist))
            std = float(np.std(hist, ddof=1 if len(hist) > 1 else 0))
            effective_std = max(std, self.variance_floor)
            z = abs(current_val - mean) / effective_std
            z_scores[sensor_type] = z
            sensor_details[sensor_type] = {
                "current_value": round(float(current_val), 4),
                "mean": round(mean, 4),
                "std": round(std, 4),
                "z_score": round(z, 4),
                "sample_count": len(hist),
            }

        # Need at least 2 sensors with sufficient baseline for multivariate compound evaluation
        if len(z_scores) < 2:
            return None

        # Compound root-mean-square Z-score: D = sqrt((1/K) * sum(z_k^2))
        k = len(z_scores)
        sum_sq = sum(z**2 for z in z_scores.values())
        compound_score = math.sqrt(sum_sq / k)
        is_anomaly = bool(compound_score >= self.threshold)

        # Find top contributing sensor
        top_sensor = max(z_scores.items(), key=lambda item: item[1])

        if is_anomaly:
            explanation = (
                f"Multivariate compound anomaly detected across {k} sensors: compound score "
                f"{compound_score:.2f} exceeds threshold {self.threshold:.1f}. "
                f"Primary contributor: {top_sensor[0]} (z={top_sensor[1]:.2f}σ)"
            )
        else:
            explanation = (
                f"Normal multivariate variation across {k} sensors: compound score "
                f"{compound_score:.2f} is within threshold {self.threshold:.1f}."
            )

        return AnomalyEvaluationResult(
            node_id=node_id,
            sensor_type="MULTIVARIATE_CLUSTER",
            is_anomaly=is_anomaly,
            anomaly_score=round(compound_score, 4),
            threshold=self.threshold,
            model_name=self.model_name,
            model_version=self.model_version,
            features={
                "compound_score": round(compound_score, 4),
                "evaluated_sensor_count": k,
                "sensors": sensor_details,
                "primary_contributor": top_sensor[0],
            },
            explanation=explanation,
            detected_at=eval_time,
        )
