import { describe, expect, it } from 'vitest';

import {
  DECISION_RULES,
  evaluateDecisionRules,
  type DecisionRuleId,
} from './decisionEngine';
import type { SignalValues } from '../simulation/signalSimulation';

const normalValues: SignalValues = {
  temperature: 22.4,
  occupancy: 2,
  lighting: 430,
  appliance: 'ON',
  engagement: 68,
};

const activeRuleIds = (values: SignalValues): DecisionRuleId[] =>
  evaluateDecisionRules(values)
    .filter(({ active }) => active)
    .map(({ ruleId }) => ruleId);

describe('decision-engine rules', () => {
  it('keeps the normal state free of manufactured recommendations', () => {
    expect(activeRuleIds(normalValues)).toEqual([]);
  });

  it('activates Rule 1 only for temperature above 24°C and occupancy of at least 3', () => {
    expect(activeRuleIds({ ...normalValues, temperature: 25.2, occupancy: 4 })).toEqual([
      'warm-occupied',
    ]);
    expect(activeRuleIds({ ...normalValues, temperature: 24, occupancy: 3 })).not.toContain(
      'warm-occupied',
    );
    expect(activeRuleIds({ ...normalValues, temperature: 24.1, occupancy: 2 })).not.toContain(
      'warm-occupied',
    );
    expect(activeRuleIds({ ...normalValues, temperature: 24.1, occupancy: 3 })).toContain(
      'warm-occupied',
    );
  });

  it('activates Rule 2 only below both strict lighting and engagement thresholds', () => {
    expect(activeRuleIds({ ...normalValues, lighting: 250, engagement: 52 })).toEqual([
      'poor-presentation',
    ]);
    expect(activeRuleIds({ ...normalValues, lighting: 350, engagement: 59 })).not.toContain(
      'poor-presentation',
    );
    expect(activeRuleIds({ ...normalValues, lighting: 349, engagement: 60 })).not.toContain(
      'poor-presentation',
    );
    expect(activeRuleIds({ ...normalValues, lighting: 349, engagement: 59 })).toContain(
      'poor-presentation',
    );
  });

  it('requires both zero occupancy and an ON water boiler for Rule 3', () => {
    expect(activeRuleIds({ ...normalValues, occupancy: 0, engagement: 50 })).toEqual([
      'vacant-water-boiler',
    ]);
    expect(
      activeRuleIds({ ...normalValues, occupancy: 1, appliance: 'ON', engagement: 50 }),
    ).not.toContain('vacant-water-boiler');
    expect(
      activeRuleIds({ ...normalValues, occupancy: 0, appliance: 'OFF', engagement: 50 }),
    ).not.toContain('vacant-water-boiler');
  });

  it('activates Rule 4 only when engagement is strictly above 75', () => {
    expect(activeRuleIds({ ...normalValues, engagement: 75 })).not.toContain(
      'strong-social-interest',
    );
    expect(activeRuleIds({ ...normalValues, engagement: 76 })).toContain(
      'strong-social-interest',
    );
  });

  it('formats evidence with current values and exact thresholds', () => {
    const recommendations = evaluateDecisionRules({
      ...normalValues,
      temperature: 25.2,
      occupancy: 4,
      lighting: 250,
      engagement: 52,
    });
    expect(recommendations.find(({ ruleId }) => ruleId === 'warm-occupied')?.triggeringEvidence)
      .toEqual([
        '25.2°C exceeds the 24°C threshold.',
        'Occupancy is 4 people, meeting the threshold of 3.',
      ]);
    expect(
      recommendations.find(({ ruleId }) => ruleId === 'poor-presentation')
        ?.triggeringEvidence,
    ).toEqual([
      '250 lux is below the 350 lux threshold.',
      'Viewer engagement is 52/100, below the 60/100 threshold.',
    ]);
  });

  it('maps every rule to the required involved signals', () => {
    expect(
      Object.fromEntries(
        DECISION_RULES.map(({ ruleId, involvedSignalIds }) => [
          ruleId,
          involvedSignalIds,
        ]),
      ),
    ).toEqual({
      'warm-occupied': ['temperature', 'occupancy'],
      'poor-presentation': ['lighting', 'engagement'],
      'vacant-water-boiler': ['occupancy', 'appliance'],
      'strong-social-interest': ['engagement'],
    });
  });

  it('keeps Rule 3 specific to the non-essential communal water boiler', () => {
    const rule = DECISION_RULES.find(({ ruleId }) => ruleId === 'vacant-water-boiler');
    const wording = JSON.stringify(rule);
    expect(wording).toMatch(/communal (countertop )?water boiler/i);
    expect(wording).toMatch(/safe to switch off/i);
    expect(wording).toMatch(/only after those checks/i);
    expect(wording).toMatch(/never to refrigerators, safety equipment, heating controls/i);
    expect(wording).not.toMatch(/switch off (a|the) refrigerator/i);
  });
});
