/**
 * Telemetry Adapter
 *
 * Converts flat backend SensorReadingResponse[] records into the compound
 * GeotechnicalTelemetry structure required by frontend UI components.
 */

import type { SensorReadingResponse } from '../../types/api';
import type { GeotechnicalTelemetry } from '../../types/telemetry';

export function createEmptyTelemetry(): GeotechnicalTelemetry {
  return {
    tilt: {
      pitchDeg: 0,
      rollDeg: 0,
      yawDeg: 0,
      deltaTotalDeg: 0,
    },
    displacementMm: 0,
    displacementRateMmPerHr: 0,
    vibrationIntensityG: 0,
    shockEventCount: 0,
    soilMoisturePct: 0,
    gas: {
      ch4Ppm: 0,
      coPpm: 0,
      smokePpm: 0,
      isGasAnomaly: false,
    },
    environment: {
      temperatureC: 25,
      pressureHpa: 1013,
      relativeHumidityPct: 50,
    },
  };
}

/**
 * Transforms an array of flat sensor readings into a GeotechnicalTelemetry object.
 */
export function adaptSensorReadingsToTelemetry(
  readings: SensorReadingResponse[] = []
): GeotechnicalTelemetry {
  const telemetry = createEmptyTelemetry();

  for (const r of readings) {
    const type = r.sensor_type.toLowerCase();
    const val = r.value;

    if (type.includes('tilt_pitch') || type === 'pitch') {
      telemetry.tilt.pitchDeg = val;
    } else if (type.includes('tilt_roll') || type === 'roll') {
      telemetry.tilt.rollDeg = val;
    } else if (type.includes('tilt_yaw') || type === 'yaw') {
      telemetry.tilt.yawDeg = val;
    } else if (type === 'tilt') {
      telemetry.tilt.pitchDeg = val;
    } else if (type.includes('displacement')) {
      telemetry.displacementMm = val;
    } else if (type.includes('vibration')) {
      telemetry.vibrationIntensityG = val;
    } else if (type.includes('moisture') || type.includes('soil')) {
      telemetry.soilMoisturePct = val;
    } else if (type.includes('methane') || type.includes('ch4')) {
      telemetry.gas.ch4Ppm = val;
      if (val > 1000) telemetry.gas.isGasAnomaly = true;
    } else if (type.includes('carbon_monoxide') || type === 'co') {
      telemetry.gas.coPpm = val;
      if (val > 50) telemetry.gas.isGasAnomaly = true;
    } else if (type.includes('temperature') || type === 'temp') {
      telemetry.environment.temperatureC = val;
    } else if (type.includes('humidity')) {
      telemetry.environment.relativeHumidityPct = val;
    } else if (type.includes('pressure')) {
      telemetry.environment.pressureHpa = val;
    }
  }

  // Calculate composite deltaTotalDeg for tilt
  telemetry.tilt.deltaTotalDeg = Number(
    Math.sqrt(telemetry.tilt.pitchDeg ** 2 + telemetry.tilt.rollDeg ** 2).toFixed(2)
  );

  return telemetry;
}
