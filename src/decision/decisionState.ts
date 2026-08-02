import {
  DECISION_RULE_IDS,
  evaluateDecisionRules,
  type DecisionRuleId,
  type EvaluatedRecommendation,
} from './decisionEngine';
import type { ScenarioId } from '../scenarios/scenarios';
import type { SignalValues } from '../simulation/signalSimulation';

export const DECISION_STABILITY_UPDATES = 2;
export const MAX_DECISION_EVENTS = 20;

export type DecisionEventType =
  | 'recommendation-activated'
  | 'recommendation-deactivated'
  | 'scenario-changed'
  | 'returned-to-live-baseline';

export interface DecisionEvent {
  readonly id: string;
  readonly timestamp: string;
  readonly type: DecisionEventType;
  readonly title: string;
  readonly summary: string;
  readonly ruleId?: DecisionRuleId;
  readonly scenarioId?: ScenarioId;
}

export interface DecisionSupportSnapshot {
  readonly recommendations: readonly EvaluatedRecommendation[];
  readonly activeRuleIds: readonly DecisionRuleId[];
  readonly events: readonly DecisionEvent[];
}

interface PendingTransition {
  target: boolean;
  count: number;
}

interface EvaluationOptions {
  readonly now?: Date;
  readonly immediate?: boolean;
}

const summarizeValues = (values: SignalValues): string =>
  `${values.temperature.toFixed(1)}°C; ${values.occupancy} people; ${Math.round(values.lighting)} lux; water boiler ${values.appliance}; engagement ${Math.round(values.engagement)}/100.`;

export class DecisionStateModel {
  private readonly active = new Map<DecisionRuleId, boolean>(
    DECISION_RULE_IDS.map((ruleId) => [ruleId, false]),
  );
  private readonly pending = new Map<DecisionRuleId, PendingTransition>();
  private events: DecisionEvent[] = [];
  private eventSequence = 0;
  private initialized = false;
  private recommendations: readonly EvaluatedRecommendation[] = [];

  public constructor(
    private readonly requiredConsecutiveUpdates = DECISION_STABILITY_UPDATES,
  ) {
    if (!Number.isInteger(requiredConsecutiveUpdates) || requiredConsecutiveUpdates < 1) {
      throw new Error('Decision stability must require at least one update.');
    }
  }

  public evaluate(
    values: SignalValues,
    { now = new Date(), immediate = false }: EvaluationOptions = {},
  ): DecisionSupportSnapshot {
    const rawRecommendations = evaluateDecisionRules(values);

    if (!this.initialized) {
      this.initialized = true;
      rawRecommendations.forEach((recommendation) => {
        if (immediate) {
          this.active.set(recommendation.ruleId, recommendation.active);
          if (recommendation.active) this.recordRuleTransition(recommendation, true, now);
        } else if (recommendation.active) {
          this.pending.set(recommendation.ruleId, { target: true, count: 1 });
        }
      });
    } else {
      rawRecommendations.forEach((recommendation) => {
        const current = this.active.get(recommendation.ruleId) ?? false;
        if (recommendation.active === current) {
          this.pending.delete(recommendation.ruleId);
          return;
        }

        if (immediate) {
          this.active.set(recommendation.ruleId, recommendation.active);
          this.pending.delete(recommendation.ruleId);
          this.recordRuleTransition(recommendation, recommendation.active, now);
          return;
        }

        const existing = this.pending.get(recommendation.ruleId);
        const nextCount =
          existing?.target === recommendation.active ? existing.count + 1 : 1;
        if (nextCount >= this.requiredConsecutiveUpdates) {
          this.active.set(recommendation.ruleId, recommendation.active);
          this.pending.delete(recommendation.ruleId);
          this.recordRuleTransition(recommendation, recommendation.active, now);
        } else {
          this.pending.set(recommendation.ruleId, {
            target: recommendation.active,
            count: nextCount,
          });
        }
      });
    }

    this.recommendations = rawRecommendations.map((recommendation) => ({
      ...recommendation,
      active: this.active.get(recommendation.ruleId) ?? false,
    }));
    return this.getSnapshot();
  }

  public recordScenarioChange(
    scenarioId: ScenarioId,
    title: string,
    values: SignalValues,
    now = new Date(),
  ): DecisionSupportSnapshot {
    this.addEvent({
      timestamp: now.toISOString(),
      type: 'scenario-changed',
      title,
      scenarioId,
      summary: summarizeValues(values),
    });
    return this.getSnapshot();
  }

  public recordReturnToLiveBaseline(
    values: SignalValues,
    now = new Date(),
  ): DecisionSupportSnapshot {
    this.addEvent({
      timestamp: now.toISOString(),
      type: 'returned-to-live-baseline',
      title: 'Live baseline restored',
      summary: `Ordinary seeded simulation and camera-derived engagement restored. ${summarizeValues(values)}`,
    });
    return this.getSnapshot();
  }

  public clearEvents(): DecisionSupportSnapshot {
    this.events = [];
    return this.getSnapshot();
  }

  public getSnapshot(): DecisionSupportSnapshot {
    return {
      recommendations: this.recommendations,
      activeRuleIds: DECISION_RULE_IDS.filter((ruleId) => this.active.get(ruleId)),
      events: [...this.events],
    };
  }

  private recordRuleTransition(
    recommendation: EvaluatedRecommendation,
    active: boolean,
    now: Date,
  ) {
    this.addEvent({
      timestamp: now.toISOString(),
      type: active ? 'recommendation-activated' : 'recommendation-deactivated',
      title: recommendation.title,
      ruleId: recommendation.ruleId,
      summary: recommendation.triggeringEvidence.join(' '),
    });
  }

  private addEvent(event: Omit<DecisionEvent, 'id'>) {
    this.eventSequence += 1;
    this.events = [
      { ...event, id: `decision-event-${this.eventSequence}` },
      ...this.events,
    ].slice(0, MAX_DECISION_EVENTS);
  }
}
