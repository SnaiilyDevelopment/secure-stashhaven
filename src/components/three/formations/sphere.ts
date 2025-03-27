
import { FormationFunction, FormationParams } from '../types';

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
