
import { FormationFunction, FormationParams, Point, ParticleMode } from './types';
// THREE import removed as it's not used directly in this file

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

// New formation: wave pattern
export const wave: FormationFunction = ({ particleCount, particleSize }: FormationParams) => {
  const positions = [];
  const colors = [];
  const gridSize = Math.ceil(Math.sqrt(particleCount));
  const spacing = particleSize * 3;
  const offset = (gridSize * spacing) / 2;
  
  let i = 0;
  for (let x = 0; x < gridSize; x++) {
    for (let z = 0; z < gridSize; z++) {
      if (i < particleCount) {
        const waveHeight = Math.sin(x / 3) * Math.cos(z / 3) * spacing * 2;
        
        positions.push(
          x * spacing - offset,
          waveHeight,
          z * spacing - offset
        );
        
        colors.push(
          0.5 + 0.5 * Math.sin(x / gridSize * Math.PI),
          0.5 + 0.5 * Math.cos(z / gridSize * Math.PI),
          0.5 + 0.5 * Math.sin((x + z) / gridSize * Math.PI)
        );
        
        i++;
      }
    }
  }
  
  return { positions, colors };
};

// New formation: scattered particles
export const scatter: FormationFunction = ({ particleCount, particleSize }: FormationParams) => {
  const positions = [];
  const colors = [];
  const radius = particleSize * 100;
  
  for (let i = 0; i < particleCount; i++) {
    positions.push(
      (Math.random() - 0.5) * radius,
      (Math.random() - 0.5) * radius,
      (Math.random() - 0.5) * radius
    );
    
    colors.push(
      0.5 + 0.5 * Math.random(),
      0.5 + 0.5 * Math.random(),
      0.5 + 0.5 * Math.random()
    );
  }
  
  return { positions, colors };
};

// Function to update particle target positions based on the selected formation
export const updateTargetPositions = (particles: Point[], mode: ParticleMode): void => {
  if (!particles.length) return;
  
  const particleCount = particles.length;
  const particleSize = 0.3; // Match the size used in particleSystem.ts
  
  // Create formation data based on the selected mode
  let formationData;
  switch (mode) {
    case 'grid':
      formationData = grid({ particleCount, particleSize });
      break;
    case 'sphere':
      formationData = sphere({ particleCount, particleSize });
      break;
    case 'spiral':
      formationData = spiral({ particleCount, particleSize });
      break;
    case 'wave':
      formationData = wave({ particleCount, particleSize });
      break;
    case 'scatter':
      formationData = scatter({ particleCount, particleSize });
      break;
    default:
      // Use scatter as default for orbit or any unknown mode
      formationData = scatter({ particleCount, particleSize });
      break;
  }
  
  // Update target positions for each particle
  for (let i = 0; i < particleCount; i++) {
    if (i < formationData.positions.length / 3) {
      const posIndex = i * 3;
      particles[i].targetPosition.set(
        formationData.positions[posIndex],
        formationData.positions[posIndex + 1],
        formationData.positions[posIndex + 2]
      );
      
      const colorIndex = i * 3;
      if (formationData.colors && formationData.colors.length > colorIndex + 2) {
        particles[i].originalColor.setRGB(
          formationData.colors[colorIndex],
          formationData.colors[colorIndex + 1],
          formationData.colors[colorIndex + 2]
        );
      }
    }
  }
};
