import type { SignalId } from '../config/hotspots';
import type { SignalValues } from '../simulation/signalSimulation';

export const DECISION_RULE_IDS = [
  'warm-occupied',
  'poor-presentation',
  'vacant-water-boiler',
  'strong-social-interest',
] as const;

export type DecisionRuleId = (typeof DECISION_RULE_IDS)[number];
export type RecommendationPriority = 'High' | 'Medium' | 'Opportunity';

export interface DecisionRuleDefinition {
  readonly ruleId: DecisionRuleId;
  readonly title: string;
  readonly priority: RecommendationPriority;
  readonly category: string;
  readonly involvedSignalIds: readonly SignalId[];
  readonly thresholdDescription: string;
  readonly explanation: string;
  readonly recommendedActions: readonly string[];
  readonly expectedOutcome: string;
  readonly humanReviewLimitation: string;
}

export interface EvaluatedRecommendation extends DecisionRuleDefinition {
  readonly active: boolean;
  readonly triggeringEvidence: readonly string[];
}

export const DECISION_RULES: readonly DecisionRuleDefinition[] = [
  {
    ruleId: 'warm-occupied',
    title: 'Prepare ventilation before the next viewing',
    priority: 'High',
    category: 'Comfort and viewing readiness',
    involvedSignalIds: ['temperature', 'occupancy'],
    thresholdDescription: 'Active when temperature is above 24°C and occupancy is at least 3 people.',
    explanation:
      'A warm room with several occupants may become uncomfortable and weaken the next viewing experience.',
    recommendedActions: [
      'Improve ventilation.',
      'Reduce unnecessary heating.',
      'Consider avoiding simultaneous group viewings while the room remains warm.',
      'Confirm the room is comfortable before the next viewing.',
    ],
    expectedOutcome:
      'Improved resident comfort and a more favourable property-viewing experience.',
    humanReviewLimitation:
      'Human review required. Confirm actual room conditions and appropriate building operation before acting.',
  },
  {
    ruleId: 'poor-presentation',
    title: 'Improve presentation of the communal focal zone',
    priority: 'Medium',
    category: 'Viewing experience',
    involvedSignalIds: ['lighting', 'engagement'],
    thresholdDescription:
      'Active when lighting is below 350 lux and viewer engagement is below 60/100.',
    explanation:
      'Low simulated light alongside low navigational attention can indicate that the communal focal zone is being presented weakly.',
    recommendedActions: [
      'Open curtains where appropriate.',
      'Improve ambient or task lighting.',
      'Declutter or restage the dining and social focal area.',
      'Review how the communal space is introduced during a property viewing.',
    ],
    expectedOutcome:
      'Improved visual presentation and stronger attention to the communal-room proposition.',
    humanReviewLimitation:
      'Human review required. Inspect the room and viewing context before changing presentation or lighting.',
  },
  {
    ruleId: 'vacant-water-boiler',
    title: 'Review the unused communal water boiler',
    priority: 'Medium',
    category: 'Operational efficiency',
    involvedSignalIds: ['occupancy', 'appliance'],
    thresholdDescription:
      'Active when simulated occupancy is zero and the monitored communal countertop water boiler is ON.',
    explanation:
      'The selected non-essential communal countertop water boiler may be consuming avoidable energy while the room is vacant.',
    recommendedActions: [
      'Confirm that the room is vacant.',
      'Confirm that the communal countertop water boiler is not currently needed.',
      'Confirm that it is safe to switch off.',
      'Switch it off only after those checks are complete.',
    ],
    expectedOutcome:
      'Reduced avoidable energy consumption without affecting essential equipment.',
    humanReviewLimitation:
      'Human review required. This rule applies only to the selected non-essential communal water boiler and never to refrigerators, safety equipment, heating controls, or essential continuously powered devices.',
  },
  {
    ruleId: 'strong-social-interest',
    title: 'Feature the communal social zone in the rental proposition',
    priority: 'Opportunity',
    category: 'Rental marketing',
    involvedSignalIds: ['engagement'],
    thresholdDescription:
      'Active when the interaction-derived viewer-engagement proxy is above 75/100.',
    explanation:
      'Sustained navigational attention around the dining and social focal zone suggests an opportunity to foreground that amenity.',
    recommendedActions: [
      'Emphasise the dining and social area in the property listing.',
      'Feature it prominently in the viewing script.',
      'Consider stronger photography or clearer amenity descriptions for this area.',
    ],
    expectedOutcome:
      'Better alignment between the property proposition and the area attracting the strongest viewing attention.',
    humanReviewLimitation:
      'Human review required. Engagement is a navigational proxy, not biometric, identity, demographic, or emotion analysis.',
  },
] as const;

const formatPeople = (count: number): string => `${count} ${count === 1 ? 'person' : 'people'}`;

const evidenceForRule = (
  ruleId: DecisionRuleId,
  values: SignalValues,
): readonly string[] => {
  switch (ruleId) {
    case 'warm-occupied':
      return [
        `${values.temperature.toFixed(1)}°C ${values.temperature > 24 ? 'exceeds' : 'does not exceed'} the 24°C threshold.`,
        `Occupancy is ${formatPeople(values.occupancy)}, ${values.occupancy >= 3 ? 'meeting' : 'below'} the threshold of 3.`,
      ];
    case 'poor-presentation':
      return [
        `${Math.round(values.lighting)} lux is ${values.lighting < 350 ? 'below' : 'not below'} the 350 lux threshold.`,
        `Viewer engagement is ${Math.round(values.engagement)}/100, ${values.engagement < 60 ? 'below' : 'not below'} the 60/100 threshold.`,
      ];
    case 'vacant-water-boiler':
      return [
        `Occupancy is ${formatPeople(values.occupancy)}; zero is required for this rule.`,
        `The monitored communal countertop water boiler is ${values.appliance}.`,
      ];
    case 'strong-social-interest':
      return [
        `Viewer engagement is ${Math.round(values.engagement)}/100, ${values.engagement > 75 ? 'exceeding' : 'not exceeding'} the 75/100 threshold.`,
      ];
  }
};

const isRuleActive = (ruleId: DecisionRuleId, values: SignalValues): boolean => {
  switch (ruleId) {
    case 'warm-occupied':
      return values.temperature > 24 && values.occupancy >= 3;
    case 'poor-presentation':
      return values.lighting < 350 && values.engagement < 60;
    case 'vacant-water-boiler':
      return values.occupancy === 0 && values.appliance === 'ON';
    case 'strong-social-interest':
      return values.engagement > 75;
  }
};

export const evaluateDecisionRules = (
  values: SignalValues,
): readonly EvaluatedRecommendation[] =>
  DECISION_RULES.map((rule) => ({
    ...rule,
    active: isRuleActive(rule.ruleId, values),
    triggeringEvidence: evidenceForRule(rule.ruleId, values),
  }));
