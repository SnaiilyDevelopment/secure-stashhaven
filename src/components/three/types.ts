
import * as THREE from 'three';

export interface Point {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  targetPosition: THREE.Vector3;
  originalColor: THREE.Color;
  targetColor: THREE.Color;
  lerpSpeed: number;
  lastUpdate: number;
}

export type ParticleMode = 'orbit' | 'wave' | 'scatter' | 'grid' | 'sphere' | 'spiral';

export interface BackgroundProps {
  color?: string;
  density?: number;
  mode?: ParticleMode;
  interactive?: boolean;
}

export interface FormationParams {
  particleCount: number;
  particleSize: number;
}

export interface FormationResult {
  positions: number[];
  colors: number[];
}

export type FormationFunction = (params: FormationParams) => FormationResult;
