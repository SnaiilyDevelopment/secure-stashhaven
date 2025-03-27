
import { FormationFunction, FormationParams } from '../types';

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
