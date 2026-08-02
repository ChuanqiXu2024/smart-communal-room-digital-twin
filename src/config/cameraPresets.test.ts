import { describe, expect, it } from 'vitest';

import {
  CAMERA_PRESETS,
  CAMERA_PRESET_IDS,
  DEFAULT_CAMERA_PRESET_ID,
  HOTSPOT_CAMERA_PRESET,
} from './cameraPresets';
import { HOTSPOTS } from './hotspots';
import { HOSTED_SCENE } from './scene';

describe('camera presets', () => {
  it('defines the three required stable presets in presentation order', () => {
    expect(CAMERA_PRESETS.map(({ id }) => id)).toEqual(CAMERA_PRESET_IDS);
    expect(CAMERA_PRESETS.map(({ label }) => label)).toEqual([
      'Overview',
      'Seating zone',
      'Dining and kitchen zone',
    ]);
  });

  it('uses finite camera vectors, a normalized up direction and natural fields of view', () => {
    CAMERA_PRESETS.forEach((preset) => {
      expect(preset.position).toHaveLength(3);
      expect(preset.target).toHaveLength(3);
      expect(preset.up).toHaveLength(3);
      expect([...preset.position, ...preset.target, ...preset.up].every(Number.isFinite)).toBe(
        true,
      );
      expect(Math.hypot(...preset.up)).toBeCloseTo(1, 6);
      expect(preset.fieldOfView).toBeGreaterThanOrEqual(50);
      expect(preset.fieldOfView).toBeLessThanOrEqual(70);
      expect(preset.purpose.length).toBeGreaterThan(20);
    });
  });

  it('makes reset use the approved Overview preset', () => {
    const overview = CAMERA_PRESETS.find(({ id }) => id === DEFAULT_CAMERA_PRESET_ID);
    expect(overview).toBeDefined();
    expect(HOSTED_SCENE.initialCamera.position).toEqual(overview?.position);
    expect(HOSTED_SCENE.initialCamera.target).toEqual(overview?.target);
    expect(HOSTED_SCENE.initialCamera.up).toEqual(overview?.up);
    expect(HOSTED_SCENE.initialCamera.fieldOfView).toBe(overview?.fieldOfView);
  });

  it('maps every hotspot to an available guided view', () => {
    const presetIds = new Set(CAMERA_PRESET_IDS);
    expect(Object.keys(HOTSPOT_CAMERA_PRESET).sort()).toEqual(
      HOTSPOTS.map(({ id }) => id).sort(),
    );
    Object.values(HOTSPOT_CAMERA_PRESET).forEach((presetId) => {
      expect(presetIds.has(presetId)).toBe(true);
    });
    expect(HOTSPOT_CAMERA_PRESET.occupancy).toBe('seating-zone');
    expect(HOTSPOT_CAMERA_PRESET.lighting).toBe('dining-kitchen-zone');
    expect(HOTSPOT_CAMERA_PRESET.appliance).toBe('dining-kitchen-zone');
    expect(HOTSPOT_CAMERA_PRESET.engagement).toBe('dining-kitchen-zone');
  });
});
