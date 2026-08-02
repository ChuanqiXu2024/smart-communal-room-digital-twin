import {
  validateHotspotConfigurations,
  type HotspotConfiguration,
  type HotspotId,
  type VerificationStatus,
} from '../config/hotspots';
import type { Vector3Tuple } from '../config/scene';

export interface CalibrationExportRecord {
  readonly hotspotId: HotspotId;
  readonly title: string;
  readonly position: Vector3Tuple;
  readonly verificationStatus: VerificationStatus;
  readonly calibrationNote: string;
  readonly timestamp: string;
}

export interface CalibrationExportDocument {
  readonly schemaVersion: 1;
  readonly sceneId: string;
  readonly generatedAt: string;
  readonly hotspots: readonly CalibrationExportRecord[];
}

export const createCalibrationRecord = (
  hotspot: HotspotConfiguration,
  timestamp = new Date(),
): CalibrationExportRecord => {
  if (hotspot.position.some((coordinate) => !Number.isFinite(coordinate))) {
    throw new Error(`Cannot export invalid coordinates for ${hotspot.id}.`);
  }

  return {
    hotspotId: hotspot.id,
    title: hotspot.title,
    position: [...hotspot.position],
    verificationStatus: hotspot.verificationStatus,
    calibrationNote: hotspot.calibrationNote ?? '',
    timestamp: timestamp.toISOString(),
  };
};

export const createCalibrationExport = (
  hotspots: readonly HotspotConfiguration[],
  timestamp = new Date(),
): CalibrationExportDocument => {
  const errors = validateHotspotConfigurations(hotspots);
  if (errors.length > 0) {
    throw new Error(`Calibration configuration is invalid: ${errors.join(' ')}`);
  }

  const generatedAt = timestamp.toISOString();
  return {
    schemaVersion: 1,
    sceneId: 'd1aa30ae',
    generatedAt,
    hotspots: hotspots.map((hotspot) => createCalibrationRecord(hotspot, timestamp)),
  };
};

export const serializeCalibrationExport = (
  document: CalibrationExportDocument,
): string => `${JSON.stringify(document, null, 2)}\n`;
