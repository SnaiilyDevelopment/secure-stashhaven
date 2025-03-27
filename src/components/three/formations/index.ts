
import { grid } from './grid';
import { sphere } from './sphere';
import { spiral } from './spiral';
import { wave } from './wave';
import { scatter } from './scatter';
import { securityIcons } from '../SecurityIconsFormation';

// Re-export the formation functions
export { grid, sphere, spiral, wave, scatter, securityIcons };

// Helper function to update particle positions
export const updateTargetPositions = (
  currentPositions: number[],
  targetPositions: number[],
  speed: number = 0.1
): number[] => {
  const positions = [...currentPositions];
  
  for (let i = 0; i < positions.length; i++) {
    positions[i] += (targetPositions[i] - positions[i]) * speed;
  }
  
  return positions;
};
