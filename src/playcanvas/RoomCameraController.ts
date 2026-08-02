import { Quat, Vec3 } from 'playcanvas';
import type { Entity } from 'playcanvas';

import {
  DEFAULT_CAMERA_PRESET_ID,
  getCameraPreset,
  type CameraPreset,
  type CameraPresetId,
} from '../config/cameraPresets';
import type { CameraConfiguration, Vector3Tuple } from '../config/scene';

export interface CameraSnapshot {
  readonly position: Vector3Tuple;
  readonly target: Vector3Tuple;
  readonly fieldOfView: number;
  readonly presetId: CameraPresetId | null;
}

type PointerGesture = 'orbit' | 'pan';

interface ActivePointer {
  x: number;
  y: number;
  gesture: PointerGesture;
}

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

const toTuple = (vector: Vec3): Vector3Tuple => [vector.x, vector.y, vector.z];

export class RoomCameraController {
  private readonly target = new Vec3();
  private readonly upAxis = new Vec3(0, 1, 0);
  private readonly offset = new Vec3();
  private readonly forward = new Vec3();
  private readonly right = new Vec3();
  private readonly orbitRotation = new Quat();
  private readonly activePointers = new Map<number, ActivePointer>();
  private readonly minPitch: number;
  private readonly maxPitch: number;

  private distance = 1;
  private activePresetId: CameraPresetId | null = DEFAULT_CAMERA_PRESET_ID;

  public constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly cameraEntity: Entity,
    private readonly configuration: CameraConfiguration,
    private readonly onChange: (snapshot: CameraSnapshot) => void,
  ) {
    this.minPitch = configuration.minPitchDegrees * DEG_TO_RAD;
    this.maxPitch = configuration.maxPitchDegrees * DEG_TO_RAD;

    this.canvas.addEventListener('pointerdown', this.handlePointerDown);
    this.canvas.addEventListener('pointermove', this.handlePointerMove);
    this.canvas.addEventListener('pointerup', this.handlePointerEnd);
    this.canvas.addEventListener('pointercancel', this.handlePointerEnd);
    this.canvas.addEventListener('wheel', this.handleWheel, { passive: false });
    this.canvas.addEventListener('keydown', this.handleKeyDown);
    this.canvas.addEventListener('contextmenu', this.preventContextMenu);

    this.reset();
  }

  public reset = () => {
    this.applyPreset(getCameraPreset(DEFAULT_CAMERA_PRESET_ID));
  };

  public applyPreset = (preset: CameraPreset) => {
    const [targetX, targetY, targetZ] = preset.target;
    const [positionX, positionY, positionZ] = preset.position;
    const [upX, upY, upZ] = preset.up;
    this.target.set(targetX, targetY, targetZ);
    this.upAxis.set(upX, upY, upZ).normalize();
    this.offset.set(
      positionX - targetX,
      positionY - targetY,
      positionZ - targetZ,
    );
    this.distance = clamp(
      this.offset.length(),
      this.configuration.minDistance,
      this.configuration.maxDistance,
    );
    this.offset.normalize().mulScalar(this.distance);
    if (this.cameraEntity.camera) this.cameraEntity.camera.fov = preset.fieldOfView;
    this.activePresetId = preset.id;
    this.applyCamera();
  };

  public copyPosition(output: Vec3): Vec3 {
    return output.copy(this.cameraEntity.getPosition());
  }

  public copyTarget(output: Vec3): Vec3 {
    return output.copy(this.target);
  }

  public destroy(): void {
    this.canvas.removeEventListener('pointerdown', this.handlePointerDown);
    this.canvas.removeEventListener('pointermove', this.handlePointerMove);
    this.canvas.removeEventListener('pointerup', this.handlePointerEnd);
    this.canvas.removeEventListener('pointercancel', this.handlePointerEnd);
    this.canvas.removeEventListener('wheel', this.handleWheel);
    this.canvas.removeEventListener('keydown', this.handleKeyDown);
    this.canvas.removeEventListener('contextmenu', this.preventContextMenu);
    this.activePointers.clear();
  }

  private readonly handlePointerDown = (event: PointerEvent) => {
    const gesture: PointerGesture =
      event.button === 2 || event.shiftKey ? 'pan' : 'orbit';
    this.activePointers.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
      gesture,
    });
    this.canvas.setPointerCapture(event.pointerId);
    this.canvas.focus({ preventScroll: true });
    event.preventDefault();
  };

  private readonly handlePointerMove = (event: PointerEvent) => {
    const current = this.activePointers.get(event.pointerId);
    if (!current) {
      return;
    }

    const previousPointers = [...this.activePointers.values()].map((pointer) => ({
      ...pointer,
    }));
    const deltaX = event.clientX - current.x;
    const deltaY = event.clientY - current.y;
    current.x = event.clientX;
    current.y = event.clientY;

    if (event.pointerType === 'touch' && this.activePointers.size >= 2) {
      const nextPointers = [...this.activePointers.values()];
      const [previousA, previousB] = previousPointers;
      const [nextA, nextB] = nextPointers;
      if (previousA && previousB && nextA && nextB) {
        const previousCenterX = (previousA.x + previousB.x) / 2;
        const previousCenterY = (previousA.y + previousB.y) / 2;
        const nextCenterX = (nextA.x + nextB.x) / 2;
        const nextCenterY = (nextA.y + nextB.y) / 2;
        this.pan(nextCenterX - previousCenterX, nextCenterY - previousCenterY);

        const previousDistance = Math.hypot(
          previousA.x - previousB.x,
          previousA.y - previousB.y,
        );
        const nextDistance = Math.hypot(nextA.x - nextB.x, nextA.y - nextB.y);
        if (previousDistance > 0 && nextDistance > 0) {
          this.zoom(previousDistance / nextDistance);
        }
      }
    } else if (current.gesture === 'pan') {
      this.pan(deltaX, deltaY);
    } else {
      this.orbit(deltaX, deltaY);
    }

    event.preventDefault();
  };

  private readonly handlePointerEnd = (event: PointerEvent) => {
    this.activePointers.delete(event.pointerId);
    if (this.canvas.hasPointerCapture(event.pointerId)) {
      this.canvas.releasePointerCapture(event.pointerId);
    }
  };

  private readonly handleWheel = (event: WheelEvent) => {
    this.zoom(Math.exp(event.deltaY * 0.0012));
    event.preventDefault();
  };

  private readonly handleKeyDown = (event: KeyboardEvent) => {
    const orbitStep = 16;
    const panStep = 22;
    let handled = true;

    switch (event.key) {
      case 'ArrowLeft':
        if (event.shiftKey) {
          this.pan(panStep, 0);
        } else {
          this.orbit(orbitStep, 0);
        }
        break;
      case 'ArrowRight':
        if (event.shiftKey) {
          this.pan(-panStep, 0);
        } else {
          this.orbit(-orbitStep, 0);
        }
        break;
      case 'ArrowUp':
        if (event.shiftKey) {
          this.pan(0, panStep);
        } else {
          this.orbit(0, orbitStep);
        }
        break;
      case 'ArrowDown':
        if (event.shiftKey) {
          this.pan(0, -panStep);
        } else {
          this.orbit(0, -orbitStep);
        }
        break;
      case '+':
      case '=':
        this.zoom(0.9);
        break;
      case '-':
      case '_':
        this.zoom(1.1);
        break;
      case 'r':
      case 'R':
        this.reset();
        break;
      default:
        handled = false;
    }

    if (handled) {
      event.preventDefault();
    }
  };

  private readonly preventContextMenu = (event: MouseEvent) => {
    event.preventDefault();
  };

  private orbit(deltaX: number, deltaY: number): void {
    this.activePresetId = null;
    this.orbitRotation.setFromAxisAngle(
      this.upAxis,
      -deltaX * 0.005 * RAD_TO_DEG,
    );
    this.orbitRotation.transformVector(this.offset, this.offset);

    this.forward.copy(this.offset).mulScalar(-1).normalize();
    this.right.cross(this.forward, this.upAxis).normalize();
    const currentPitch = Math.asin(
      clamp(this.offset.clone().normalize().dot(this.upAxis), -1, 1),
    );
    const nextPitch = clamp(
      currentPitch + deltaY * 0.005,
      this.minPitch,
      this.maxPitch,
    );
    this.orbitRotation.setFromAxisAngle(
      this.right,
      -(nextPitch - currentPitch) * RAD_TO_DEG,
    );
    this.orbitRotation.transformVector(this.offset, this.offset);
    this.applyCamera();
  }

  private pan(deltaX: number, deltaY: number): void {
    this.activePresetId = null;
    const position = this.cameraEntity.getPosition();
    this.forward.sub2(this.target, position).normalize();
    this.right.cross(this.forward, this.upAxis).normalize();
    const up = new Vec3().cross(this.right, this.forward).normalize();
    const scale = this.distance * 0.0015;

    this.target.add(this.right.mulScalar(-deltaX * scale));
    this.target.add(up.mulScalar(deltaY * scale));
    this.target.set(
      clamp(this.target.x, -this.configuration.targetLimit, this.configuration.targetLimit),
      clamp(this.target.y, -this.configuration.targetLimit, this.configuration.targetLimit),
      clamp(this.target.z, -this.configuration.targetLimit, this.configuration.targetLimit),
    );
    this.applyCamera();
  }

  private zoom(multiplier: number): void {
    this.activePresetId = null;
    this.distance = clamp(
      this.distance * multiplier,
      this.configuration.minDistance,
      this.configuration.maxDistance,
    );
    this.offset.normalize().mulScalar(this.distance);
    this.applyCamera();
  }

  private applyCamera(): void {
    const position = new Vec3().add2(this.target, this.offset);

    this.cameraEntity.setPosition(position);
    this.cameraEntity.lookAt(this.target, this.upAxis);
    this.onChange({
      position: toTuple(position),
      target: toTuple(this.target),
      fieldOfView: this.cameraEntity.camera?.fov ?? this.configuration.fieldOfView,
      presetId: this.activePresetId,
    });
  }
}
