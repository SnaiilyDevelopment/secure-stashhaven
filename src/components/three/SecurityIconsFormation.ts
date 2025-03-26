
import * as THREE from 'three';
import { FormationFunction, FormationParams } from './types';

// Formation that creates lock and key shapes
export const securityIcons: FormationFunction = ({ particleCount, particleSize }: FormationParams) => {
  const positions = [];
  const colors = [];
  
  // Calculate dimensions for proportional scaling
  const scale = particleSize * 30;
  const lockWidth = scale * 0.8;
  const lockHeight = scale * 1.2;
  const keyLength = scale * 1.5;
  
  // Distribution control
  const totalIcons = Math.min(particleCount, 800); // Limit max particles for performance
  const lockParticles = Math.floor(totalIcons * 0.5); // 50% for lock
  const keyParticles = Math.floor(totalIcons * 0.3); // 30% for key
  const scatterParticles = totalIcons - lockParticles - keyParticles; // Remaining for scatter

  // Create a padlock shape
  for (let i = 0; i < lockParticles; i++) {
    // Determine position on lock shape 
    if (i < lockParticles * 0.6) {
      // Lock body (rectangular part)
      const t = i / (lockParticles * 0.6);
      const row = Math.floor(t * 20);
      const col = Math.floor((t * 20) % 10);
      
      positions.push(
        (col / 10) * lockWidth - lockWidth/2,
        -lockHeight/3 + (row / 20) * lockHeight,
        (Math.random() - 0.5) * 0.2 * scale
      );
    } else {
      // Lock shackle (curved top part)
      const t = (i - lockParticles * 0.6) / (lockParticles * 0.4);
      const angle = t * Math.PI;
      
      positions.push(
        Math.sin(angle) * (lockWidth/2) * 0.8,
        lockHeight/3 + Math.cos(angle) * (lockHeight/3),
        (Math.random() - 0.5) * 0.2 * scale
      );
    }
    
    // Green tones for lock
    colors.push(
      0.2 + Math.random() * 0.1, // R - low for green
      0.7 + Math.random() * 0.3, // G - high for green
      0.3 + Math.random() * 0.2  // B - medium for green tint
    );
  }

  // Create a key shape
  const keyOffset = [scale * 1.5, -scale * 0.5, 0]; // Offset key from lock
  for (let i = 0; i < keyParticles; i++) {
    const t = i / keyParticles;
    
    if (t < 0.3) {
      // Key head (circular part)
      const angle = t / 0.3 * Math.PI * 2;
      positions.push(
        Math.cos(angle) * (scale * 0.3) + keyOffset[0],
        Math.sin(angle) * (scale * 0.3) + keyOffset[1],
        (Math.random() - 0.5) * 0.2 * scale + keyOffset[2]
      );
    } else {
      // Key shaft and teeth
      const shaft = (t - 0.3) / 0.7;
      const xPos = keyOffset[0] - shaft * keyLength;
      
      // Add teeth to key (only on bottom half)
      let yPos = keyOffset[1];
      if (shaft > 0.3 && shaft < 0.9) {
        // Determine if this particle is a tooth
        if (Math.random() > 0.7) {
          yPos += (Math.random() - 0.5) * scale * 0.3;
        }
      }
      
      positions.push(
        xPos,
        yPos,
        (Math.random() - 0.5) * 0.2 * scale + keyOffset[2]
      );
    }
    
    // Gold/yellow tones for key
    colors.push(
      0.8 + Math.random() * 0.2, // R - high for gold
      0.7 + Math.random() * 0.3, // G - high for gold
      0.2 + Math.random() * 0.1  // B - low for gold
    );
  }
  
  // Add some scattered particles
  for (let i = 0; i < scatterParticles; i++) {
    positions.push(
      (Math.random() - 0.5) * scale * 4,
      (Math.random() - 0.5) * scale * 4,
      (Math.random() - 0.5) * scale * 4
    );
    
    // Green/teal security-themed colors
    colors.push(
      0.1 + Math.random() * 0.3, // R
      0.6 + Math.random() * 0.4, // G
      0.4 + Math.random() * 0.3  // B
    );
  }
  
  return { positions, colors };
};
