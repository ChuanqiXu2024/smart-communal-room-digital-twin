import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { evaluateDecisionRules } from './decisionEngine';
import {
  DecisionStateModel,
  type DecisionSupportSnapshot,
} from './decisionState';
import type { DemonstrationScenario } from '../scenarios/scenarios';
import type { SignalSnapshot } from '../simulation/signalSimulation';

export interface DecisionSupportController {
  readonly snapshot: DecisionSupportSnapshot;
  readonly recordScenarioChange: (
    scenario: DemonstrationScenario,
    signalSnapshot: SignalSnapshot,
  ) => void;
  readonly recordReturnToLiveBaseline: (signalSnapshot: SignalSnapshot) => void;
  readonly clearEvents: () => void;
}

const snapshotKey = (snapshot: SignalSnapshot): string =>
  `${snapshot.updatedAt}:${snapshot.tick}:${snapshot.mode.kind}:${
    snapshot.mode.kind === 'scenario' ? snapshot.mode.scenarioId : 'live'
  }:${snapshot.updateReason}`;

export const useDecisionSupport = (
  signalSnapshot: SignalSnapshot,
): DecisionSupportController => {
  const modelRef = useRef<DecisionStateModel | null>(null);
  if (!modelRef.current) modelRef.current = new DecisionStateModel();

  const initialKey = snapshotKey(signalSnapshot);
  const lastEvaluatedKeyRef = useRef(initialKey);
  const [snapshot, setSnapshot] = useState(() =>
    modelRef.current!.evaluate(signalSnapshot.values, {
      now: new Date(signalSnapshot.updatedAt),
    }),
  );

  useEffect(() => {
    const key = snapshotKey(signalSnapshot);
    if (lastEvaluatedKeyRef.current === key) return;
    lastEvaluatedKeyRef.current = key;
    const explicitModeChange =
      signalSnapshot.updateReason === 'scenario-selection' ||
      signalSnapshot.updateReason === 'reset' ||
      signalSnapshot.updateReason === 'return-live-baseline';
    setSnapshot(
      modelRef.current!.evaluate(signalSnapshot.values, {
        now: new Date(signalSnapshot.updatedAt),
        immediate: explicitModeChange,
      }),
    );
  }, [signalSnapshot]);

  const recordScenarioChange = useCallback(
    (scenario: DemonstrationScenario, nextSignalSnapshot: SignalSnapshot) => {
      setSnapshot(
        modelRef.current!.recordScenarioChange(
          scenario.id,
          scenario.title,
          nextSignalSnapshot.values,
          new Date(nextSignalSnapshot.updatedAt),
        ),
      );
    },
    [],
  );

  const recordReturnToLiveBaseline = useCallback(
    (nextSignalSnapshot: SignalSnapshot) => {
      setSnapshot(
        modelRef.current!.recordReturnToLiveBaseline(
          nextSignalSnapshot.values,
          new Date(nextSignalSnapshot.updatedAt),
        ),
      );
    },
    [],
  );

  const clearEvents = useCallback(() => {
    setSnapshot(modelRef.current!.clearEvents());
  }, []);

  const currentRecommendations = useMemo(() => {
    const activeRuleIds = new Set(snapshot.activeRuleIds);
    return evaluateDecisionRules(signalSnapshot.values).map((recommendation) => ({
      ...recommendation,
      active: activeRuleIds.has(recommendation.ruleId),
    }));
  }, [signalSnapshot.values, snapshot.activeRuleIds]);

  return {
    snapshot: {
      ...snapshot,
      recommendations: currentRecommendations,
    },
    recordScenarioChange,
    recordReturnToLiveBaseline,
    clearEvents,
  };
};
