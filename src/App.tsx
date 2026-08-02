import {
  lazy,
  Suspense,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';

import { createCalibrationExport, serializeCalibrationExport } from './calibration/calibrationExport';
import { DecisionSupportPanel } from './components/DecisionSupportPanel';
import { DemonstrationScenariosPanel } from './components/DemonstrationScenariosPanel';
import { LiveSignalsPanel } from './components/LiveSignalsPanel';
import type { SceneViewerHandle } from './components/SceneViewer';
import {
  CAMERA_PRESETS,
  DEFAULT_CAMERA_PRESET_ID,
  HOTSPOT_CAMERA_PRESET,
  type CameraPresetId,
} from './config/cameraPresets';
import {
  HOTSPOTS,
  cloneHotspots,
  type HotspotConfiguration,
  type HotspotId,
  type SignalId,
} from './config/hotspots';
import { HOSTED_SCENE, type Vector3Tuple } from './config/scene';
import { useDecisionSupport } from './decision/useDecisionSupport';
import type { CameraSnapshot } from './playcanvas/RoomCameraController';
import { getScenario, type ScenarioId } from './scenarios/scenarios';
import type { EngagementObservation } from './simulation/signalSimulation';
import { useLiveSimulation } from './simulation/useLiveSimulation';

const initialQuery = new URLSearchParams(window.location.search);
const INITIAL_PRESENTATION_MODE = initialQuery.get('present') === '1';
const INITIAL_CALIBRATION_MODE =
  import.meta.env.DEV &&
  !INITIAL_PRESENTATION_MODE &&
  initialQuery.get('calibrate') === '1';

const SceneViewer = lazy(async () => {
  const module = await import('./components/SceneViewer');
  return { default: module.SceneViewer };
});

const CalibrationPanel = lazy(async () => {
  const module = await import('./components/CalibrationPanel');
  return { default: module.CalibrationPanel };
});

const DecisionEventLog = lazy(async () => {
  const module = await import('./components/DecisionEventLog');
  return { default: module.DecisionEventLog };
});

const initialCameraSnapshot: CameraSnapshot = {
  position: HOSTED_SCENE.initialCamera.position,
  target: HOSTED_SCENE.initialCamera.target,
  fieldOfView: HOSTED_SCENE.initialCamera.fieldOfView,
  presetId: DEFAULT_CAMERA_PRESET_ID,
};

const copyText = async (text: string): Promise<void> => {
  try {
    await navigator.clipboard.writeText(text);
    return;
  } catch {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const copied = document.execCommand('copy');
    textarea.remove();
    if (!copied) throw new Error('Browser clipboard access was denied.');
  }
};

export function App() {
  const viewerRef = useRef<SceneViewerHandle>(null);
  const engagementObservationRef = useRef<EngagementObservation>({
    visible: false,
    centrality: 0,
    dwellSeconds: 0,
  });
  const [hotspots, setHotspots] = useState<HotspotConfiguration[]>(cloneHotspots);
  const [activeHotspotId, setActiveHotspotId] = useState<HotspotId | null>('temperature');
  const [selectedHotspotId, setSelectedHotspotId] = useState<HotspotId>('temperature');
  const [cameraSnapshot, setCameraSnapshot] = useState<CameraSnapshot>(initialCameraSnapshot);
  const [labelsVisible, setLabelsVisible] = useState(true);
  const [presentationMode, setPresentationMode] = useState(INITIAL_PRESENTATION_MODE);
  const [calibrationEnabled, setCalibrationEnabled] = useState(INITIAL_CALIBRATION_MODE);
  const [calibrationStatus, setCalibrationStatus] = useState(
    'Choose a hotspot, then arm placement or edit its coordinates.',
  );
  const simulation = useLiveSimulation(engagementObservationRef);
  const decisionSupport = useDecisionSupport(simulation.snapshot);

  const highlightedSignalIds = useMemo<SignalId[]>(
    () => [
      ...new Set(
        decisionSupport.snapshot.recommendations
          .filter(({ active }) => active)
          .flatMap(({ involvedSignalIds }) => involvedSignalIds),
      ),
    ],
    [decisionSupport.snapshot.recommendations],
  );

  const resetCamera = () => viewerRef.current?.resetCamera();

  const applyCameraPreset = (presetId: CameraPresetId) => {
    viewerRef.current?.applyCameraPreset(presetId);
  };

  const viewSpatialZone = (hotspotId: HotspotId) => {
    setActiveHotspotId(hotspotId);
    applyCameraPreset(HOTSPOT_CAMERA_PRESET[hotspotId]);
  };

  const togglePresentationMode = () => {
    const nextMode = !presentationMode;
    const url = new URL(window.location.href);
    if (nextMode) {
      url.searchParams.set('present', '1');
      url.searchParams.delete('calibrate');
      setCalibrationEnabled(false);
    } else {
      url.searchParams.delete('present');
    }
    window.history.replaceState(null, '', url);
    setPresentationMode(nextMode);
  };

  const updateHotspot = useCallback(
    (id: HotspotId, transform: (hotspot: HotspotConfiguration) => HotspotConfiguration) => {
      setHotspots((current) =>
        current.map((hotspot) => (hotspot.id === id ? transform(hotspot) : hotspot)),
      );
    },
    [],
  );

  const updateCoordinate = (id: HotspotId, axis: 0 | 1 | 2, value: number) => {
    updateHotspot(id, (hotspot) => {
      const position: [number, number, number] = [...hotspot.position];
      position[axis] = value;
      return { ...hotspot, position };
    });
    setCalibrationStatus('Coordinate updated in this browser session.');
  };

  const nudgeCoordinate = (id: HotspotId, axis: 0 | 1 | 2, amount: number) => {
    updateHotspot(id, (hotspot) => {
      const position: [number, number, number] = [...hotspot.position];
      position[axis] = Number((position[axis] + amount).toFixed(8));
      return { ...hotspot, position };
    });
    setCalibrationStatus(`Nudged ${['X', 'Y', 'Z'][axis]} by ${amount}.`);
  };

  const resetSelectedHotspot = () => {
    const original = HOTSPOTS.find(({ id }) => id === selectedHotspotId);
    if (original) updateHotspot(selectedHotspotId, () => ({ ...original, position: [...original.position] }));
    setCalibrationStatus('Selected hotspot reset to its source configuration.');
  };

  const resetAllHotspots = () => {
    setHotspots(cloneHotspots());
    setCalibrationStatus('All hotspot coordinates and verification states reset.');
  };

  const markSelectedVerified = () => {
    updateHotspot(selectedHotspotId, (hotspot) => ({
      ...hotspot,
      verificationStatus: 'verified',
      calibrationNote: 'Verified during browser calibration; pending deliberate source approval.',
    }));
    setCalibrationStatus('Selected hotspot marked verified for this session. Export to preserve it.');
  };

  const handlePickedPoint = (id: HotspotId, position: Vector3Tuple) => {
    updateHotspot(id, (hotspot) => ({
      ...hotspot,
      position: [...position],
      verificationStatus: 'provisional',
      calibrationNote: 'Session coordinate requires visual review before source approval.',
    }));
    setCalibrationStatus(
      `${id} placed at [${position.map((value) => value.toFixed(5)).join(', ')}]. Review before marking verified.`,
    );
  };

  const armPlacement = () => {
    const armed = viewerRef.current?.armPlacement(selectedHotspotId) ?? false;
    if (!armed) setCalibrationStatus('Placement is unavailable until the hosted scene is ready.');
  };

  const selectedHotspot =
    hotspots.find(({ id }) => id === selectedHotspotId) ?? hotspots[0];

  const copySelectedCoordinate = async () => {
    try {
      await copyText(JSON.stringify(selectedHotspot.position));
      setCalibrationStatus('Selected coordinate copied to the clipboard.');
    } catch (error) {
      setCalibrationStatus(`Could not copy the coordinate: ${String(error)}`);
    }
  };

  const copyAllCalibration = async () => {
    try {
      await copyText(serializeCalibrationExport(createCalibrationExport(hotspots)));
      setCalibrationStatus('All calibration results copied as JSON.');
    } catch (error) {
      setCalibrationStatus(`Could not copy calibration JSON: ${String(error)}`);
    }
  };

  const downloadCalibration = () => {
    try {
      const json = serializeCalibrationExport(createCalibrationExport(hotspots));
      const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `communal-room-hotspot-calibration-${new Date().toISOString().slice(0, 10)}.json`;
      anchor.style.display = 'none';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 0);
      setCalibrationStatus('Calibration JSON download prepared.');
    } catch (error) {
      setCalibrationStatus(`Could not export calibration JSON: ${String(error)}`);
    }
  };

  const handleEngagementObservation = useCallback((observation: EngagementObservation) => {
    engagementObservationRef.current = observation;
  }, []);

  const selectScenario = (scenarioId: ScenarioId) => {
    const isSameScenario =
      simulation.snapshot.mode.kind === 'scenario' &&
      simulation.snapshot.mode.scenarioId === scenarioId;
    const scenario = getScenario(scenarioId);
    const next = simulation.selectScenario(scenarioId);
    if (next && !isSameScenario) decisionSupport.recordScenarioChange(scenario, next);
  };

  const returnToLiveBaseline = () => {
    if (simulation.snapshot.mode.kind === 'live') return;
    const next = simulation.returnToLiveBaseline();
    if (next) decisionSupport.recordReturnToLiveBaseline(next);
  };

  const resetSimulation = () => {
    const wasNormal =
      simulation.snapshot.mode.kind === 'scenario' &&
      simulation.snapshot.mode.scenarioId === 'normal';
    const next = simulation.reset();
    if (next && !wasNormal) {
      decisionSupport.recordScenarioChange(getScenario('normal'), next);
    }
  };

  return (
    <div
      className="app-shell"
      data-presentation-mode={String(presentationMode)}
      data-testid="app-shell"
    >
      <header className="app-header">
        <div>
          <p className="eyebrow">Rental viewing · Property service</p>
          <h1>Smart Communal Room Digital Twin</h1>
          <p className="subtitle">Hosted Gaussian Splat with five live spatial signals</p>
        </div>
        <div className="header-actions">
          <span className="proof-badge">Decision-support prototype</span>
          {calibrationEnabled && <span className="calibration-badge">Calibration mode</span>}
          <button
            aria-pressed={presentationMode}
            className="button-secondary presentation-toggle"
            data-testid="presentation-mode-toggle"
            onClick={togglePresentationMode}
            type="button"
          >
            {presentationMode ? 'Exit presentation mode' : 'Enter presentation mode'}
          </button>
          <a
            className="fallback-link"
            data-testid="fallback-link"
            href={HOSTED_SCENE.scenePageUrl}
            rel="noreferrer"
            target="_blank"
          >
            Open hosted scene
          </a>
        </div>
      </header>

      <main className="workspace">
        <section aria-labelledby="viewer-heading" className="viewer-card">
          <div className="viewer-toolbar">
            <div>
              <p className="eyebrow">Interactive room</p>
              <h2 id="viewer-heading">Communal-room reconstruction</h2>
            </div>
            <div className="viewer-toolbar__actions">
              <button
                aria-pressed={labelsVisible}
                className="button-secondary"
                data-testid="toggle-spatial-labels"
                onClick={() => setLabelsVisible((visible) => !visible)}
                type="button"
              >
                Spatial labels: {labelsVisible ? 'Hide' : 'Show'}
              </button>
              <button data-testid="reset-camera" onClick={resetCamera} type="button">
                Reset camera
              </button>
            </div>
          </div>

          <nav aria-label="Camera presets" className="camera-presets">
            <span>Guided views</span>
            {CAMERA_PRESETS.map((preset) => (
              <button
                aria-pressed={cameraSnapshot.presetId === preset.id}
                className="camera-preset"
                data-testid={`camera-preset-${preset.id}`}
                key={preset.id}
                onClick={() => applyCameraPreset(preset.id)}
                title={preset.purpose}
                type="button"
              >
                {preset.label}
              </button>
            ))}
          </nav>

          <Suspense
            fallback={
              <div className="scene-stage scene-stage--suspense" role="status">
                Preparing the interactive room viewer…
              </div>
            }
          >
            <SceneViewer
              calibrationEnabled={calibrationEnabled}
              highlightedSignalIds={highlightedSignalIds}
              hotspots={hotspots}
              labelsVisible={labelsVisible}
              onCalibrationStatus={setCalibrationStatus}
              onCameraChange={setCameraSnapshot}
              onEngagementObservation={handleEngagementObservation}
              onHotspotActivate={setActiveHotspotId}
              onHotspotPicked={handlePickedPoint}
              ref={viewerRef}
              signalSnapshot={simulation.snapshot}
            />
          </Suspense>

          <div className="navigation-help" id="navigation-help">
            <strong>Navigate:</strong>
            <span>Drag to orbit</span>
            <span>Right-drag or Shift-drag to pan</span>
            <span>Scroll or pinch to zoom</span>
            <span>Keyboard: arrows, Shift + arrows, +/−, R</span>
          </div>
        </section>

        <aside aria-label="Environment signals and tools" className="side-column">
          <LiveSignalsPanel
            activeHotspotId={activeHotspotId}
            highlightedSignalIds={highlightedSignalIds}
            hotspots={hotspots}
            onActiveHotspotChange={setActiveHotspotId}
            onViewSpatialZone={viewSpatialZone}
            paused={simulation.paused}
            snapshot={simulation.snapshot}
          />

          {calibrationEnabled && (
            <Suspense fallback={null}>
              <CalibrationPanel
                camera={cameraSnapshot}
                hotspots={hotspots}
                onArmPlacement={armPlacement}
                onCoordinateChange={updateCoordinate}
                onCopyAll={() => void copyAllCalibration()}
                onCopySelected={() => void copySelectedCoordinate()}
                onDownload={downloadCalibration}
                onMarkVerified={markSelectedVerified}
                onNudge={nudgeCoordinate}
                onResetAll={resetAllHotspots}
                onResetCamera={resetCamera}
                onResetSelected={resetSelectedHotspot}
                onSelectedHotspotChange={setSelectedHotspotId}
                placementStatus={calibrationStatus}
                selectedHotspotId={selectedHotspotId}
              />
            </Suspense>
          )}
        </aside>
      </main>

      <div className="support-workspace">
        <DemonstrationScenariosPanel
          mode={simulation.snapshot.mode}
          onPause={simulation.pause}
          onReset={resetSimulation}
          onResume={simulation.resume}
          onReturnToLiveBaseline={returnToLiveBaseline}
          onSelectScenario={selectScenario}
          paused={simulation.paused}
        />
        <DecisionSupportPanel recommendations={decisionSupport.snapshot.recommendations} />
      </div>

      <div className="events-workspace">
        <Suspense fallback={null}>
          <DecisionEventLog
            defaultExpanded={!presentationMode}
            events={decisionSupport.snapshot.events}
            onClear={decisionSupport.clearEvents}
          />
        </Suspense>
      </div>

      <footer className="app-footer">
        <span>Academic prototype · Hosted scene is unlisted</span>
        <span>Simulated environment data · No biometric or emotion-recognition processing</span>
        <span>Transparent rules · Human property-management review required</span>
      </footer>
    </div>
  );
}
