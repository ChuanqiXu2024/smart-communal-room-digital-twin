import { useCallback, useEffect, useRef, useState } from 'react';
import type { MutableRefObject } from 'react';

import {
  SignalSimulation,
  SIMULATION_INTERVAL_MS,
  type EngagementObservation,
  type SignalSnapshot,
} from './signalSimulation';
import type { ScenarioId } from '../scenarios/scenarios';

export interface LiveSimulation {
  readonly snapshot: SignalSnapshot;
  readonly paused: boolean;
  readonly pause: () => void;
  readonly resume: () => void;
  readonly reset: () => SignalSnapshot | undefined;
  readonly selectScenario: (scenarioId: ScenarioId) => SignalSnapshot | undefined;
  readonly returnToLiveBaseline: () => SignalSnapshot | undefined;
}

export const useLiveSimulation = (
  engagementObservation: MutableRefObject<EngagementObservation>,
): LiveSimulation => {
  const simulationRef = useRef<SignalSimulation | null>(null);
  if (!simulationRef.current) simulationRef.current = new SignalSimulation();

  const [snapshot, setSnapshot] = useState(() => simulationRef.current!.getSnapshot());
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const interval = window.setInterval(() => {
      const simulation = simulationRef.current;
      if (!simulation || simulation.isPaused()) return;
      setSnapshot(simulation.tick(engagementObservation.current));
    }, SIMULATION_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [engagementObservation]);

  const pause = useCallback(() => {
    simulationRef.current?.pause();
    setPaused(true);
  }, []);

  const resume = useCallback(() => {
    simulationRef.current?.resume();
    setPaused(false);
  }, []);

  const reset = useCallback(() => {
    const simulation = simulationRef.current;
    if (!simulation) return undefined;
    const next = simulation.reset();
    setSnapshot(next);
    setPaused(false);
    return next;
  }, []);

  const selectScenario = useCallback((scenarioId: ScenarioId) => {
    const simulation = simulationRef.current;
    if (!simulation) return undefined;
    const next = simulation.applyScenario(scenarioId);
    setSnapshot(next);
    return next;
  }, []);

  const returnToLiveBaseline = useCallback(() => {
    const simulation = simulationRef.current;
    if (!simulation) return undefined;
    const next = simulation.returnToLiveBaseline();
    setSnapshot(next);
    return next;
  }, []);

  return {
    snapshot,
    paused,
    pause,
    resume,
    reset,
    selectScenario,
    returnToLiveBaseline,
  };
};
