import type {
  HotspotConfiguration,
  HotspotId,
  SignalId,
} from '../config/hotspots';
import { formatSignal, type SignalSnapshot } from '../simulation/signalSimulation';

interface LiveSignalsPanelProps {
  readonly hotspots: readonly HotspotConfiguration[];
  readonly snapshot: SignalSnapshot;
  readonly paused: boolean;
  readonly activeHotspotId: HotspotId | null;
  readonly highlightedSignalIds: readonly SignalId[];
  readonly onActiveHotspotChange: (id: HotspotId) => void;
  readonly onViewSpatialZone: (id: HotspotId) => void;
}

const formatUpdateTime = (isoTimestamp: string): string =>
  new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(isoTimestamp));

export function LiveSignalsPanel({
  hotspots,
  snapshot,
  paused,
  activeHotspotId,
  highlightedSignalIds,
  onActiveHotspotChange,
  onViewSpatialZone,
}: LiveSignalsPanelProps) {
  return (
    <section className="signals-panel" aria-labelledby="signals-heading">
      <div className="panel-heading signals-heading">
        <div>
          <p className="eyebrow">Spatial data layer</p>
          <h2 id="signals-heading">Live environment signals</h2>
        </div>
        <span className={`simulation-state ${paused ? 'is-paused' : ''}`} data-testid="simulation-state">
          {paused ? 'Simulation paused' : 'Simulation running'}
        </span>
      </div>

      <p className="ethics-disclosure">
        Environmental values are realistically simulated for demonstration. Viewer engagement is
        an interaction-based proxy and does not use biometric or emotion-recognition data.
      </p>

      <div className="signal-freshness">
        <span>
          Mode: {snapshot.mode.kind === 'live' ? 'live camera-derived baseline' : 'scenario preset'}
        </span>
        <span className="last-updated">
          Last update{' '}
          <time data-testid="simulation-updated-at" dateTime={snapshot.updatedAt}>
            {formatUpdateTime(snapshot.updatedAt)}
          </time>
        </span>
      </div>

      <div className="signal-list">
        {hotspots.map((hotspot) => {
          const signal = formatSignal(hotspot.signalId, snapshot);
          const isActive = activeHotspotId === hotspot.id;
          const isRecommendationInvolved = highlightedSignalIds.includes(hotspot.signalId);
          return (
            <article
              aria-label={`${hotspot.title}: ${signal.value} ${signal.unit}, ${signal.status}`}
              className="signal-card"
              data-active={String(isActive)}
              data-hotspot-id={hotspot.id}
              data-recommendation-involved={String(isRecommendationInvolved)}
              data-testid={`signal-card-${hotspot.id}`}
              id={`signal-card-${hotspot.id}`}
              key={hotspot.id}
              onClick={() => onActiveHotspotChange(hotspot.id)}
              onFocus={() => onActiveHotspotChange(hotspot.id)}
              tabIndex={0}
            >
              <div className="signal-card__heading">
                <h3>{hotspot.title}</h3>
                <span className="signal-status">{signal.status}</span>
              </div>
              <p className="signal-value">
                <strong>{signal.value}</strong>
                {signal.unit && <span>{signal.unit}</span>}
              </p>
              <span className="source-badge">{signal.sourceBadge}</span>
              <p className="signal-source">{signal.sourceDescription}</p>
              <p className="signal-zone">
                <span>Spatial zone</span>
                {hotspot.zone}
              </p>
              <p className={`verification verification--${hotspot.verificationStatus}`}>
                {hotspot.verificationStatus === 'verified'
                  ? 'Verified coordinate'
                  : 'Provisional coordinate'}
              </p>
              <button
                className="signal-zone-action button-secondary"
                data-testid={`view-spatial-zone-${hotspot.id}`}
                onClick={(event) => {
                  event.stopPropagation();
                  onViewSpatialZone(hotspot.id);
                }}
                type="button"
              >
                View spatial zone
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
