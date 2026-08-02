import {
  DECISION_RULES,
  type EvaluatedRecommendation,
} from '../decision/decisionEngine';

interface DecisionSupportPanelProps {
  readonly recommendations: readonly EvaluatedRecommendation[];
}

const signalNames: Record<string, string> = {
  temperature: 'temperature',
  occupancy: 'occupancy',
  lighting: 'lighting',
  appliance: 'communal water-boiler state',
  engagement: 'viewer-engagement proxy',
};

export function DecisionSupportPanel({
  recommendations,
}: DecisionSupportPanelProps) {
  const activeRecommendations = recommendations.filter(({ active }) => active);

  return (
    <section
      aria-labelledby="decision-support-heading"
      className="decision-panel"
      data-active-count={activeRecommendations.length}
      data-testid="decision-support"
    >
      <div className="panel-heading">
        <div>
          <p className="eyebrow">System-generated guidance</p>
          <h2 id="decision-support-heading">Decision support</h2>
        </div>
        <span className="recommendation-count" data-testid="active-recommendation-count">
          {activeRecommendations.length} active
        </span>
      </div>

      <p className="decision-disclosure">
        Transparent rule-based prototype — recommendations support, but do not replace, human
        property-management judgement.
      </p>

      {activeRecommendations.length === 0 ? (
        <p className="no-recommendations" data-testid="no-recommendations">
          No intervention is currently triggered under the demonstration rules.
        </p>
      ) : (
        <div className="recommendation-list">
          {activeRecommendations.map((recommendation) => (
            <article
              className={`recommendation-card recommendation-card--${recommendation.priority.toLowerCase()}`}
              data-rule-id={recommendation.ruleId}
              data-testid={`recommendation-${recommendation.ruleId}`}
              key={recommendation.ruleId}
            >
              <div className="recommendation-meta">
                <span>{recommendation.priority}</span>
                <span>{recommendation.category}</span>
              </div>
              <h3>{recommendation.title}</h3>

              <section>
                <h4>Triggering evidence</h4>
                <ul>
                  {recommendation.triggeringEvidence.map((evidence) => (
                    <li key={evidence}>{evidence}</li>
                  ))}
                </ul>
              </section>

              <p>{recommendation.explanation}</p>

              <section>
                <h4>Recommended actions</h4>
                <ul>
                  {recommendation.recommendedActions.map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </ul>
              </section>

              <p className="expected-outcome">
                <strong>Expected outcome:</strong> {recommendation.expectedOutcome}
              </p>
              <p className="human-review">{recommendation.humanReviewLimitation}</p>
            </article>
          ))}
        </div>
      )}

      <details className="rule-explanation" data-testid="rule-explanation">
        <summary>How decisions are generated</summary>
        <div className="rule-explanation__content">
          <p>
            Each rule compares the current public signal snapshot with an exact threshold. Ordinary
            updates must agree twice before a recommendation changes; explicit scenario changes are
            applied immediately.
          </p>
          {DECISION_RULES.map((rule, index) => (
            <article key={rule.ruleId}>
              <span>Rule {index + 1}</span>
              <h3>{rule.title}</h3>
              <p>{rule.thresholdDescription}</p>
              <small>
                Signals: {rule.involvedSignalIds.map((id) => signalNames[id]).join(', ')}
              </small>
            </article>
          ))}
        </div>
      </details>
    </section>
  );
}
