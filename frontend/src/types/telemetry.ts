import type { SafetyStatus } from './safety';

/**
 * Future Hardware Sensor Field Schema:
 * Compatible with planned field node hardware:
 * - Microcontroller: ESP32
 * - Transceiver: LoRa SX1278 (Sub-GHz)
 * - Motion/Tilt: MPU6500 (6-axis gyro/accelerometer)
 * - Shock/Vibration: SW-1801P high-sensitivity vibration switch
 * - Displacement/Crack: VL53L0X Time-of-Flight laser rangefinder
 * - Geotechnical: Analog soil moisture / pore probe
 * - Atmospheric: MQ-2 multi-gas sensor (CH4, CO, Smoke)
 */

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface GeotechnicalTelemetry {
  /** Tilt in degrees (pitch, roll, yaw from MPU6500) */
  tilt: {
    pitchDeg: number;
    rollDeg: number;
    yawDeg: number;
    deltaTotalDeg: number;
  };
  /** Displacement measurement in mm (VL53L0X laser distance / crack opening) */
  displacementMm: number;
  displacementRateMmPerHr: number;
  /** Dynamic vibration and shock (SW-1801P + MPU6500 accelerometer magnitude) */
  vibrationIntensityG: number;
  shockEventCount: number;
  /** Soil moisture percentage (pore water pressure surrogate) */
  soilMoisturePct: number;
  /** Hazardous gas concentrations from MQ-2 */
  gas: {
    ch4Ppm: number;
    coPpm: number;
    smokePpm: number;
    isGasAnomaly: boolean;
  };
  /** Ambient environmental baseline */
  environment: {
    temperatureC: number;
    pressureHpa: number;
    relativeHumidityPct: number;
  };
}

export interface HardwareHealth {
  batteryPct: number;
  batteryVolts: number;
  rssiDbm: number;
  snrDb: number;
  packetLossRatePct: number;
  firmwareVersion: string;
}

export interface AiInstabilityAnalysis {
  /** Composite ground instability score: 0 to 100 */
  instabilityScore: number;
  safetyStatus: SafetyStatus;
  /** Rate and acceleration of physical change */
  deformationVelocity: 'STABLE' | 'MODERATE' | 'ACCELERATING' | 'CRITICAL';
  /** Spatial correlation flag across neighboring mine sectors */
  spatialClusterAlert: boolean;
  /** Model certainty index: 0 to 1.0 */
  modelConfidence: number;
  /** Human-readable technical summary */
  assessmentSummary: string;
}

export interface NodeTelemetryRecord {
  nodeId: string;
  nodeName: string;
  zoneId: string;
  zoneName: string;
  timestamp: string;
  safetyStatus: SafetyStatus;
  telemetry: GeotechnicalTelemetry;
  hardware: HardwareHealth;
  aiAnalysis: AiInstabilityAnalysis;
}
