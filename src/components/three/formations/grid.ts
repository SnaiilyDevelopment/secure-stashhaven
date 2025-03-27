
import { FormationFunction, FormationParams } from '../types';

// Formation for grid pattern
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
