
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface BackgroundSceneProps {
  intensity?: number;
  particleCount?: number;
  particleSize?: number;
  color?: string;
  speedFactor?: number;
  responsive?: boolean;
}

const BackgroundScene: React.FC<BackgroundSceneProps> = ({
  intensity = 0.8,
  particleCount = 1000,
  particleSize = 0.01,
  color = '#ffffff',
  speedFactor = 0.5,
  responsive = true
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const frameIdRef = useRef<number | null>(null);
  const timeDeltaRef = useRef(0);

  // Create scene, camera, and renderer only once
  useEffect(() => {
    if (!containerRef.current) return;

    // Cleanup function to remove event listeners and cancel animation frame
    const cleanup = () => {
      if (frameIdRef.current) {
        cancelAnimationFrame(frameIdRef.current);
      }
      window.removeEventListener('resize', handleResize);
      
      if (rendererRef.current && rendererRef.current.domElement) {
        const renderer = rendererRef.current;
        if (renderer.domElement.parentElement) {
          renderer.domElement.parentElement.removeChild(renderer.domElement);
        }
        renderer.dispose();
      }
    };

    // Create scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 2;
    cameraRef.current = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create particles
    const particlesGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    // Generate random positions and velocities
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Random positions within a sphere
      const radius = Math.random() * 2; // 0 to 2
      const theta = Math.random() * Math.PI * 2; // 0 to 2π
      const phi = Math.random() * Math.PI; // 0 to π
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      positions[i3 + 2] = radius * Math.cos(phi);
      
      // Random velocities
      velocities[i3] = (Math.random() - 0.5) * 0.01 * speedFactor;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.01 * speedFactor;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.01 * speedFactor;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particlesGeometry.userData = { velocities };

    const particlesMaterial = new THREE.PointsMaterial({
      color: new THREE.Color(color),
      size: particleSize,
      transparent: true,
      opacity: intensity,
      // Disable depth test to avoid particles disappearing when behind others
      depthTest: false,
      // Use additive blending for a glowing effect
      blending: THREE.AdditiveBlending
    });

    const particles = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particles);
    particlesRef.current = particles;

    // Create ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Handle window resize
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;
      
      // Update camera aspect ratio
      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      
      // Update renderer size
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };

    if (responsive) {
      window.addEventListener('resize', handleResize);
    }

    // Animation function
    const animate = () => {
      frameIdRef.current = requestAnimationFrame(animate);
      
      if (!particlesRef.current || !sceneRef.current || !cameraRef.current || !rendererRef.current) return;
      
      // Increment time delta
      timeDeltaRef.current += 0.01;
      
      // Get particle positions and velocities
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
      const velocities = particlesRef.current.geometry.userData.velocities as Float32Array;
      
      // Update particle positions based on velocities
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += velocities[i];
        positions[i + 1] += velocities[i + 1];
        positions[i + 2] += velocities[i + 2];
        
        // Boundary check (keep particles within a sphere of radius 2)
        const distance = Math.sqrt(
          positions[i] * positions[i] +
          positions[i + 1] * positions[i + 1] +
          positions[i + 2] * positions[i + 2]
        );
        
        if (distance > 2) {
          // Reverse velocity when hitting the boundary
          velocities[i] = -velocities[i];
          velocities[i + 1] = -velocities[i + 1];
          velocities[i + 2] = -velocities[i + 2];
        }
      }
      
      // Mark positions as needing update
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
      
      // Auto-rotate particles
      particlesRef.current.rotation.y += 0.001;
      
      // Render scene
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    };

    // Start animation
    animate();

    // Clean up on unmount
    return cleanup;
  }, [particleCount, particleSize, color, intensity, speedFactor, responsive]);

  return <div ref={containerRef} className="absolute top-0 left-0 w-full h-full -z-10" />;
};

const dispose = (object: THREE.Object3D): void => {
  // Recursively dispose of all children
  object.children.forEach((child: THREE.Object3D) => dispose(child));
  
  // Dispose of geometries
  if ('geometry' in object && object.geometry) {
    object.geometry.dispose();
  }
  
  // Dispose of materials
  if ('material' in object && object.material) {
    const material = object.material as THREE.Material | THREE.Material[];
    if (Array.isArray(material)) {
      material.forEach(m => m.dispose());
    } else {
      material.dispose();
    }
  }
};

export default BackgroundScene;
