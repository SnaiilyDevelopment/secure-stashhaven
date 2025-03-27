
import { FormationFunction, FormationParams } from '../types';

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
