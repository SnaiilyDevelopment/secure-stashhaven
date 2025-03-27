
import { grid } from './grid';
import { sphere } from './sphere';
import { spiral } from './spiral';
import { wave } from './wave';
import { scatter } from './scatter';
import { securityIcons } from '../SecurityIconsFormation';
import { Point, ParticleMode } from '../types';

// Re-export the formation functions
export { grid, sphere, spiral, wave, scatter, securityIcons };

// Helper function to update particle positions
export const updateTargetPositions = (
  particles: Point[],
  mode: ParticleMode,
  speed: number = 0.1
): void => {
  // Calculate formation positions based on mode
  const count = particles.length;
  const positions = [];
  
  // Create target positions based on the formation mode
  switch (mode) {
    case 'grid':
      const gridFormation = grid({ particleCount: count, particleSize: 0.3 });
      positions.push(...gridFormation.positions);
      break;
    case 'sphere':
      const sphereFormation = sphere({ particleCount: count, particleSize: 0.3 });
      positions.push(...sphereFormation.positions);
      break;
    case 'spiral':
      const spiralFormation = spiral({ particleCount: count, particleSize: 0.3 });
      positions.push(...spiralFormation.positions);
      break;
    case 'wave':
      const waveFormation = wave({ particleCount: count, particleSize: 0.3 });
      positions.push(...waveFormation.positions);
      break;
    case 'scatter':
      const scatterFormation = scatter({ particleCount: count, particleSize: 0.3 });
      positions.push(...scatterFormation.positions);
      break;
    case 'security':
      const securityFormation = securityIcons({ particleCount: count, particleSize: 0.3 });
      positions.push(...securityFormation.positions);
      break;
    default:
      const orbitFormation = scatter({ particleCount: count, particleSize: 0.3 });
      positions.push(...orbitFormation.positions);
  }
  
  // Update each particle's target position
  for (let i = 0; i < count; i++) {
    const particleIndex = i * 3;
    const particle = particles[i];
    
    // Set the target position for the particle
    particle.targetPosition.set(
      positions[particleIndex] || 0,
      positions[particleIndex + 1] || 0,
      positions[particleIndex + 2] || 0
    );
  }
};
