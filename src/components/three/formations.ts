
import { FormationFunction, FormationParams } from './types';
import * as THREE from 'three';

// Formation animations
export const grid: FormationFunction = ({ particleCount, particleSize }: FormationParams) => {
  const gridSize = Math.ceil(Math.cbrt(particleCount));
  const spacing = particleSize * 3;
  const offset = (gridSize * spacing) / 2;
  
  const positions = [];
  const colors = [];
  
  let i = 0;
  for (let x = 0; x < gridSize; x++) {
    for (let y = 0; y < gridSize; y++) {
      for (let z = 0; z < gridSize; z++) {
        if (i < particleCount) {
          positions.push(
            x * spacing - offset,
            y * spacing - offset,
            z * spacing - offset
          );
          
          colors.push(
            0.5 + x / gridSize / 2,
            0.5 + y / gridSize / 2,
            0.5 + z / gridSize / 2
          );
          
          i++;
        }
      }
    }
  }
  
  return { positions, colors };
};

// Additional formations...
export const sphere: FormationFunction = ({ particleCount, particleSize }: FormationParams) => {
  const positions = [];
  const colors = [];
  const radius = particleSize * 50;
  
  for (let i = 0; i < particleCount; i++) {
    const phi = Math.acos(-1 + (2 * i) / particleCount);
    const theta = Math.sqrt(particleCount * Math.PI) * phi;
    
    positions.push(
      radius * Math.cos(theta) * Math.sin(phi),
      radius * Math.sin(theta) * Math.sin(phi),
      radius * Math.cos(phi)
    );
    
    colors.push(
      0.5 + 0.5 * Math.sin(theta),
      0.5 + 0.5 * Math.cos(phi),
      0.5 + 0.5 * Math.sin(phi + theta)
    );
  }
  
  return { positions, colors };
};

export const spiral: FormationFunction = ({ particleCount, particleSize }: FormationParams) => {
  const positions = [];
  const colors = [];
  const radius = particleSize * 50;
  const turns = 5;
  
  for (let i = 0; i < particleCount; i++) {
    const t = i / particleCount;
    const angle = turns * Math.PI * 2 * t;
    const radialDistance = radius * t;
    
    positions.push(
      radialDistance * Math.cos(angle),
      i / particleCount * radius - radius / 2,
      radialDistance * Math.sin(angle)
    );
    
    colors.push(
      0.5 + 0.5 * Math.sin(t * Math.PI * 2),
      0.5 + 0.5 * Math.cos(t * Math.PI * 2),
      0.5 + 0.5 * Math.sin(t * Math.PI * 4)
    );
  }
  
  return { positions, colors };
};
