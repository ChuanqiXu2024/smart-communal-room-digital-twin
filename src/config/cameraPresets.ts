import type { HotspotId } from './hotspots';
import type { Vector3Tuple } from './scene';

export const CAMERA_PRESET_IDS = [
  'overview',
  'seating-zone',
  'dining-kitchen-zone',
] as const;

export type CameraPresetId = (typeof CAMERA_PRESET_IDS)[number];

export interface CameraPreset {
  readonly id: CameraPresetId;
  readonly label: string;
  readonly position: Vector3Tuple;
  readonly target: Vector3Tuple;
  readonly up: Vector3Tuple;
  readonly fieldOfView: number;
  readonly purpose: string;
}

export const CAMERA_PRESETS: readonly CameraPreset[] = [
  {
    id: 'overview',
    label: 'Overview',
    position: [2.2100445893919587, -0.2767308084863921, 1.3845340034623583],
    target: [1.1164654118219748, 0.34292948614091645, -0.6807790433292996],
    up: [0.1412413828244095, -0.9251449235264726, -0.35236024499231733],
    fieldOfView: 65,
    purpose:
      'Presents the blue sofa, floor, door and service counter together at an approachable eye-level angle.',
  },
  {
    id: 'seating-zone',
    label: 'Seating zone',
    position: [1.0770533502079183, -0.3798981627225796, 0.8528692887307616],
    target: [0.2554311281418149, 0.08566178816194962, -0.698830971818943],
    up: [0.1412413828244095, -0.9251449235264726, -0.35236024499231733],
    fieldOfView: 62,
    purpose: 'Frames the blue sofa and the Occupancy hotspot for a focused seating-area review.',
  },
  {
    id: 'dining-kitchen-zone',
    label: 'Dining and kitchen zone',
    position: [2.8808, -0.2425, 0.7978],
    target: [1.247316085095261, -0.561799093685503, 2.236369909521817],
    up: [0.10248100517877883, -0.9893667772271426, -0.10320379691040797],
    fieldOfView: 70,
    purpose:
      'Frames the natural-light, communal water-boiler and dining-table engagement zones together.',
  },
] as const;

export const DEFAULT_CAMERA_PRESET_ID: CameraPresetId = 'overview';

export const HOTSPOT_CAMERA_PRESET: Readonly<Record<HotspotId, CameraPresetId>> = {
  temperature: 'overview',
  occupancy: 'seating-zone',
  lighting: 'dining-kitchen-zone',
  appliance: 'dining-kitchen-zone',
  engagement: 'dining-kitchen-zone',
};

export const getCameraPreset = (id: CameraPresetId): CameraPreset => {
  const preset = CAMERA_PRESETS.find((candidate) => candidate.id === id);
  if (!preset) throw new Error(`Unknown camera preset: ${id}.`);
  return preset;
};
