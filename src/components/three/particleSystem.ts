
import THREE from 'three';
import { Point } from './types';

export const calculateParticleCount = (density: number) => {
  const baseCount = Math.max(50, Math.min(500, density * 10));
  const screenFactor = (window.innerWidth * window.innerHeight) / (1920 * 1080);
  return Math.floor(baseCount * screenFactor);
};

export const initializeParticles = (
  scene: THREE.Scene,
  particleColor: THREE.Color,
  density: number,
  interactive: boolean
): { 
  points: THREE.Points,
  particles: Point[],
  hoverPoint: THREE.Vector3 | null 
} => {
  const particleCount = calculateParticleCount(density);
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  
  const particles: Point[] = [];
  
  for (let i = 0; i < particleCount; i++) {
    const position = new THREE.Vector3(
      (Math.random() - 0.5) * 30,
      (Math.random() - 0.5) * 30,
      (Math.random() - 0.5) * 30
    );
    
    position.toArray(positions, i * 3);
    particleColor.toArray(colors, i * 3);
    
    const particle: Point = {
      position: position.clone(),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.05,
        (Math.random() - 0.5) * 0.05,
        (Math.random() - 0.5) * 0.05
      ),
      targetPosition: position.clone(),
      originalColor: particleColor.clone(),
      targetColor: particleColor.clone(),
      lerpSpeed: 0.01 + Math.random() * 0.03,
      lastUpdate: Date.now()
    };
    
    particles.push(particle);
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  
  const material = new THREE.PointsMaterial({
    size: 0.3,
    vertexColors: true,
    transparent: true,
    opacity: 0.8
  });
  
  const points = new THREE.Points(geometry, material);
  scene.add(points);
  
  const hoverPoint = interactive ? new THREE.Vector3(0, 0, 0) : null;
  
  return { points, particles, hoverPoint };
};

export const updateParticles = (
  points: THREE.Points,
  particles: Point[],
  hoverPoint: THREE.Vector3 | null,
  currentMode: string,
  modeTransitionProgress: number,
  interactive: boolean,
  hoverColor: THREE.Color
) => {
  if (!points || !particles.length) return;
  
  const now = Date.now();
  const positions = points.geometry.attributes.position.array as Float32Array;
  const colors = points.geometry.attributes.color.array as Float32Array;
  let positionsNeedUpdate = false;
  let colorsNeedUpdate = false;
  
  for (let i = 0; i < particles.length; i++) {
    const particle = particles[i];
    const delta = (now - particle.lastUpdate) / 16.7;
    particle.lastUpdate = now;
    
    const lerpFactor = particle.lerpSpeed * delta * modeTransitionProgress;
    particle.position.lerp(particle.targetPosition, lerpFactor);
    
    if (currentMode === 'orbit') {
      const distance = Math.sqrt(
        particle.position.x * particle.position.x + 
        particle.position.z * particle.position.z
      );
      
      if (distance > 0) {
        const angle = Math.atan2(particle.position.z, particle.position.x);
        const speed = 0.001 * (20 / Math.max(5, distance)) * delta;
        const newAngle = angle + speed;
        
        particle.position.x = Math.cos(newAngle) * distance;
        particle.position.z = Math.sin(newAngle) * distance;
      }
    }
    
    if (interactive && hoverPoint) {
      const distanceToHover = particle.position.distanceTo(hoverPoint);
      
      if (distanceToHover < 5) {
        const repulsionStrength = Math.max(0, 1 - distanceToHover / 5) * 0.2 * delta;
        const repulsionVector = new THREE.Vector3()
          .subVectors(particle.position, hoverPoint)
          .normalize()
          .multiplyScalar(repulsionStrength);
        
        particle.position.add(repulsionVector);
        particle.targetColor.copy(hoverColor);
      } else {
        particle.targetColor.copy(particle.originalColor);
      }
    }
    
    const colorIndex = i * 3;
    const currentColor = new THREE.Color(
      colors[colorIndex],
      colors[colorIndex + 1],
      colors[colorIndex + 2]
    );
    
    if (!currentColor.equals(particle.targetColor)) {
      currentColor.lerp(particle.targetColor, 0.05 * delta);
      currentColor.toArray(colors, colorIndex);
      colorsNeedUpdate = true;
    }
    
    const positionIndex = i * 3;
    if (
      positions[positionIndex] !== particle.position.x ||
      positions[positionIndex + 1] !== particle.position.y ||
      positions[positionIndex + 2] !== particle.position.z
    ) {
      particle.position.toArray(positions, positionIndex);
      positionsNeedUpdate = true;
    }
  }
  
  if (positionsNeedUpdate) {
    points.geometry.attributes.position.needsUpdate = true;
  }
  
  if (colorsNeedUpdate) {
    points.geometry.attributes.color.needsUpdate = true;
  }
};
