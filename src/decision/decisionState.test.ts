import { describe, expect, it } from 'vitest';

import { DecisionStateModel, MAX_DECISION_EVENTS } from './decisionState';
import type { SignalValues } from '../simulation/signalSimulation';

const normalValues: SignalValues = {
  temperature: 22.4,
  occupancy: 2,
  lighting: 430,
  appliance: 'ON',
  engagement: 68,
};

const warmValues: SignalValues = {
  ...normalValues,
  temperature: 25.2,
  occupancy: 4,
};

describe('stable decision state', () => {
  it('requires two consecutive ordinary updates to activate and deactivate', () => {
    const model = new DecisionStateModel(2);
    expect(model.evaluate(normalValues, { now: new Date(0) }).activeRuleIds).toEqual([]);
    expect(model.evaluate(warmValues, { now: new Date(1) }).activeRuleIds).toEqual([]);
    expect(model.evaluate(warmValues, { now: new Date(2) }).activeRuleIds).toEqual([
      'warm-occupied',
    ]);
    expect(model.evaluate(normalValues, { now: new Date(3) }).activeRuleIds).toEqual([
      'warm-occupied',
    ]);
    expect(model.evaluate(normalValues, { now: new Date(4) }).activeRuleIds).toEqual([]);
  });

  it('applies explicit scenario states immediately', () => {
    const model = new DecisionStateModel(2);
    model.evaluate(normalValues, { now: new Date(0) });
    expect(
      model.evaluate(warmValues, { now: new Date(1), immediate: true }).activeRuleIds,
    ).toEqual(['warm-occupied']);
  });

  it('records only transitions and never duplicates stable recommendations', () => {
    const model = new DecisionStateModel(2);
    model.evaluate(normalValues, { now: new Date(0) });
    model.evaluate(warmValues, { now: new Date(1), immediate: true });
    model.evaluate(warmValues, { now: new Date(2) });
    model.evaluate(warmValues, { now: new Date(3) });
    expect(
      model
        .getSnapshot()
        .events.filter(({ type }) => type === 'recommendation-activated'),
    ).toHaveLength(1);
  });

  it('does not create misleading inactive events on initial page load', () => {
    const model = new DecisionStateModel();
    expect(model.evaluate(normalValues, { now: new Date(0) }).events).toEqual([]);
  });

  it('records scenario and return-to-baseline events with state summaries', () => {
    const model = new DecisionStateModel();
    model.evaluate(normalValues, { now: new Date(0) });
    model.recordScenarioChange('warm-crowded', 'Warm and crowded', warmValues, new Date(1));
    model.recordReturnToLiveBaseline(normalValues, new Date(2));
    expect(model.getSnapshot().events.map(({ type }) => type)).toEqual([
      'returned-to-live-baseline',
      'scenario-changed',
    ]);
    expect(model.getSnapshot().events[0].summary).toMatch(/camera-derived engagement/i);
  });

  it('keeps only the most recent 20 events and can clear them', () => {
    const model = new DecisionStateModel();
    model.evaluate(normalValues, { now: new Date(0) });
    for (let index = 0; index < MAX_DECISION_EVENTS + 5; index += 1) {
      model.recordScenarioChange(
        'normal',
        `Normal communal use ${index}`,
        normalValues,
        new Date(index + 1),
      );
    }
    expect(model.getSnapshot().events).toHaveLength(MAX_DECISION_EVENTS);
    expect(model.getSnapshot().events[0].title).toBe('Normal communal use 24');
    expect(model.clearEvents().events).toEqual([]);
  });
});
