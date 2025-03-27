
import { FormationFunction, FormationParams } from './types';
import * as THREE from 'three';

export const securityIcons: FormationFunction = ({ particleCount, particleSize }: FormationParams) => {
  const positions = [];
  const colors = [];
  
  // Distribution parameters
  const scaleFactor = particleSize * 120;
  const centerClusterSize = particleCount * 0.4; // 40% for center cluster
  const lockClusterSize = particleCount * 0.3; // 30% for lock shape
  const keyClusterSize = particleCount * 0.2; // 20% for key shape
  const scatterSize = particleCount * 0.1; // 10% for scattered particles
  
  // Create a center cluster
  for (let i = 0; i < centerClusterSize; i++) {
    const theta = Math.random() * Math.PI * 2;
    const radius = 0.2 * Math.random() * scaleFactor;
    
    positions.push(
      Math.cos(theta) * radius,
      Math.sin(theta) * radius,
      (Math.random() - 0.5) * radius * 0.5
    );
    
    colors.push(0.4, 0.8, 0.5); // Green-ish color
  }
  
  // Create a lock shape
  const lockCenter = new THREE.Vector3(scaleFactor * 0.4, 0, 0);
  const lockRadius = scaleFactor * 0.15;
  const lockBodyWidth = lockRadius * 1.2;
  const lockBodyHeight = lockRadius * 2;
  
  for (let i = 0; i < lockClusterSize; i++) {
    const isInBody = Math.random() > 0.4;
    
    if (isInBody) {
      // Lock body (rectangle)
      positions.push(
        lockCenter.x + (Math.random() - 0.5) * lockBodyWidth,
        lockCenter.y - lockRadius - Math.random() * lockBodyHeight,
        lockCenter.z + (Math.random() - 0.5) * (lockBodyWidth * 0.5)
      );
    } else {
      // Lock circle
      const theta = Math.random() * Math.PI;
      positions.push(
        lockCenter.x + Math.cos(theta) * lockRadius,
        lockCenter.y - Math.random() * 0.2 * lockRadius,
        lockCenter.z + Math.sin(theta) * lockRadius
      );
    }
    
    colors.push(0.6, 0.9, 0.4); // Lighter green
  }
  
  // Create a key shape
  const keyCenter = new THREE.Vector3(-scaleFactor * 0.4, 0, 0);
  const keyHeadRadius = scaleFactor * 0.12;
  const keyLength = scaleFactor * 0.4;
  
  for (let i = 0; i < keyClusterSize; i++) {
    const isInStem = Math.random() > 0.4;
    
    if (isInStem) {
      // Key stem
      positions.push(
        keyCenter.x + Math.random() * keyLength,
        keyCenter.y + (Math.random() - 0.5) * (keyHeadRadius * 0.5),
        keyCenter.z + (Math.random() - 0.5) * (keyHeadRadius * 0.5)
      );
      
      // Add teeth to the key
      if (Math.random() > 0.7) {
        positions.push(
          keyCenter.x + Math.random() * keyLength,
          keyCenter.y + keyHeadRadius * (Math.random() > 0.5 ? 0.6 : -0.6),
          keyCenter.z + (Math.random() - 0.5) * (keyHeadRadius * 0.5)
        );
        
        colors.push(0.7, 0.9, 0.5); // Lighter green for teeth
      }
    } else {
      // Key head (circle)
      const theta = Math.random() * Math.PI * 2;
      positions.push(
        keyCenter.x + Math.cos(theta) * keyHeadRadius,
        keyCenter.y + Math.sin(theta) * keyHeadRadius,
        keyCenter.z + (Math.random() - 0.5) * (keyHeadRadius * 0.3)
      );
    }
    
    colors.push(0.5, 0.85, 0.4); // Green color
  }
  
  // Add some scattered particles
  for (let i = 0; i < scatterSize; i++) {
    positions.push(
      (Math.random() - 0.5) * scaleFactor,
      (Math.random() - 0.5) * scaleFactor,
      (Math.random() - 0.5) * scaleFactor
    );
    
    colors.push(0.3 + Math.random() * 0.5, 0.7 + Math.random() * 0.3, 0.3 + Math.random() * 0.3);
  }
  
  return { positions, colors };
};
