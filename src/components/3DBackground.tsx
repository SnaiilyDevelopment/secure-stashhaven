
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Point {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  targetPosition: THREE.Vector3;
  originalColor: THREE.Color;
  targetColor: THREE.Color;
  lerpSpeed: number;
  lastUpdate: number;
}

type ParticleMode = 'orbit' | 'wave' | 'scatter' | 'grid';

interface BackgroundProps {
  color?: string;
  density?: number;
  mode?: ParticleMode;
  interactive?: boolean;
}

const Background: React.FC<BackgroundProps> = ({ 
  color = '#4ade80', 
  density = 50,
  mode = 'orbit',
  interactive = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const renderer = useRef<THREE.WebGLRenderer | null>(null);
  const scene = useRef<THREE.Scene | null>(null);
  const camera = useRef<THREE.PerspectiveCamera | null>(null);
  const points = useRef<THREE.Points | null>(null);
  const particles = useRef<Point[]>([]);
  const mousePosition = useRef<THREE.Vector2>(new THREE.Vector2(0, 0));
  const raycaster = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const animationFrameId = useRef<number | null>(null);
  const hoverPoint = useRef<THREE.Vector3 | null>(null);
  const lastModeChange = useRef<number>(Date.now());
  const currentMode = useRef<ParticleMode>(mode);
  const targetMode = useRef<ParticleMode>(mode);
  const modeTransitionProgress = useRef<number>(1);
  
  // Parse the color string to a THREE.Color
  const particleColor = new THREE.Color(color);
  
  // Create a lighter version of the color for hover effects
  const hoverColor = new THREE.Color(color).offsetHSL(0, 0, 0.2);
  
  // Initialize scene
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Setup renderer
    renderer.current = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    renderer.current.setPixelRatio(window.devicePixelRatio);
    renderer.current.setSize(window.innerWidth, window.innerHeight);
    renderer.current.setClearColor(0x000000, 0);
    containerRef.current.appendChild(renderer.current.domElement);
    
    // Setup scene
    scene.current = new THREE.Scene();
    
    // Setup camera
    camera.current = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.current.position.z = 30;
    
    // Initialize particles
    initializeParticles();
    
    // Handle window resize
    const handleResize = () => {
      if (!camera.current || !renderer.current) return;
      
      camera.current.aspect = window.innerWidth / window.innerHeight;
      camera.current.updateProjectionMatrix();
      renderer.current.setSize(window.innerWidth, window.innerHeight);
    };
    
    // Track mouse position
    const handleMouseMove = (event: MouseEvent) => {
      if (!containerRef.current) return;
      
      mousePosition.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mousePosition.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    
    // Start animation loop
    const animate = () => {
      if (!scene.current || !camera.current || !renderer.current || !points.current) {
        animationFrameId.current = requestAnimationFrame(animate);
        return;
      }
      
      updateParticles();
      
      // Handle mode transition
      if (modeTransitionProgress.current < 1) {
        modeTransitionProgress.current += 0.01;
        if (modeTransitionProgress.current >= 1) {
          currentMode.current = targetMode.current;
          modeTransitionProgress.current = 1;
        }
      }
      
      // Handle hover effects
      if (interactive && hoverPoint.current) {
        raycaster.current.setFromCamera(mousePosition.current, camera.current);
        
        // Update hover point position - always follow mouse raycaster
        const intersects = raycaster.current.intersectObject(points.current);
        if (intersects.length > 0) {
          hoverPoint.current.copy(intersects[0].point);
        }
      }
      
      renderer.current.render(scene.current, camera.current);
      animationFrameId.current = requestAnimationFrame(animate);
    };
    
    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    
    // Start animation
    animate();
    
    return () => {
      // Clean up
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      
      if (renderer.current && containerRef.current) {
        containerRef.current.removeChild(renderer.current.domElement);
        renderer.current.dispose();
      }
      
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [color, density, interactive]);
  
  // Handle mode changes
  useEffect(() => {
    if (mode !== targetMode.current) {
      lastModeChange.current = Date.now();
      targetMode.current = mode;
      modeTransitionProgress.current = 0;
      
      // Update target positions based on new mode
      updateTargetPositions(mode);
    }
  }, [mode]);
  
  // Initialize particles
  const initializeParticles = () => {
    if (!scene.current) return;
    
    // Create geometry
    const particleCount = calculateParticleCount(density);
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    
    particles.current = [];
    
    // Initialize particles
    for (let i = 0; i < particleCount; i++) {
      // Random position in sphere
      const position = new THREE.Vector3(
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 30,
        (Math.random() - 0.5) * 30
      );
      
      // Set initial position
      position.toArray(positions, i * 3);
      
      // Set color
      particleColor.toArray(colors, i * 3);
      
      // Create particle
      const particle: Point = {
        position: position.clone(),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.05,
          (Math.random() - 0.5) * 0.05,
          (Math.random() - 0.5) * 0.05
        ),
        targetPosition: position.clone(),
        originalColor: particleColor.clone(),
        targetColor: particleColor.clone(),
        lerpSpeed: 0.01 + Math.random() * 0.03,
        lastUpdate: Date.now()
      };
      
      particles.current.push(particle);
    }
    
    // Set attributes
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    // Create material
    const material = new THREE.PointsMaterial({
      size: 0.3,
      vertexColors: true,
      transparent: true,
      opacity: 0.8
    });
    
    // Create points
    points.current = new THREE.Points(geometry, material);
    scene.current.add(points.current);
    
    // If interactive, create hover point
    if (interactive) {
      hoverPoint.current = new THREE.Vector3(0, 0, 0);
    }
    
    // Set initial mode
    updateTargetPositions(currentMode.current);
  };
  
  // Calculate particle count based on density
  const calculateParticleCount = (density: number) => {
    // Base count on density value (1-100)
    const baseCount = Math.max(50, Math.min(500, density * 10));
    
    // Adjust for screen size
    const screenFactor = (window.innerWidth * window.innerHeight) / (1920 * 1080);
    
    return Math.floor(baseCount * screenFactor);
  };
  
  // Update target positions based on mode
  const updateTargetPositions = (mode: ParticleMode) => {
    if (!particles.current.length) return;
    
    switch(mode) {
      case 'orbit':
        createOrbitFormation();
        break;
      case 'wave':
        createWaveFormation();
        break;
      case 'scatter':
        createScatterFormation();
        break;
      case 'grid':
        createGridFormation();
        break;
    }
  };
  
  // Create orbit formation
  const createOrbitFormation = () => {
    for (let i = 0; i < particles.current.length; i++) {
      const particle = particles.current[i];
      const angle = Math.random() * Math.PI * 2;
      const radius = 5 + Math.random() * 15;
      const height = (Math.random() - 0.5) * 20;
      
      // Position on a random orbit
      particle.targetPosition.set(
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
      );
    }
  };
  
  // Create wave formation
  const createWaveFormation = () => {
    const gridSize = Math.ceil(Math.sqrt(particles.current.length));
    const spacing = 25 / gridSize;
    
    for (let i = 0; i < particles.current.length; i++) {
      const particle = particles.current[i];
      const x = (i % gridSize - gridSize / 2) * spacing;
      const z = (Math.floor(i / gridSize) - gridSize / 2) * spacing;
      
      // Position in a wave pattern
      particle.targetPosition.set(
        x,
        Math.sin(x * 0.5) * 5 + Math.cos(z * 0.5) * 5,
        z
      );
    }
  };
  
  // Create scatter formation
  const createScatterFormation = () => {
    for (let i = 0; i < particles.current.length; i++) {
      const particle = particles.current[i];
      
      // Random position in a wider sphere
      particle.targetPosition.set(
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 40,
        (Math.random() - 0.5) * 40
      );
    }
  };
  
  // Create grid formation
  const createGridFormation = () => {
    const gridSize = Math.ceil(Math.cbrt(particles.current.length));
    const spacing = 20 / gridSize;
    
    for (let i = 0; i < particles.current.length; i++) {
      const particle = particles.current[i];
      const x = (i % gridSize - gridSize / 2) * spacing;
      const y = (Math.floor(i / gridSize) % gridSize - gridSize / 2) * spacing;
      const z = (Math.floor(i / (gridSize * gridSize)) - gridSize / 2) * spacing;
      
      // Position in a 3D grid
      particle.targetPosition.set(x, y, z);
    }
  };
  
  // Update particles
  const updateParticles = () => {
    if (!points.current || !particles.current.length) return;
    
    const now = Date.now();
    const positions = points.current.geometry.attributes.position.array as Float32Array;
    const colors = points.current.geometry.attributes.color.array as Float32Array;
    let positionsNeedUpdate = false;
    let colorsNeedUpdate = false;
    
    // Update each particle
    for (let i = 0; i < particles.current.length; i++) {
      const particle = particles.current[i];
      const delta = (now - particle.lastUpdate) / 16.7; // Normalize to 60fps
      particle.lastUpdate = now;
      
      // Move toward target position
      const lerpFactor = particle.lerpSpeed * delta * modeTransitionProgress.current;
      particle.position.lerp(particle.targetPosition, lerpFactor);
      
      // Apply velocity (for modes that need it)
      if (currentMode.current === 'orbit') {
        // Orbital motion
        const distance = Math.sqrt(
          particle.position.x * particle.position.x + 
          particle.position.z * particle.position.z
        );
        
        if (distance > 0) {
          const angle = Math.atan2(particle.position.z, particle.position.x);
          const speed = 0.001 * (20 / Math.max(5, distance)) * delta;
          const newAngle = angle + speed;
          
          particle.position.x = Math.cos(newAngle) * distance;
          particle.position.z = Math.sin(newAngle) * distance;
        }
      }
      
      // Check proximity to hover point (if interactive)
      if (interactive && hoverPoint.current) {
        const distanceToHover = particle.position.distanceTo(hoverPoint.current);
        
        if (distanceToHover < 5) {
          // Influence from hover point (repulsion)
          const repulsionStrength = Math.max(0, 1 - distanceToHover / 5) * 0.2 * delta;
          const repulsionVector = new THREE.Vector3()
            .subVectors(particle.position, hoverPoint.current)
            .normalize()
            .multiplyScalar(repulsionStrength);
          
          particle.position.add(repulsionVector);
          
          // Change color based on hover proximity
          particle.targetColor.copy(hoverColor);
        } else {
          // Revert to original color
          particle.targetColor.copy(particle.originalColor);
        }
      }
      
      // Update color with lerping
      const colorIndex = i * 3;
      const currentColor = new THREE.Color(
        colors[colorIndex],
        colors[colorIndex + 1],
        colors[colorIndex + 2]
      );
      
      if (!currentColor.equals(particle.targetColor)) {
        currentColor.lerp(particle.targetColor, 0.05 * delta);
        currentColor.toArray(colors, colorIndex);
        colorsNeedUpdate = true;
      }
      
      // Update position in geometry
      const positionIndex = i * 3;
      if (
        positions[positionIndex] !== particle.position.x ||
        positions[positionIndex + 1] !== particle.position.y ||
        positions[positionIndex + 2] !== particle.position.z
      ) {
        particle.position.toArray(positions, positionIndex);
        positionsNeedUpdate = true;
      }
    }
    
    // Update geometry if needed
    if (positionsNeedUpdate) {
      points.current.geometry.attributes.position.needsUpdate = true;
    }
    
    if (colorsNeedUpdate) {
      points.current.geometry.attributes.color.needsUpdate = true;
    }
  };
  
  return <div ref={containerRef} className="absolute inset-0 -z-10" />;
};

export default Background;
