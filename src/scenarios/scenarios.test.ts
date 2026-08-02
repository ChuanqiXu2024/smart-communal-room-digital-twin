import { describe, expect, it } from 'vitest';

import { evaluateDecisionRules } from '../decision/decisionEngine';
import { SignalSimulation } from '../simulation/signalSimulation';
import {
  DEMONSTRATION_SCENARIOS,
  getScenario,
  valuesStayWithinScenarioBands,
} from './scenarios';

const hiddenObservation = { visible: false, centrality: 0, dwellSeconds: 0 };
const focusedObservation = { visible: true, centrality: 1, dwellSeconds: 45 };

const activeRules = (simulation: SignalSimulation) =>
  evaluateDecisionRules(simulation.getSnapshot().values)
    .filter(({ active }) => active)
    .map(({ ruleId }) => ruleId);

describe('demonstration scenarios', () => {
  it('defines all six target states in the required order', () => {
    expect(DEMONSTRATION_SCENARIOS.map(({ id }) => id)).toEqual([
      'normal',
      'warm-crowded',
      'poor-presentation',
      'vacant-water-boiler',
      'strong-interest',
      'combined-intervention',
    ]);
    expect(getScenario('normal').target).toEqual({
      temperature: 22.4,
      occupancy: 2,
      lighting: 430,
      appliance: 'ON',
      engagement: 68,
    });
  });

  it('activates exactly the expected rules at every scenario target', () => {
    for (const scenario of DEMONSTRATION_SCENARIOS) {
      const simulation = new SignalSimulation(2026, new Date(0));
      simulation.applyScenario(scenario.id, new Date(1));
      expect(activeRules(simulation), scenario.title).toEqual(scenario.expectedRuleIds);
    }
  });

  it('keeps seeded scenario variation reproducible and inside safe bands', () => {
    for (const scenario of DEMONSTRATION_SCENARIOS) {
      const first = new SignalSimulation(2026, new Date(0));
      const second = new SignalSimulation(2026, new Date(0));
      first.applyScenario(scenario.id, new Date(1));
      second.applyScenario(scenario.id, new Date(1));
      for (let index = 0; index < 100; index += 1) {
        const time = new Date((index + 2) * 2_000);
        const firstSnapshot = first.tick(hiddenObservation, time);
        const secondSnapshot = second.tick(focusedObservation, time);
        expect(firstSnapshot).toEqual(secondSnapshot);
        expect(valuesStayWithinScenarioBands(scenario, firstSnapshot.values)).toBe(true);
        expect(activeRules(first), scenario.title).toEqual(scenario.expectedRuleIds);
      }
    }
  });

  it('temporarily ignores camera engagement while a scenario controls the value', () => {
    const hidden = new SignalSimulation(123, new Date(0));
    const focused = new SignalSimulation(123, new Date(0));
    hidden.applyScenario('strong-interest', new Date(1));
    focused.applyScenario('strong-interest', new Date(1));
    for (let index = 0; index < 12; index += 1) {
      const time = new Date(index + 2);
      hidden.tick(hiddenObservation, time);
      focused.tick(focusedObservation, time);
    }
    expect(hidden.getSnapshot().values.engagement).toBe(
      focused.getSnapshot().values.engagement,
    );
  });

  it('returns to the ordinary baseline and camera-derived engagement mode', () => {
    const simulation = new SignalSimulation(456, new Date(0));
    simulation.applyScenario('strong-interest', new Date(1));
    const baseline = simulation.returnToLiveBaseline(new Date(2));
    expect(baseline.mode).toEqual({ kind: 'live' });
    expect(baseline.values.engagement).toBe(68);
    const afterHiddenTick = simulation.tick(hiddenObservation, new Date(3));
    expect(afterHiddenTick.values.engagement).toBeLessThan(68);
  });
});
