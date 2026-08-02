import type { DecisionRuleId } from '../decision/decisionEngine';
import type {
  ApplianceState,
  SeededRandom,
  SignalValues,
} from '../simulation/signalSimulation';

export const SCENARIO_IDS = [
  'normal',
  'warm-crowded',
  'poor-presentation',
  'vacant-water-boiler',
  'strong-interest',
  'combined-intervention',
] as const;

export type ScenarioId = (typeof SCENARIO_IDS)[number];
export type NumericBand = readonly [minimum: number, maximum: number];

export interface ScenarioVariationBands {
  readonly temperature: NumericBand;
  readonly occupancy: NumericBand;
  readonly lighting: NumericBand;
  readonly appliance: readonly [ApplianceState, ApplianceState];
  readonly engagement: NumericBand;
}

export interface DemonstrationScenario {
  readonly id: ScenarioId;
  readonly title: string;
  readonly summary: string;
  readonly target: SignalValues;
  readonly variationBands: ScenarioVariationBands;
  readonly expectedRuleIds: readonly DecisionRuleId[];
  readonly seedOffset: number;
}

export const DEMONSTRATION_SCENARIOS: readonly DemonstrationScenario[] = [
  {
    id: 'normal',
    title: 'Normal communal use',
    summary: 'Comfortable, ordinarily occupied baseline with adequate presentation lighting.',
    target: {
      temperature: 22.4,
      occupancy: 2,
      lighting: 430,
      appliance: 'ON',
      engagement: 68,
    },
    variationBands: {
      temperature: [22.2, 22.6],
      occupancy: [2, 2],
      lighting: [410, 450],
      appliance: ['ON', 'ON'],
      engagement: [65, 71],
    },
    expectedRuleIds: [],
    seedOffset: 0x101,
  },
  {
    id: 'warm-crowded',
    title: 'Warm and crowded',
    summary: 'A warm room with a group viewing in progress.',
    target: {
      temperature: 25.2,
      occupancy: 4,
      lighting: 430,
      appliance: 'ON',
      engagement: 68,
    },
    variationBands: {
      temperature: [25, 25.4],
      occupancy: [4, 4],
      lighting: [410, 450],
      appliance: ['ON', 'ON'],
      engagement: [65, 71],
    },
    expectedRuleIds: ['warm-occupied'],
    seedOffset: 0x202,
  },
  {
    id: 'poor-presentation',
    title: 'Poor presentation',
    summary: 'Low lighting and weak attention around the communal focal zone.',
    target: {
      temperature: 22,
      occupancy: 1,
      lighting: 250,
      appliance: 'ON',
      engagement: 52,
    },
    variationBands: {
      temperature: [21.8, 22.2],
      occupancy: [1, 1],
      lighting: [235, 265],
      appliance: ['ON', 'ON'],
      engagement: [49, 55],
    },
    expectedRuleIds: ['poor-presentation'],
    seedOffset: 0x303,
  },
  {
    id: 'vacant-water-boiler',
    title: 'Vacant room with water boiler left on',
    summary: 'No simulated occupants while the non-essential communal water boiler remains on.',
    target: {
      temperature: 21.5,
      occupancy: 0,
      lighting: 430,
      appliance: 'ON',
      engagement: 50,
    },
    variationBands: {
      temperature: [21.3, 21.7],
      occupancy: [0, 0],
      lighting: [410, 450],
      appliance: ['ON', 'ON'],
      engagement: [47, 53],
    },
    expectedRuleIds: ['vacant-water-boiler'],
    seedOffset: 0x404,
  },
  {
    id: 'strong-interest',
    title: 'Strong interest',
    summary: 'High navigational attention around the dining and social zone.',
    target: {
      temperature: 22.2,
      occupancy: 2,
      lighting: 500,
      appliance: 'ON',
      engagement: 82,
    },
    variationBands: {
      temperature: [22, 22.4],
      occupancy: [2, 2],
      lighting: [480, 520],
      appliance: ['ON', 'ON'],
      engagement: [79, 85],
    },
    expectedRuleIds: ['strong-social-interest'],
    seedOffset: 0x505,
  },
  {
    id: 'combined-intervention',
    title: 'Combined viewing intervention',
    summary: 'Warm, crowded conditions combined with weak presentation of the focal zone.',
    target: {
      temperature: 25.2,
      occupancy: 4,
      lighting: 250,
      appliance: 'ON',
      engagement: 52,
    },
    variationBands: {
      temperature: [25, 25.4],
      occupancy: [4, 4],
      lighting: [235, 265],
      appliance: ['ON', 'ON'],
      engagement: [49, 55],
    },
    expectedRuleIds: ['warm-occupied', 'poor-presentation'],
    seedOffset: 0x606,
  },
] as const;

export const getScenario = (scenarioId: ScenarioId): DemonstrationScenario => {
  const scenario = DEMONSTRATION_SCENARIOS.find(({ id }) => id === scenarioId);
  if (!scenario) throw new Error(`Unknown demonstration scenario: ${scenarioId}.`);
  return scenario;
};

const clampToBand = (value: number, [minimum, maximum]: NumericBand): number =>
  Math.min(maximum, Math.max(minimum, value));

const advanceNumericValue = (
  current: number,
  target: number,
  band: NumericBand,
  maximumNoise: number,
  random: SeededRandom,
): number =>
  clampToBand(
    current + (target - current) * 0.28 + (random.next() - 0.5) * maximumNoise * 2,
    band,
  );

export const advanceScenarioValues = (
  scenario: DemonstrationScenario,
  current: SignalValues,
  random: SeededRandom,
): SignalValues => ({
  temperature: Math.round(
    advanceNumericValue(
      current.temperature,
      scenario.target.temperature,
      scenario.variationBands.temperature,
      0.08,
      random,
    ) * 1_000,
  ) / 1_000,
  occupancy: scenario.target.occupancy,
  lighting: Math.round(
    advanceNumericValue(
      current.lighting,
      scenario.target.lighting,
      scenario.variationBands.lighting,
      8,
      random,
    ),
  ),
  appliance: scenario.target.appliance,
  engagement: Math.round(
    advanceNumericValue(
      current.engagement,
      scenario.target.engagement,
      scenario.variationBands.engagement,
      1.5,
      random,
    ),
  ),
});

export const valuesStayWithinScenarioBands = (
  scenario: DemonstrationScenario,
  values: SignalValues,
): boolean =>
  values.temperature >= scenario.variationBands.temperature[0] &&
  values.temperature <= scenario.variationBands.temperature[1] &&
  values.occupancy >= scenario.variationBands.occupancy[0] &&
  values.occupancy <= scenario.variationBands.occupancy[1] &&
  values.lighting >= scenario.variationBands.lighting[0] &&
  values.lighting <= scenario.variationBands.lighting[1] &&
  values.appliance === scenario.variationBands.appliance[0] &&
  values.engagement >= scenario.variationBands.engagement[0] &&
  values.engagement <= scenario.variationBands.engagement[1];
