import type { SignalId } from '../config/hotspots';
import {
  advanceScenarioValues,
  getScenario,
  type ScenarioId,
} from '../scenarios/scenarios';

export const SIMULATION_INTERVAL_MS = 2_000;
export const DEFAULT_SIMULATION_SEED = 0x5eed2026;

export type ApplianceState = 'ON' | 'OFF';

export interface SignalValues {
  readonly temperature: number;
  readonly occupancy: number;
  readonly lighting: number;
  readonly appliance: ApplianceState;
  readonly engagement: number;
}

export interface EngagementObservation {
  readonly visible: boolean;
  readonly centrality: number;
  readonly dwellSeconds: number;
}

export interface SignalSnapshot {
  readonly values: SignalValues;
  readonly statuses: Record<SignalId, string>;
  readonly updatedAt: string;
  readonly tick: number;
  readonly mode: SimulationMode;
  readonly updateReason: SimulationUpdateReason;
}

export type SimulationMode =
  | { readonly kind: 'live' }
  | { readonly kind: 'scenario'; readonly scenarioId: ScenarioId };

export type SimulationUpdateReason =
  | 'initial'
  | 'tick'
  | 'scenario-selection'
  | 'return-live-baseline'
  | 'reset';

export interface SignalPresentation {
  readonly value: string;
  readonly unit: string;
  readonly status: string;
  readonly sourceBadge: 'Simulated sensor' | 'Interaction-derived proxy';
  readonly sourceDescription: string;
}

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));

const roundTo = (value: number, places: number): number => {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
};

export class SeededRandom {
  private state: number;

  public constructor(seed: number) {
    this.state = seed >>> 0 || 0x6d2b79f5;
  }

  public next(): number {
    this.state += 0x6d2b79f5;
    let value = this.state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  }
}

export const getTemperatureStatus = (value: number): string => {
  if (value < 20) return 'Cool';
  if (value <= 24) return 'Comfortable';
  return 'Warm';
};

export const getOccupancyStatus = (value: number): string => {
  if (value === 0) return 'Vacant';
  if (value <= 2) return 'Light use';
  if (value <= 4) return 'Moderate use';
  return 'Busy';
};

export const getLightingStatus = (value: number): string => {
  if (value < 350) return 'Low';
  if (value <= 650) return 'Adequate';
  return 'Bright';
};

export const getApplianceStatus = (value: ApplianceState): string =>
  value === 'ON' ? 'Active' : 'Inactive';

export const getEngagementStatus = (value: number): string => {
  if (value < 60) return 'Low';
  if (value <= 75) return 'Moderate';
  return 'High';
};

export const getSignalStatuses = (values: SignalValues): Record<SignalId, string> => ({
  temperature: getTemperatureStatus(values.temperature),
  occupancy: getOccupancyStatus(values.occupancy),
  lighting: getLightingStatus(values.lighting),
  appliance: getApplianceStatus(values.appliance),
  engagement: getEngagementStatus(values.engagement),
});

export const INITIAL_SIGNAL_VALUES: SignalValues = {
  temperature: 22.4,
  occupancy: 2,
  lighting: 430,
  appliance: 'ON',
  engagement: 68,
};

export const createInitialSignalSnapshot = (
  now = new Date(),
  mode: SimulationMode = { kind: 'live' },
  updateReason: SimulationUpdateReason = 'initial',
): SignalSnapshot => ({
  values: { ...INITIAL_SIGNAL_VALUES },
  statuses: getSignalStatuses(INITIAL_SIGNAL_VALUES),
  updatedAt: now.toISOString(),
  tick: 0,
  mode,
  updateReason,
});

const sourceDescriptions: Record<SignalId, string> = {
  temperature: 'Seeded thermal-comfort simulation with bounded mean reversion.',
  occupancy: 'Seeded low-frequency shared-room occupancy simulation.',
  lighting: 'Seeded illuminance simulation with bounded mean reversion.',
  appliance: 'Simulated state of the non-essential communal countertop water boiler.',
  engagement: 'Camera visibility, viewport centrality and dwell-time interaction proxy.',
};

export const formatSignal = (
  id: SignalId,
  snapshot: SignalSnapshot,
): SignalPresentation => {
  const value = snapshot.values[id];
  const common = {
    status: snapshot.statuses[id],
    sourceBadge:
      id === 'engagement'
        ? ('Interaction-derived proxy' as const)
        : ('Simulated sensor' as const),
    sourceDescription: sourceDescriptions[id],
  };

  switch (id) {
    case 'temperature':
      return { ...common, value: (value as number).toFixed(1), unit: '°C' };
    case 'occupancy': {
      const count = value as number;
      return { ...common, value: String(count), unit: count === 1 ? 'person' : 'people' };
    }
    case 'lighting':
      return { ...common, value: String(Math.round(value as number)), unit: 'lux' };
    case 'appliance':
      return { ...common, value: value as ApplianceState, unit: '' };
    case 'engagement':
      return { ...common, value: String(Math.round(value as number)), unit: '/ 100' };
  }
};

export class SignalSimulation {
  private random: SeededRandom;
  private snapshot: SignalSnapshot;
  private paused = false;
  private occupancyDwellTicks = 0;

  public constructor(
    private readonly seed = DEFAULT_SIMULATION_SEED,
    now = new Date(),
  ) {
    this.random = new SeededRandom(seed);
    this.snapshot = createInitialSignalSnapshot(now);
  }

  public getSnapshot(): SignalSnapshot {
    return this.snapshot;
  }

  public isPaused(): boolean {
    return this.paused;
  }

  public pause(): SignalSnapshot {
    this.paused = true;
    return this.snapshot;
  }

  public resume(): SignalSnapshot {
    this.paused = false;
    return this.snapshot;
  }

  public reset(now = new Date()): SignalSnapshot {
    const normalScenario = getScenario('normal');
    this.random = new SeededRandom(this.seed ^ normalScenario.seedOffset);
    this.snapshot = {
      values: { ...normalScenario.target },
      statuses: getSignalStatuses(normalScenario.target),
      updatedAt: now.toISOString(),
      tick: 0,
      mode: { kind: 'scenario', scenarioId: 'normal' },
      updateReason: 'reset',
    };
    this.occupancyDwellTicks = 0;
    this.paused = false;
    return this.snapshot;
  }

  public applyScenario(scenarioId: ScenarioId, now = new Date()): SignalSnapshot {
    const scenario = getScenario(scenarioId);
    this.random = new SeededRandom(this.seed ^ scenario.seedOffset);
    this.snapshot = {
      values: { ...scenario.target },
      statuses: getSignalStatuses(scenario.target),
      updatedAt: now.toISOString(),
      tick: 0,
      mode: { kind: 'scenario', scenarioId },
      updateReason: 'scenario-selection',
    };
    this.occupancyDwellTicks = 0;
    return this.snapshot;
  }

  public returnToLiveBaseline(now = new Date()): SignalSnapshot {
    this.random = new SeededRandom(this.seed);
    this.snapshot = createInitialSignalSnapshot(
      now,
      { kind: 'live' },
      'return-live-baseline',
    );
    this.occupancyDwellTicks = 0;
    return this.snapshot;
  }

  public tick(observation: EngagementObservation, now = new Date()): SignalSnapshot {
    if (this.paused) return this.snapshot;

    const current = this.snapshot.values;
    if (this.snapshot.mode.kind === 'scenario') {
      const values = advanceScenarioValues(
        getScenario(this.snapshot.mode.scenarioId),
        current,
        this.random,
      );
      this.snapshot = {
        values,
        statuses: getSignalStatuses(values),
        updatedAt: now.toISOString(),
        tick: this.snapshot.tick + 1,
        mode: this.snapshot.mode,
        updateReason: 'tick',
      };
      return this.snapshot;
    }

    const temperatureDelta = clamp(
      (22.2 - current.temperature) * 0.04 + (this.random.next() - 0.5) * 0.24,
      -0.2,
      0.2,
    );
    const temperature = roundTo(
      clamp(current.temperature + temperatureDelta, 18, 28),
      3,
    );

    const lightingDelta = clamp(
      (450 - current.lighting) * 0.04 + (this.random.next() - 0.5) * 36,
      -25,
      25,
    );
    const lighting = Math.round(clamp(current.lighting + lightingDelta, 100, 800));

    this.occupancyDwellTicks += 1;
    let occupancy = current.occupancy;
    if (this.occupancyDwellTicks >= 3 && this.random.next() < 0.18) {
      const direction = this.random.next() < 0.52 ? -1 : 1;
      occupancy = clamp(current.occupancy + direction, 0, 6);
      if (occupancy !== current.occupancy) this.occupancyDwellTicks = 0;
    }

    const centrality = clamp(observation.centrality, 0, 1);
    const dwellFactor = clamp(observation.dwellSeconds / 45, 0, 1);
    const engagementTarget = observation.visible
      ? 58 + centrality * 22 + dwellFactor * 15
      : 42;
    const engagementDelta = clamp(
      (engagementTarget - current.engagement) * 0.18 + (this.random.next() - 0.5) * 1.2,
      -4,
      4,
    );
    const engagement = Math.round(clamp(current.engagement + engagementDelta, 0, 100));

    const values: SignalValues = {
      temperature,
      occupancy,
      lighting,
      appliance: current.appliance,
      engagement,
    };
    this.snapshot = {
      values,
      statuses: getSignalStatuses(values),
      updatedAt: now.toISOString(),
      tick: this.snapshot.tick + 1,
      mode: this.snapshot.mode,
      updateReason: 'tick',
    };
    return this.snapshot;
  }
}
