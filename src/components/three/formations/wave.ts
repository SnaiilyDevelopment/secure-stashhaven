
import { FormationFunction, FormationParams } from '../types';

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
