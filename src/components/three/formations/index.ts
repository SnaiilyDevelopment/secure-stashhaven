
import { FormationFunction, FormationParams, Point, ParticleMode } from '../types';
import { grid } from './grid';
import { sphere } from './sphere';
import { spiral } from './spiral';
import { wave } from './wave';
import { scatter } from './scatter';
import { securityIcons } from '../SecurityIconsFormation';

// Export all formations
export { grid, sphere, spiral, wave, scatter, securityIcons };

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
    case 'security':
      formationData = securityIcons({ particleCount, particleSize });
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
