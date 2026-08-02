import { getCameraPreset } from './cameraPresets';

export type Vector3Tuple = readonly [x: number, y: number, z: number];

export interface CameraConfiguration {
  readonly position: Vector3Tuple;
  readonly target: Vector3Tuple;
  readonly up: Vector3Tuple;
  readonly fieldOfView: number;
  readonly nearClip: number;
  readonly farClip: number;
  readonly minDistance: number;
  readonly maxDistance: number;
  readonly minPitchDegrees: number;
  readonly maxPitchDegrees: number;
  readonly targetLimit: number;
}

export interface HostedSceneConfiguration {
  readonly id: string;
  readonly metadataUrl: string;
  readonly posterUrl: string;
  readonly scenePageUrl: string;
  readonly expectedFormatVersion: number;
  readonly expectedGaussianCount: number;
  readonly initialCamera: CameraConfiguration;
}

const overviewCamera = getCameraPreset('overview');

export const HOSTED_SCENE: HostedSceneConfiguration = {
  id: 'd1aa30ae',
  metadataUrl: 'https://d28zzqy0iyovbz.cloudfront.net/d1aa30ae/v1/meta.json',
  posterUrl: 'https://s3-eu-west-1.amazonaws.com/images.playcanvas.com/splat/d1aa30ae/v1/xl.webp',
  scenePageUrl: 'https://superspl.at/scene/d1aa30ae',
  expectedFormatVersion: 2,
  expectedGaussianCount: 438_067,
  initialCamera: {
    position: overviewCamera.position,
    target: overviewCamera.target,
    up: overviewCamera.up,
    fieldOfView: overviewCamera.fieldOfView,
    nearClip: 0.05,
    farClip: 100,
    minDistance: 0.55,
    maxDistance: 12,
    minPitchDegrees: -80,
    maxPitchDegrees: 80,
    targetLimit: 10,
  },
};
