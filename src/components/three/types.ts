
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

export type ParticleMode = 'orbit' | 'wave' | 'scatter' | 'grid';

export interface BackgroundProps {
  color?: string;
  density?: number;
  mode?: ParticleMode;
  interactive?: boolean;
}
