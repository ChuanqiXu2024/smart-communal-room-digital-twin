import {
  DEMONSTRATION_SCENARIOS,
  type ScenarioId,
} from '../scenarios/scenarios';
import { DECISION_RULE_IDS } from '../decision/decisionEngine';
import type { SimulationMode } from '../simulation/signalSimulation';

interface DemonstrationScenariosPanelProps {
  readonly mode: SimulationMode;
  readonly paused: boolean;
  readonly onPause: () => void;
  readonly onReset: () => void;
  readonly onResume: () => void;
  readonly onReturnToLiveBaseline: () => void;
  readonly onSelectScenario: (scenarioId: ScenarioId) => void;
}

export function DemonstrationScenariosPanel({
  mode,
  paused,
  onPause,
  onReset,
  onResume,
  onReturnToLiveBaseline,
  onSelectScenario,
}: DemonstrationScenariosPanelProps) {
  const selectedScenario =
    mode.kind === 'scenario'
      ? DEMONSTRATION_SCENARIOS.find(({ id }) => id === mode.scenarioId)
      : undefined;

  return (
    <section
      aria-labelledby="scenarios-heading"
      className="scenarios-panel"
      data-testid="demonstration-scenarios"
    >
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Reproducible conditions</p>
          <h2 id="scenarios-heading">Demonstration scenarios</h2>
        </div>
        <span className="scenario-mode" data-testid="scenario-mode">
          {selectedScenario?.title ?? 'Live baseline'}
        </span>
      </div>

      <p className="scenario-disclosure">
        Scenario presets set simulated target conditions for reproducible demonstration. Small
        bounded variation may continue around each target. These are not real measurements.
      </p>

      {selectedScenario && (
        <p className="scenario-override" data-testid="engagement-scenario-override">
          Scenario mode temporarily overrides the normal camera-interaction engagement proxy.
        </p>
      )}

      <div className="scenario-controls" aria-label="Scenario and simulation controls">
        {paused ? (
          <button data-testid="resume-simulation" onClick={onResume} type="button">
            Resume simulation
          </button>
        ) : (
          <button data-testid="pause-simulation" onClick={onPause} type="button">
            Pause simulation
          </button>
        )}
        <button
          className="button-secondary"
          data-testid="return-live-baseline"
          disabled={paused || mode.kind === 'live'}
          onClick={onReturnToLiveBaseline}
          type="button"
        >
          Return to live baseline
        </button>
        <button
          className="button-secondary"
          data-testid="reset-simulation"
          onClick={onReset}
          type="button"
        >
          Reset to normal
        </button>
      </div>

      <div className="scenario-grid">
        {DEMONSTRATION_SCENARIOS.map((scenario) => {
          const selected = selectedScenario?.id === scenario.id;
          return (
            <button
              aria-pressed={selected}
              className="scenario-card"
              data-testid={`scenario-${scenario.id}`}
              disabled={paused}
              key={scenario.id}
              onClick={() => onSelectScenario(scenario.id)}
              type="button"
            >
              <strong>{scenario.title}</strong>
              <span>{scenario.summary}</span>
              <small>
                Expected rules:{' '}
                {scenario.expectedRuleIds.length === 0
                  ? 'none'
                  : scenario.expectedRuleIds
                      .map((ruleId) => `Rule ${DECISION_RULE_IDS.indexOf(ruleId) + 1}`)
                      .join(', ')}
              </small>
            </button>
          );
        })}
      </div>
    </section>
  );
}
