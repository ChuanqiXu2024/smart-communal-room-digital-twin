import { describe, expect, it } from 'vitest';

import { cloneHotspots } from '../config/hotspots';
import { createCalibrationExport, serializeCalibrationExport } from './calibrationExport';

describe('calibration export', () => {
  it('exports all required review fields with a stable timestamp', () => {
    const timestamp = new Date('2026-07-21T12:00:00.000Z');
    const result = createCalibrationExport(cloneHotspots(), timestamp);
    expect(result.schemaVersion).toBe(1);
    expect(result.sceneId).toBe('d1aa30ae');
    expect(result.hotspots).toHaveLength(5);
    expect(result.hotspots[0]).toEqual({
      hotspotId: 'temperature',
      title: 'Temperature and Comfort',
      position: [2.374005724971767, 0.1713414509993272, 0.38573660752531413],
      verificationStatus: 'verified',
      calibrationNote: 'Verified on the visible front surface of the radiator.',
      timestamp: timestamp.toISOString(),
    });
    expect(JSON.parse(serializeCalibrationExport(result))).toEqual(result);
  });

  it('rejects non-finite calibration coordinates', () => {
    const invalid = cloneHotspots();
    invalid[0] = { ...invalid[0], position: [Number.NaN, 0, 0] };
    expect(() => createCalibrationExport(invalid)).toThrow(/invalid/i);
  });
});
