import { useEffect, useState } from 'react';

import type { DecisionEvent } from '../decision/decisionState';

interface DecisionEventLogProps {
  readonly events: readonly DecisionEvent[];
  readonly onClear: () => void;
  readonly defaultExpanded: boolean;
}

const eventTypeLabels: Record<DecisionEvent['type'], string> = {
  'recommendation-activated': 'Recommendation activated',
  'recommendation-deactivated': 'Recommendation deactivated',
  'scenario-changed': 'Scenario changed',
  'returned-to-live-baseline': 'Returned to live baseline',
};

const formatEventTime = (timestamp: string): string =>
  new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(timestamp));

export function DecisionEventLog({
  events,
  onClear,
  defaultExpanded,
}: DecisionEventLogProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  useEffect(() => {
    setExpanded(defaultExpanded);
  }, [defaultExpanded]);

  return (
    <section
      aria-labelledby="decision-events-heading"
      className="events-panel"
      data-testid="decision-events"
    >
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Session-only transitions</p>
          <h2 id="decision-events-heading">Recent decision events</h2>
        </div>
        <button
          className="button-secondary button-compact"
          aria-controls="decision-events-content"
          aria-expanded={expanded}
          data-testid="toggle-decision-events"
          onClick={() => setExpanded((current) => !current)}
          type="button"
        >
          {expanded ? 'Collapse events' : `Expand events (${events.length})`}
        </button>
      </div>

      <div className="events-content" hidden={!expanded} id="decision-events-content">
        <div className="events-actions">
          <button
            className="button-secondary button-compact"
            data-testid="clear-decision-events"
            disabled={events.length === 0}
            onClick={onClear}
            type="button"
          >
            Clear log
          </button>
        </div>

        {events.length === 0 ? (
          <p className="empty-events">No recommendation or scenario transitions recorded yet.</p>
        ) : (
          <ol className="event-list">
            {events.map((event) => (
              <li data-event-type={event.type} key={event.id}>
                <time dateTime={event.timestamp}>{formatEventTime(event.timestamp)}</time>
                <div>
                  <span>{eventTypeLabels[event.type]}</span>
                  <strong>{event.title}</strong>
                  <p>{event.summary}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
        <p className="events-note">
          Only transitions are recorded. The most recent 20 events remain in this browser session
          and are never persisted.
        </p>
      </div>
    </section>
  );
}
