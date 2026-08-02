import { useState } from 'react';
import type { ChangeEvent } from 'react';

import type { HotspotConfiguration, HotspotId } from '../config/hotspots';
import type { CameraSnapshot } from '../playcanvas/RoomCameraController';

interface CalibrationPanelProps {
  readonly hotspots: readonly HotspotConfiguration[];
  readonly selectedHotspotId: HotspotId;
  readonly camera: CameraSnapshot;
  readonly placementStatus: string;
  readonly onSelectedHotspotChange: (id: HotspotId) => void;
  readonly onCoordinateChange: (id: HotspotId, axis: 0 | 1 | 2, value: number) => void;
  readonly onNudge: (id: HotspotId, axis: 0 | 1 | 2, amount: number) => void;
  readonly onArmPlacement: () => void;
  readonly onResetCamera: () => void;
  readonly onResetSelected: () => void;
  readonly onResetAll: () => void;
  readonly onMarkVerified: () => void;
  readonly onCopySelected: () => void;
  readonly onCopyAll: () => void;
  readonly onDownload: () => void;
}

const axisNames = ['X', 'Y', 'Z'] as const;
const nudgeAmounts = [-1, -0.1, -0.01, 0.01, 0.1, 1] as const;

const formatVector = (values: readonly number[]): string =>
  values.map((value) => value.toFixed(3)).join(', ');

export function CalibrationPanel({
  hotspots,
  selectedHotspotId,
  camera,
  placementStatus,
  onSelectedHotspotChange,
  onCoordinateChange,
  onNudge,
  onArmPlacement,
  onResetCamera,
  onResetSelected,
  onResetAll,
  onMarkVerified,
  onCopySelected,
  onCopyAll,
  onDownload,
}: CalibrationPanelProps) {
  const [nudgeAxis, setNudgeAxis] = useState<0 | 1 | 2>(0);
  const selected = hotspots.find(({ id }) => id === selectedHotspotId) ?? hotspots[0];

  const handleCoordinateChange =
    (axis: 0 | 1 | 2) => (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue = Number(event.target.value);
      if (Number.isFinite(nextValue)) onCoordinateChange(selected.id, axis, nextValue);
    };

  return (
    <section className="calibration-panel" data-testid="calibration-panel" aria-labelledby="calibration-heading">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Development only</p>
          <h2 id="calibration-heading">Splat hotspot calibration</h2>
        </div>
        <span className={`verification verification--${selected.verificationStatus}`}>
          {selected.verificationStatus}
        </span>
      </div>

      <p className="panel-note">
        Placement and numeric edits remain in this browser session. They never modify repository
        files automatically.
      </p>

      <label className="field-label" htmlFor="hotspot-selector">
        Selected hotspot
      </label>
      <select
        data-testid="hotspot-selector"
        id="hotspot-selector"
        onChange={(event) => onSelectedHotspotChange(event.target.value as HotspotId)}
        value={selected.id}
      >
        {hotspots.map((hotspot) => (
          <option key={hotspot.id} value={hotspot.id}>
            {hotspot.title}
          </option>
        ))}
      </select>

      <button className="place-hotspot-button" data-testid="place-hotspot" onClick={onArmPlacement} type="button">
        Place selected hotspot
      </button>
      <p className="calibration-status" data-testid="calibration-status" role="status">
        {placementStatus}
      </p>

      <fieldset>
        <legend>Selected world position</legend>
        <div className="coordinate-grid">
          {axisNames.map((axisName, axis) => (
            <label key={axisName}>
              {axisName}
              <input
                data-testid={`hotspot-${axisName.toLowerCase()}`}
                inputMode="decimal"
                onChange={handleCoordinateChange(axis as 0 | 1 | 2)}
                step="0.01"
                type="number"
                value={selected.position[axis]}
              />
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Coordinate nudge</legend>
        <div className="nudge-controls">
          <label>
            Axis
            <select
              data-testid="nudge-axis"
              onChange={(event) => setNudgeAxis(Number(event.target.value) as 0 | 1 | 2)}
              value={nudgeAxis}
            >
              {axisNames.map((axis, index) => (
                <option key={axis} value={index}>
                  {axis}
                </option>
              ))}
            </select>
          </label>
          <div className="nudge-buttons">
            {nudgeAmounts.map((amount) => (
              <button
                aria-label={`Nudge ${axisNames[nudgeAxis]} by ${amount}`}
                className="button-secondary button-compact"
                key={amount}
                onClick={() => onNudge(selected.id, nudgeAxis, amount)}
                type="button"
              >
                {amount > 0 ? '+' : ''}{amount}
              </button>
            ))}
          </div>
        </div>
      </fieldset>

      <dl className="camera-readout">
        <div>
          <dt>Camera position</dt>
          <dd data-testid="camera-position">{formatVector(camera.position)}</dd>
        </div>
        <div>
          <dt>Camera target</dt>
          <dd data-testid="camera-target">{formatVector(camera.target)}</dd>
        </div>
      </dl>

      <div className="calibration-actions">
        <button className="button-secondary" onClick={onResetCamera} type="button">Reset camera</button>
        <button className="button-secondary" data-testid="reset-selected-hotspot" onClick={onResetSelected} type="button">
          Reset selected
        </button>
        <button className="button-secondary" data-testid="reset-all-hotspots" onClick={onResetAll} type="button">
          Reset all hotspots
        </button>
        <button
          className="button-secondary"
          data-testid="mark-hotspot-verified"
          disabled={selected.verificationStatus === 'verified'}
          onClick={onMarkVerified}
          type="button"
        >
          Mark selected verified
        </button>
        <button className="button-secondary" data-testid="copy-selected-coordinate" onClick={onCopySelected} type="button">
          Copy selected coordinate
        </button>
        <button className="button-secondary" data-testid="copy-all-calibration" onClick={onCopyAll} type="button">
          Copy all as JSON
        </button>
        <button data-testid="download-calibration" onClick={onDownload} type="button">
          Download calibration JSON
        </button>
      </div>

      <p className="panel-note">
        After review, copy approved positions and verification states into{' '}
        <code>src/config/hotspots.ts</code>. Future session edits require visual review and
        explicit approval before replacing the verified source coordinates.
      </p>
    </section>
  );
}
