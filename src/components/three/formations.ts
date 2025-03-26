
import * as THREE from 'three';
import { Point, ParticleMode } from './types';

export const createOrbitFormation = (particles: Point[]) => {
  for (let i = 0; i < particles.length; i++) {
    const particle = particles[i];
    const angle = Math.random() * Math.PI * 2;
    const radius = 5 + Math.random() * 15;
    const height = (Math.random() - 0.5) * 20;
    
    particle.targetPosition.set(
      Math.cos(angle) * radius,
      height,
      Math.sin(angle) * radius
    );
  }
};

export const createWaveFormation = (particles: Point[]) => {
  const gridSize = Math.ceil(Math.sqrt(particles.length));
  const spacing = 25 / gridSize;
  
  for (let i = 0; i < particles.length; i++) {
    const particle = particles[i];
    const x = (i % gridSize - gridSize / 2) * spacing;
    const z = (Math.floor(i / gridSize) - gridSize / 2) * spacing;
    
    particle.targetPosition.set(
      x,
      Math.sin(x * 0.5) * 5 + Math.cos(z * 0.5) * 5,
      z
    );
  }
};

export const createScatterFormation = (particles: Point[]) => {
  for (let i = 0; i < particles.length; i++) {
    const particle = particles[i];
    
    particle.targetPosition.set(
      (Math.random() - 0.5) * 40,
      (Math.random() - 0.5) * 40,
      (Math.random() - 0.5) * 40
    );
  }
};

export const createGridFormation = (particles: Point[]) => {
  const gridSize = Math.ceil(Math.cbrt(particles.length));
  const spacing = 20 / gridSize;
  
  for (let i = 0; i < particles.length; i++) {
    const particle = particles[i];
    const x = (i % gridSize - gridSize / 2) * spacing;
    const y = (Math.floor(i / gridSize) % gridSize - gridSize / 2) * spacing;
    const z = (Math.floor(i / (gridSize * gridSize)) - gridSize / 2) * spacing;
    
    particle.targetPosition.set(x, y, z);
  }
};

export const updateTargetPositions = (particles: Point[], mode: ParticleMode) => {
  if (!particles.length) return;
  
  switch(mode) {
    case 'orbit':
      createOrbitFormation(particles);
      break;
    case 'wave':
      createWaveFormation(particles);
      break;
    case 'scatter':
      createScatterFormation(particles);
      break;
    case 'grid':
      createGridFormation(particles);
      break;
  }
};
