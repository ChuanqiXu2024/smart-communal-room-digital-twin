import type { Vector3Tuple } from './scene';

export const HOTSPOT_IDS = [
  'temperature',
  'occupancy',
  'lighting',
  'appliance',
  'engagement',
] as const;

export type HotspotId = (typeof HOTSPOT_IDS)[number];
export type SignalId = HotspotId;
export type VerificationStatus = 'verified' | 'provisional';
export type LabelOffset = readonly [x: number, y: number];

export interface HotspotConfiguration {
  readonly id: HotspotId;
  readonly title: string;
  readonly description: string;
  readonly position: Vector3Tuple;
  readonly labelOffset: LabelOffset;
  readonly signalId: SignalId;
  readonly zone: string;
  readonly verificationStatus: VerificationStatus;
  readonly calibrationNote?: string;
}

export const HOTSPOTS: readonly HotspotConfiguration[] = [
  {
    id: 'temperature',
    title: 'Temperature and Comfort',
    description: 'Thermal comfort reading positioned beside the room heating zone.',
    position: [2.374005724971767, 0.1713414509993272, 0.38573660752531413],
    labelOffset: [0, -58],
    signalId: 'temperature',
    zone: 'Radiator and heating comfort zone',
    verificationStatus: 'verified',
    calibrationNote: 'Verified on the visible front surface of the radiator.',
  },
  {
    id: 'occupancy',
    title: 'Occupancy',
    description: 'Estimated current use of the shared seating area.',
    position: [0.6972853074387108, 0.4001254978547795, -1.0362842602808375],
    labelOffset: [-118, -54],
    signalId: 'occupancy',
    zone: 'Blue sofa and shared seating zone',
    verificationStatus: 'verified',
    calibrationNote: 'Verified on a dense visible surface of the blue communal sofa.',
  },
  {
    id: 'lighting',
    title: 'Lighting',
    description: 'Illuminance estimate for the room’s primary daylight and lighting area.',
    position: [1.0547874159695052, -1.118989273705962, 2.883436599269819],
    labelOffset: [112, -54],
    signalId: 'lighting',
    zone: 'Curtain, window and primary-lighting zone',
    verificationStatus: 'verified',
    calibrationNote:
      "Verified on the red curtain representing the room's principal natural-light zone.",
  },
  {
    id: 'appliance',
    title: 'Communal Appliance State',
    description: 'State of the monitored non-essential communal countertop water boiler.',
    position: [0.5041015695552176, -0.6157495764526498, 2.696243945339032],
    labelOffset: [120, -58],
    signalId: 'appliance',
    zone: 'Communal countertop water-boiler zone',
    verificationStatus: 'verified',
    calibrationNote: 'Verified on the communal countertop water boiler.',
  },
  {
    id: 'engagement',
    title: 'Viewer Engagement',
    description: 'Navigation-derived attention proxy for the communal social focal point.',
    position: [2.1830598647600628, 0.04883727340391779, 1.1292228642813638],
    labelOffset: [-120, -58],
    signalId: 'engagement',
    zone: 'Dining table and communal social focal point',
    verificationStatus: 'verified',
    calibrationNote:
      'Verified on the dining table representing the communal social and viewing focal zone.',
  },
] as const;

export const cloneHotspots = (): HotspotConfiguration[] =>
  HOTSPOTS.map((hotspot) => ({
    ...hotspot,
    position: [...hotspot.position],
    labelOffset: [...hotspot.labelOffset],
  }));

export const validateHotspotConfigurations = (
  hotspots: readonly HotspotConfiguration[],
): string[] => {
  const errors: string[] = [];
  const seenIds = new Set<string>();

  if (hotspots.length !== HOTSPOT_IDS.length) {
    errors.push(`Expected ${HOTSPOT_IDS.length} hotspots, received ${hotspots.length}.`);
  }

  hotspots.forEach((hotspot, index) => {
    if (seenIds.has(hotspot.id)) {
      errors.push(`Duplicate hotspot ID: ${hotspot.id}.`);
    }
    seenIds.add(hotspot.id);

    if (hotspot.id !== HOTSPOT_IDS[index]) {
      errors.push(`Hotspot ${hotspot.id} is not in the required display order.`);
    }
    if (hotspot.signalId !== hotspot.id) {
      errors.push(`Hotspot ${hotspot.id} is linked to the wrong signal.`);
    }
    if (hotspot.position.length !== 3 || hotspot.position.some((value) => !Number.isFinite(value))) {
      errors.push(`Hotspot ${hotspot.id} has an invalid world-space position.`);
    }
    if (!hotspot.title.trim() || !hotspot.description.trim() || !hotspot.zone.trim()) {
      errors.push(`Hotspot ${hotspot.id} is missing required semantic text.`);
    }
    if (!['verified', 'provisional'].includes(hotspot.verificationStatus)) {
      errors.push(`Hotspot ${hotspot.id} has an invalid verification status.`);
    }
  });

  return errors;
};
