import type { RiskAssessmentResponse, ZoneRiskSummaryResponse, RiskLevelType } from '../../types/api';

/**
 * Derives the fleet-wide risk level from zone risk summaries using worst-case rollup,
 * strictly matching the backend RiskService priority (HIGH > ELEVATED > NORMAL).
 */
export function deriveFleetRiskLevel(
  zones: ZoneRiskSummaryResponse[] = []
): RiskLevelType {
  if (!zones || zones.length === 0) return 'NORMAL';

  if (zones.some((z) => z.highest_risk_level === 'HIGH')) {
    return 'HIGH';
  }
  if (zones.some((z) => z.highest_risk_level === 'ELEVATED')) {
    return 'ELEVATED';
  }
  return 'NORMAL';
}

/**
 * Maps backend categorical RiskLevelType to UI MineRiskSummary status.
 */
export function mapRiskLevelToStatus(
  level: RiskLevelType
): 'NORMAL' | 'WARNING' | 'HIGH_RISK' | 'CRITICAL' {
  switch (level) {
    case 'HIGH':
      return 'HIGH_RISK';
    case 'ELEVATED':
      return 'WARNING';
    case 'NORMAL':
    default:
      return 'NORMAL';
  }
}

/**
 * Presentation mapping for composite score display:
 * Maps backend categorical level to approximate gauge position (0-100)
 * for components expecting a numeric gauge without inventing arbitrary formulas.
 */
export function calculateCompositeMineRiskScore(
  zones: ZoneRiskSummaryResponse[] = []
): number {
  const level = deriveFleetRiskLevel(zones);
  switch (level) {
    case 'HIGH':
      return 75;
    case 'ELEVATED':
      return 45;
    case 'NORMAL':
    default:
      return 15;
  }
}

/**
 * Derives a top-level SafetyStatus from a composite 0-100 risk score.
 */
export function deriveMineRiskStatus(score: number): 'NORMAL' | 'WARNING' | 'HIGH_RISK' | 'CRITICAL' {
  if (score >= 75) return 'CRITICAL';
  if (score >= 50) return 'HIGH_RISK';
  if (score >= 25) return 'WARNING';
  return 'NORMAL';
}

/**
 * Extracts human-readable explainable risk indicator messages from a node risk assessment response.
 */
export function extractRiskIndicators(assessment?: RiskAssessmentResponse | null): string[] {
  if (!assessment || !assessment.contributing_factors || assessment.contributing_factors.length === 0) {
    return ['Nominal Baseline — Zero active risk factors detected'];
  }

  return assessment.contributing_factors.map((f) => f.message);
}

