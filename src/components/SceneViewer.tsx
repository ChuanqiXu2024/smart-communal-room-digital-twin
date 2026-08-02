import {
  Application,
  Asset,
  Color,
  DEVICETYPE_WEBGL2,
  DEVICETYPE_WEBGPU,
  Entity,
  FILLMODE_NONE,
  Picker,
  RESOLUTION_AUTO,
  TONEMAP_NEUTRAL,
  Vec3,
  createGraphicsDevice,
} from 'playcanvas';
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import type { MutableRefObject } from 'react';

import type {
  HotspotConfiguration,
  HotspotId,
  SignalId,
} from '../config/hotspots';
import { getCameraPreset, type CameraPresetId } from '../config/cameraPresets';
import { HOSTED_SCENE } from '../config/scene';
import type { Vector3Tuple } from '../config/scene';
import {
  RoomCameraController,
  type CameraSnapshot,
} from '../playcanvas/RoomCameraController';
import {
  formatSignal,
  type EngagementObservation,
  type SignalSnapshot,
} from '../simulation/signalSimulation';

export interface SceneViewerHandle {
  resetCamera: () => void;
  applyCameraPreset: (presetId: CameraPresetId) => boolean;
  armPlacement: (hotspotId: HotspotId) => boolean;
}

interface SceneViewerProps {
  readonly hotspots: readonly HotspotConfiguration[];
  readonly signalSnapshot: SignalSnapshot;
  readonly highlightedSignalIds: readonly SignalId[];
  readonly calibrationEnabled: boolean;
  readonly labelsVisible: boolean;
  readonly onCameraChange: (snapshot: CameraSnapshot) => void;
  readonly onEngagementObservation: (observation: EngagementObservation) => void;
  readonly onHotspotActivate: (id: HotspotId) => void;
  readonly onHotspotPicked: (id: HotspotId, position: Vector3Tuple) => void;
  readonly onCalibrationStatus: (message: string) => void;
}

interface HostedSogMetadata {
  version: number;
  count: number;
  means: object;
}

export type SceneFailureKind =
  | 'graphics-support'
  | 'metadata-fetch'
  | 'dependent-payload'
  | 'scene-parse';

type ViewerState =
  | { phase: 'loading'; progress: number | null; message: string }
  | { phase: 'ready'; progress: 1; message: string }
  | {
      phase: 'error';
      progress: null;
      kind: SceneFailureKind;
      title: string;
      message: string;
    };

interface ProjectedHotspot {
  readonly hotspot: HotspotConfiguration;
  readonly anchorX: number;
  readonly anchorY: number;
  readonly labelX: number;
  readonly labelY: number;
}

type ElementRegistry<ElementType extends HTMLElement> = Partial<
  Record<HotspotId, ElementType | null>
>;

const isHostedSogMetadata = (value: unknown): value is HostedSogMetadata => {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.version === 'number' &&
    typeof candidate.count === 'number' &&
    typeof candidate.means === 'object' &&
    candidate.means !== null
  );
};

class SceneLoadError extends Error {
  public constructor(
    public readonly kind: SceneFailureKind,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'SceneLoadError';
  }
}

const describeError = (
  error: unknown,
): Extract<ViewerState, { phase: 'error' }> => {
  const detail = error instanceof Error ? error.message : String(error);
  const kind =
    error instanceof SceneLoadError
      ? error.kind
      : /webgpu|webgl|graphics|adapter|context/i.test(detail)
        ? 'graphics-support'
        : /metadata|fetch|network|cors/i.test(detail)
          ? 'metadata-fetch'
          : /asset|payload/i.test(detail)
            ? 'dependent-payload'
            : 'scene-parse';
  const messages: Record<SceneFailureKind, { title: string; message: string }> = {
    'graphics-support': {
      title: 'Browser graphics support unavailable',
      message:
        'A WebGPU or WebGL 2 graphics context could not be created. Try an up-to-date browser with hardware acceleration enabled.',
    },
    'metadata-fetch': {
      title: 'Hosted scene metadata unavailable',
      message:
        'The scene description could not be fetched. Check the network connection and hosted-scene CORS policy, then retry.',
    },
    'dependent-payload': {
      title: 'Hosted scene payload unavailable',
      message:
        'Metadata loaded, but one or more dependent scene files could not be downloaded. Retry or open the official hosted scene.',
    },
    'scene-parse': {
      title: 'Hosted scene could not be parsed',
      message:
        'The downloaded scene did not match the expected SOG format. The accessible signal and decision panels remain available.',
    },
  };
  const description = messages[kind];
  return {
    phase: 'error',
    progress: null,
    kind,
    title: description.title,
    message: `${description.message} Technical detail: ${detail}`,
  };
};

const metadataError = (message: string, cause?: unknown): SceneLoadError =>
  new SceneLoadError(
    'metadata-fetch',
    message,
    cause === undefined ? undefined : { cause },
  );

const parseError = (message: string, cause?: unknown): SceneLoadError =>
  new SceneLoadError(
    'scene-parse',
    message,
    cause === undefined ? undefined : { cause },
  );

const payloadError = (message: string, cause?: unknown): SceneLoadError =>
  new SceneLoadError(
    'dependent-payload',
    message,
    cause === undefined ? undefined : { cause },
  );

const graphicsError = (message: string, cause?: unknown): SceneLoadError =>
  new SceneLoadError(
    'graphics-support',
    message,
    cause === undefined ? undefined : { cause },
  );

const clamp = (value: number, minimum: number, maximum: number): number =>
  Math.min(maximum, Math.max(minimum, value));

const setElementVisibility = (
  element: HTMLElement | null | undefined,
  visible: boolean,
  reason: string,
) => {
  if (!element) return;
  element.dataset.visible = String(visible);
  element.dataset.visibilityReason = reason;
  if (element instanceof HTMLButtonElement) {
    element.tabIndex = visible ? 0 : -1;
    element.setAttribute('aria-hidden', String(!visible));
    if (!visible && document.activeElement === element) element.blur();
  }
};

const loadHostedSplat = async (
  app: Application,
  setProgress: (progress: number | null, message: string) => void,
): Promise<Asset> => {
  setProgress(0.02, 'Fetching hosted scene metadata…');
  let response: Response;
  try {
    response = await fetch(HOSTED_SCENE.metadataUrl, { mode: 'cors', credentials: 'omit' });
  } catch (error) {
    throw metadataError(`Metadata fetch failed: ${String(error)}`, error);
  }
  if (!response.ok) {
    throw metadataError(`Metadata request returned HTTP ${response.status}.`);
  }

  let metadata: unknown;
  try {
    metadata = await response.json();
  } catch (error) {
    throw parseError(`Metadata JSON parsing failed: ${String(error)}`, error);
  }
  if (!isHostedSogMetadata(metadata)) {
    throw parseError('Metadata does not match the expected SOG structure.');
  }
  if (metadata.version !== HOSTED_SCENE.expectedFormatVersion) {
    throw parseError(
      `Expected SOG v${HOSTED_SCENE.expectedFormatVersion}, received v${metadata.version}.`,
    );
  }
  if (metadata.count !== HOSTED_SCENE.expectedGaussianCount) {
    console.warn(
      `Hosted scene Gaussian count changed from ${HOSTED_SCENE.expectedGaussianCount.toLocaleString()} to ${metadata.count.toLocaleString()}.`,
    );
  }

  setProgress(0.08, 'Loading hosted scene payloads…');
  const asset = new Asset(
    'communal-room-sog',
    'gsplat',
    { url: HOSTED_SCENE.metadataUrl, filename: 'meta.json' },
    metadata,
  );
  const loadedAsset = new Promise<Asset>((resolve, reject) => {
    asset.on(Asset.EVENT_PROGRESS, (receivedBytes: number, totalBytes: number) => {
      const ratio = totalBytes > 0 ? receivedBytes / totalBytes : 0;
      setProgress(
        Math.min(0.98, 0.08 + ratio * 0.9),
        totalBytes > 0
          ? `Loading hosted scene payloads… ${Math.round(ratio * 100)}%`
          : 'Loading hosted scene payloads…',
      );
    });
    asset.once(Asset.EVENT_LOAD, () => resolve(asset));
    asset.once(Asset.EVENT_ERROR, (error: unknown) => {
      reject(payloadError(`PlayCanvas asset loading failed: ${String(error)}`, error));
    });
  });
  app.assets.add(asset);
  app.assets.load(asset);
  return loadedAsset;
};

const useLatest = <Value,>(value: Value): MutableRefObject<Value> => {
  const reference = useRef(value);
  useEffect(() => {
    reference.current = value;
  }, [value]);
  return reference;
};

export const SceneViewer = forwardRef<SceneViewerHandle, SceneViewerProps>(
  function SceneViewer(
    {
      hotspots,
      signalSnapshot,
      highlightedSignalIds,
      calibrationEnabled,
      labelsVisible,
      onCameraChange,
      onEngagementObservation,
      onHotspotActivate,
      onHotspotPicked,
      onCalibrationStatus,
    },
    forwardedRef,
  ) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const stageRef = useRef<HTMLDivElement>(null);
    const markerRefs = useRef<ElementRegistry<HTMLSpanElement>>({});
    const connectorRefs = useRef<ElementRegistry<HTMLSpanElement>>({});
    const labelRefs = useRef<ElementRegistry<HTMLButtonElement>>({});
    const resetCameraRef = useRef<() => void>(() => undefined);
    const applyPresetRef = useRef<(id: CameraPresetId) => boolean>(() => false);
    const armPlacementRef = useRef<(id: HotspotId) => boolean>(() => false);
    const hotspotsRef = useLatest(hotspots);
    const labelsVisibleRef = useLatest(labelsVisible);
    const cameraChangeRef = useLatest(onCameraChange);
    const engagementRef = useLatest(onEngagementObservation);
    const pickedRef = useLatest(onHotspotPicked);
    const calibrationStatusRef = useLatest(onCalibrationStatus);
    const [viewerState, setViewerState] = useState<ViewerState>({
      phase: 'loading',
      progress: 0,
      message: 'Preparing the 3D viewer…',
    });
    const [loadAttempt, setLoadAttempt] = useState(0);

    useImperativeHandle(
      forwardedRef,
      () => ({
        resetCamera: () => resetCameraRef.current(),
        applyCameraPreset: (id) => applyPresetRef.current(id),
        armPlacement: (id) => armPlacementRef.current(id),
      }),
      [],
    );

    useEffect(() => {
      const canvas = canvasRef.current;
      const stage = stageRef.current;
      if (!canvas || !stage) return undefined;

      let disposed = false;
      let app: Application | null = null;
      let cameraEntity: Entity | null = null;
      let cameraController: RoomCameraController | null = null;
      let picker: Picker | null = null;
      let resizeObserver: ResizeObserver | null = null;
      let ready = false;
      let lastCameraReport = 0;
      let engagementDwellSeconds = 0;
      let armedHotspotId: HotspotId | null = null;
      let placementPointerId: number | null = null;

      const worldPoint = new Vec3();
      const screenPoint = new Vec3();
      const cameraPosition = new Vec3();
      const cameraTarget = new Vec3();
      const forward = new Vec3();
      const toHotspot = new Vec3();

      const hideAllHotspots = (reason = 'scene-not-ready') => {
        hotspotsRef.current.forEach(({ id }) => {
          setElementVisibility(markerRefs.current[id], false, reason);
          setElementVisibility(connectorRefs.current[id], false, reason);
          setElementVisibility(labelRefs.current[id], false, reason);
        });
      };

      const setProgress = (progress: number | null, message: string) => {
        if (!disposed) setViewerState({ phase: 'loading', progress, message });
      };

      const placeHotspot = async (event: PointerEvent) => {
        const selectedId = armedHotspotId;
        const currentApp = app;
        const cameraComponent = cameraEntity?.camera;
        if (!selectedId || !picker || !currentApp || !cameraComponent || !ready) return;

        armedHotspotId = null;
        canvas.dataset.calibrationArmed = 'false';
        calibrationStatusRef.current('Reading splat depth at the selected point…');
        const bounds = canvas.getBoundingClientRect();
        const x = ((event.clientX - bounds.left) / bounds.width) * picker.width;
        const y = ((event.clientY - bounds.top) / bounds.height) * picker.height;

        try {
          picker.prepare(cameraComponent, currentApp.scene);
          const point = await picker.getWorldPointAsync(x, y);
          if (!point) {
            calibrationStatusRef.current(
              'No splat depth was found at that point. The previous coordinate was preserved.',
            );
            return;
          }
          pickedRef.current(selectedId, [point.x, point.y, point.z]);
        } catch (error) {
          calibrationStatusRef.current(
            `Depth picking failed; the previous coordinate was preserved. ${String(error)}`,
          );
        }
      };

      const handlePlacementPointerDown = (event: PointerEvent) => {
        if (!armedHotspotId) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        placementPointerId = event.pointerId;
        canvas.setPointerCapture(event.pointerId);
      };

      const handlePlacementPointerUp = (event: PointerEvent) => {
        if (!armedHotspotId || placementPointerId !== event.pointerId) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        placementPointerId = null;
        if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
        void placeHotspot(event);
      };

      canvas.addEventListener('pointerdown', handlePlacementPointerDown, true);
      canvas.addEventListener('pointerup', handlePlacementPointerUp, true);

      const updateProjection = (deltaSeconds = 0) => {
        const currentApp = app;
        const controller = cameraController;
        const cameraComponent = cameraEntity?.camera;
        if (!ready || !currentApp || !controller || !cameraComponent) {
          hideAllHotspots();
          engagementRef.current({ visible: false, centrality: 0, dwellSeconds: engagementDwellSeconds });
          return;
        }

        controller.copyPosition(cameraPosition);
        controller.copyTarget(cameraTarget);
        forward.sub2(cameraTarget, cameraPosition).normalize();
        const { width, height } = currentApp.graphicsDevice.clientRect;
        const viewportMargin = 48;
        const projected: ProjectedHotspot[] = [];
        let engagementVisible = false;
        let engagementCentrality = 0;

        hotspotsRef.current.forEach((hotspot) => {
          worldPoint.set(...hotspot.position);
          toHotspot.sub2(worldPoint, cameraPosition);
          const isInFront = forward.dot(toHotspot) > 0.01;
          cameraComponent.worldToScreen(worldPoint, screenPoint);
          const isNearViewport =
            screenPoint.x >= -viewportMargin &&
            screenPoint.x <= width + viewportMargin &&
            screenPoint.y >= -viewportMargin &&
            screenPoint.y <= height + viewportMargin;
          const visible = isInFront && isNearViewport;
          const displayVisible = visible && labelsVisibleRef.current;
          const reason = !labelsVisibleRef.current
            ? 'labels-hidden'
            : !isInFront
            ? 'behind-camera'
            : isNearViewport
              ? 'visible'
              : 'outside-viewport';

          setElementVisibility(markerRefs.current[hotspot.id], displayVisible, reason);
          setElementVisibility(connectorRefs.current[hotspot.id], displayVisible, reason);
          setElementVisibility(labelRefs.current[hotspot.id], displayVisible, reason);

          if (displayVisible) {
            const compact = width < 560;
            const halfWidth = compact ? 76 : 112;
            const topBoundary = compact ? 62 : 92;
            projected.push({
              hotspot,
              anchorX: screenPoint.x,
              anchorY: screenPoint.y,
              labelX: clamp(
                screenPoint.x + hotspot.labelOffset[0],
                halfWidth,
                width - halfWidth,
              ),
              labelY: clamp(
                screenPoint.y + hotspot.labelOffset[1],
                topBoundary,
                height - 14,
              ),
            });
          }

          if (hotspot.id === 'engagement') {
            engagementVisible = visible;
            if (visible) {
              const normalizedX = Math.abs(screenPoint.x - width / 2) / Math.max(width / 2, 1);
              const normalizedY = Math.abs(screenPoint.y - height / 2) / Math.max(height / 2, 1);
              engagementCentrality = clamp(1 - Math.hypot(normalizedX, normalizedY) / Math.SQRT2, 0, 1);
            }
          }
        });

        const placed: Array<{ x: number; y: number }> = [];
        projected.forEach(({ hotspot, anchorX, anchorY, labelX, labelY }) => {
          const compact = width < 560;
          const halfWidth = compact ? 76 : 112;
          const topBoundary = compact ? 62 : 92;
          const horizontalStep = compact ? 82 : 126;
          const verticalStep = compact ? 58 : 76;
          const candidates = [
            [0, 0],
            [0, verticalStep],
            [0, -verticalStep],
            [horizontalStep, 0],
            [-horizontalStep, 0],
            [horizontalStep, verticalStep],
            [-horizontalStep, verticalStep],
            [0, verticalStep * 2],
            [0, -verticalStep * 2],
          ] as const;
          let resolvedX = labelX;
          let resolvedY = labelY;
          for (const [offsetX, offsetY] of candidates) {
            const candidateX = clamp(labelX + offsetX, halfWidth, width - halfWidth);
            const candidateY = clamp(labelY + offsetY, topBoundary, height - 14);
            const overlaps = placed.some(
              ({ x, y }) =>
                Math.abs(x - candidateX) < (compact ? 142 : 190) &&
                Math.abs(y - candidateY) < (compact ? 58 : 76),
            );
            if (!overlaps) {
              resolvedX = candidateX;
              resolvedY = candidateY;
              break;
            }
          }
          placed.push({ x: resolvedX, y: resolvedY });

          const marker = markerRefs.current[hotspot.id];
          const connector = connectorRefs.current[hotspot.id];
          const label = labelRefs.current[hotspot.id];
          for (const element of [marker, connector]) {
            element?.style.setProperty('--anchor-x', `${anchorX}px`);
            element?.style.setProperty('--anchor-y', `${anchorY}px`);
          }
          label?.style.setProperty('--label-x', `${resolvedX}px`);
          label?.style.setProperty('--label-y', `${resolvedY}px`);
          const connectorX = resolvedX - anchorX;
          const connectorY = resolvedY - anchorY;
          connector?.style.setProperty('--connector-length', `${Math.hypot(connectorX, connectorY)}px`);
          connector?.style.setProperty(
            '--connector-angle',
            `${Math.atan2(connectorY, connectorX) * (180 / Math.PI)}deg`,
          );
        });

        if (engagementVisible && engagementCentrality > 0.35) {
          engagementDwellSeconds += deltaSeconds;
        } else {
          engagementDwellSeconds = Math.max(0, engagementDwellSeconds - deltaSeconds * 0.25);
        }
        engagementRef.current({
          visible: engagementVisible,
          centrality: engagementCentrality,
          dwellSeconds: engagementDwellSeconds,
        });
      };

      const initialise = async () => {
        try {
          setProgress(0, 'Creating a WebGPU or WebGL 2 graphics context…');
          let graphicsDevice;
          try {
            graphicsDevice = await createGraphicsDevice(canvas, {
              deviceTypes: [DEVICETYPE_WEBGPU, DEVICETYPE_WEBGL2],
              antialias: false,
              powerPreference: 'high-performance',
            });
          } catch (error) {
            throw graphicsError(`Graphics-device creation failed: ${String(error)}`, error);
          }
          if (disposed) {
            graphicsDevice.destroy();
            return;
          }

          app = new Application(canvas, { graphicsDevice });
          app.setCanvasFillMode(FILLMODE_NONE);
          app.setCanvasResolution(RESOLUTION_AUTO);
          if (calibrationEnabled) app.scene.gsplat.enableIds = true;

          cameraEntity = new Entity('Room camera');
          cameraEntity.addComponent('camera', {
            clearColor: new Color(0.025, 0.035, 0.045),
            fov: HOSTED_SCENE.initialCamera.fieldOfView,
            nearClip: HOSTED_SCENE.initialCamera.nearClip,
            farClip: HOSTED_SCENE.initialCamera.farClip,
          });
          if (!cameraEntity.camera) throw new Error('PlayCanvas did not create the camera component.');
          cameraEntity.camera.toneMapping = TONEMAP_NEUTRAL;
          app.root.addChild(cameraEntity);

          cameraController = new RoomCameraController(
            canvas,
            cameraEntity,
            HOSTED_SCENE.initialCamera,
            (snapshot) => {
              const now = window.performance.now();
              if (snapshot.presetId !== null || now - lastCameraReport > 100) {
                lastCameraReport = now;
                cameraChangeRef.current(snapshot);
              }
            },
          );
          resetCameraRef.current = cameraController.reset;
          applyPresetRef.current = (presetId) => {
            if (!cameraController) return false;
            cameraController.applyPreset(getCameraPreset(presetId));
            return true;
          };

          if (calibrationEnabled) {
            picker = new Picker(app, Math.max(1, stage.clientWidth), Math.max(1, stage.clientHeight), true);
          }

          resizeObserver = new ResizeObserver(() => {
            if (!app || disposed) return;
            app.resizeCanvas(stage.clientWidth, stage.clientHeight);
            picker?.resize(Math.max(1, stage.clientWidth), Math.max(1, stage.clientHeight));
            updateProjection();
          });
          resizeObserver.observe(stage);

          app.on('update', updateProjection);
          app.start();
          app.resizeCanvas(stage.clientWidth, stage.clientHeight);

          const asset = await loadHostedSplat(app, setProgress);
          if (disposed) return;
          const sceneEntity = new Entity('Hosted communal room');
          sceneEntity.addComponent('gsplat', { asset });
          app.root.addChild(sceneEntity);
          ready = true;
          setViewerState({ phase: 'ready', progress: 1, message: 'Hosted room ready.' });
          updateProjection();

          armPlacementRef.current = (hotspotId) => {
            if (!ready || !picker) return false;
            armedHotspotId = hotspotId;
            canvas.dataset.calibrationArmed = 'true';
            calibrationStatusRef.current(
              `Placement armed for ${hotspotsRef.current.find(({ id }) => id === hotspotId)?.title ?? hotspotId}. Click a visible point on the splat.`,
            );
            canvas.focus({ preventScroll: true });
            return true;
          };
        } catch (error) {
          console.error('Scene viewer initialization failed.', error);
          hideAllHotspots();
          if (!disposed) {
            setViewerState(describeError(error));
          }
        }
      };

      void initialise();

      return () => {
        disposed = true;
        ready = false;
        resetCameraRef.current = () => undefined;
        applyPresetRef.current = () => false;
        armPlacementRef.current = () => false;
        hideAllHotspots();
        canvas.removeEventListener('pointerdown', handlePlacementPointerDown, true);
        canvas.removeEventListener('pointerup', handlePlacementPointerUp, true);
        resizeObserver?.disconnect();
        cameraController?.destroy();
        picker?.destroy();
        if (app) {
          app.off('update', updateProjection);
          app.destroy();
        }
      };
    }, [
      calibrationEnabled,
      calibrationStatusRef,
      cameraChangeRef,
      engagementRef,
      hotspotsRef,
      labelsVisibleRef,
      loadAttempt,
      pickedRef,
    ]);

    return (
      <div
        className="scene-stage"
        data-calibration-enabled={String(calibrationEnabled)}
        data-labels-visible={String(labelsVisible)}
        data-scene-state={viewerState.phase}
        data-testid="scene-stage"
        ref={stageRef}
      >
        {viewerState.phase !== 'ready' && (
          <img
            alt=""
            aria-hidden="true"
            className="scene-poster"
            data-testid="scene-poster"
            src={HOSTED_SCENE.posterUrl}
          />
        )}
        <canvas
          aria-describedby="navigation-help"
          aria-label="Interactive Gaussian Splat view of the communal room"
          data-calibration-armed="false"
          data-testid="scene-canvas"
          ref={canvasRef}
          tabIndex={0}
        >
          Interactive 3D communal-room view. The live environment signals are also listed beside
          the canvas.
        </canvas>

        <div className="hotspot-layer">
          {hotspots.map((hotspot) => {
            const signal = formatSignal(hotspot.signalId, signalSnapshot);
            const isRecommendationInvolved = highlightedSignalIds.includes(hotspot.signalId);
            return (
              <div
                className="hotspot-group"
                data-hotspot-id={hotspot.id}
                data-recommendation-involved={String(isRecommendationInvolved)}
                key={hotspot.id}
              >
                <span
                  aria-hidden="true"
                  className={`hotspot-marker hotspot-marker--${hotspot.id}`}
                  data-testid={`hotspot-marker-${hotspot.id}`}
                  data-visible="false"
                  data-visibility-reason="scene-not-ready"
                  ref={(element) => {
                    markerRefs.current[hotspot.id] = element;
                  }}
                />
                <span
                  aria-hidden="true"
                  className={`hotspot-connector hotspot-connector--${hotspot.id}`}
                  data-testid={`hotspot-connector-${hotspot.id}`}
                  data-visible="false"
                  data-visibility-reason="scene-not-ready"
                  ref={(element) => {
                    connectorRefs.current[hotspot.id] = element;
                  }}
                />
                <button
                  aria-hidden="true"
                  aria-label={`${hotspot.title}: ${signal.value} ${signal.unit}, ${signal.status}`}
                  className={`hotspot-label hotspot-label--${hotspot.id}`}
                  data-testid={`hotspot-label-${hotspot.id}`}
                  data-visible="false"
                  data-visibility-reason="scene-not-ready"
                  onClick={() => onHotspotActivate(hotspot.id)}
                  onFocus={() => onHotspotActivate(hotspot.id)}
                  ref={(element) => {
                    labelRefs.current[hotspot.id] = element;
                  }}
                  tabIndex={-1}
                  type="button"
                >
                  <span>{hotspot.title}</span>
                  <strong>
                    {signal.value} {signal.unit}
                  </strong>
                  <small>
                    {signal.status} · {signal.sourceBadge}
                  </small>
                </button>
              </div>
            );
          })}
        </div>

        {viewerState.phase === 'loading' && (
          <div className="scene-message" data-testid="scene-status" role="status">
            <span className="loading-spinner" aria-hidden="true" />
            <strong>Loading the communal room</strong>
            <span>{viewerState.message}</span>
            <progress
              aria-label="Hosted scene loading progress"
              max={1}
              value={viewerState.progress ?? undefined}
            />
          </div>
        )}

        {viewerState.phase === 'error' && (
          <div
            className="scene-message scene-message--error"
            data-error-kind={viewerState.kind}
            data-testid="scene-status"
            role="alert"
          >
            <strong>{viewerState.title}</strong>
            <span>{viewerState.message}</span>
            <div className="scene-message__actions">
              <button
                className="button-secondary"
                data-testid="retry-scene"
                onClick={() => setLoadAttempt((attempt) => attempt + 1)}
                type="button"
              >
                Retry hosted room
              </button>
              <a
                data-testid="scene-fallback-link"
                href={HOSTED_SCENE.scenePageUrl}
                rel="noreferrer"
                target="_blank"
              >
                Open the official SuperSplat scene
              </a>
            </div>
          </div>
        )}

        <p className="canvas-focus-hint">
          {calibrationEnabled
            ? 'Placement mode intercepts one click without moving the camera.'
            : 'Select the view, then use arrow keys to orbit.'}
        </p>
      </div>
    );
  },
);
