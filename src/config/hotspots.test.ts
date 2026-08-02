import { describe, expect, it } from 'vitest';

import approvedCalibration from '../../docs/calibration/approved-hotspot-calibration.json';
import {
  HOTSPOTS,
  HOTSPOT_IDS,
  cloneHotspots,
  validateHotspotConfigurations,
} from './hotspots';

describe('hotspot configuration', () => {
  it('contains the five signals in the required order with valid coordinates', () => {
    expect(HOTSPOTS).toHaveLength(5);
    expect(new Set(HOTSPOTS.map(({ id }) => id)).size).toBe(5);
    expect(HOTSPOTS.map(({ id }) => id)).toEqual(HOTSPOT_IDS);
    expect(HOTSPOTS.map(({ title }) => title)).toEqual([
      'Temperature and Comfort',
      'Occupancy',
      'Lighting',
      'Communal Appliance State',
      'Viewer Engagement',
    ]);
    expect(validateHotspotConfigurations(HOTSPOTS)).toEqual([]);
  });

  it('marks every approved source coordinate as verified without stale review wording', () => {
    expect(HOTSPOTS.every(({ verificationStatus }) => verificationStatus === 'verified')).toBe(true);
    expect(
      HOTSPOTS.every(
        ({ calibrationNote }) =>
          calibrationNote !== undefined &&
          !/(provisional|outlier|visually confirm)/i.test(calibrationNote),
      ),
    ).toBe(true);
  });

  it('exactly matches the approved calibration artifact', () => {
    expect(approvedCalibration.schemaVersion).toBe(1);
    expect(approvedCalibration.sceneId).toBe('d1aa30ae');
    expect(
      HOTSPOTS.map(({ id, title, position, verificationStatus, calibrationNote }) => ({
        hotspotId: id,
        title,
        position,
        verificationStatus,
        calibrationNote,
      })),
    ).toEqual(approvedCalibration.hotspots);
  });

  it('returns independent session copies for calibration', () => {
    const copy = cloneHotspots();
    expect(copy).toEqual(HOTSPOTS);
    expect(copy).not.toBe(HOTSPOTS);
    expect(copy[0].position).not.toBe(HOTSPOTS[0].position);
  });
});
