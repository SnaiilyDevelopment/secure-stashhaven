
import React, { useEffect, useRef } from 'react';
import THREE from 'three';
import { BackgroundProps, Point, ParticleMode } from './types';
import { initializeParticles, updateParticles } from './particleSystem';
import { updateTargetPositions } from './formations';

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
  
  const particleColor = new THREE.Color(color);
  const hoverColor = new THREE.Color(color).offsetHSL(0, 0, 0.2);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    renderer.current = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    renderer.current.setPixelRatio(window.devicePixelRatio);
    renderer.current.setSize(window.innerWidth, window.innerHeight);
    renderer.current.setClearColor(0x000000, 0);
    containerRef.current.appendChild(renderer.current.domElement);
    
    scene.current = new THREE.Scene();
    camera.current = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.current.position.z = 30;
    
    const { points: newPoints, particles: newParticles, hoverPoint: newHoverPoint } = 
      initializeParticles(scene.current, particleColor, density, interactive);
    
    points.current = newPoints;
    particles.current = newParticles;
    hoverPoint.current = newHoverPoint;
    
    updateTargetPositions(particles.current, currentMode.current);
    
    const handleResize = () => {
      if (!camera.current || !renderer.current) return;
      
      camera.current.aspect = window.innerWidth / window.innerHeight;
      camera.current.updateProjectionMatrix();
      renderer.current.setSize(window.innerWidth, window.innerHeight);
    };
    
    const handleMouseMove = (event: MouseEvent) => {
      if (!containerRef.current) return;
      
      mousePosition.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mousePosition.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    
    const animate = () => {
      if (!scene.current || !camera.current || !renderer.current || !points.current) {
        animationFrameId.current = requestAnimationFrame(animate);
        return;
      }
      
      updateParticles(
        points.current,
        particles.current,
        hoverPoint.current,
        currentMode.current,
        modeTransitionProgress.current,
        interactive,
        hoverColor
      );
      
      if (modeTransitionProgress.current < 1) {
        modeTransitionProgress.current += 0.01;
        if (modeTransitionProgress.current >= 1) {
          currentMode.current = targetMode.current;
          modeTransitionProgress.current = 1;
        }
      }
      
      if (interactive && hoverPoint.current) {
        raycaster.current.setFromCamera(mousePosition.current, camera.current);
        
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
    
    animate();
    
    return () => {
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
  
  useEffect(() => {
    if (mode !== targetMode.current) {
      lastModeChange.current = Date.now();
      targetMode.current = mode;
      modeTransitionProgress.current = 0;
      
      updateTargetPositions(particles.current, mode);
    }
  }, [mode]);
  
  return <div ref={containerRef} className="absolute inset-0 -z-10" />;
};

export default Background;
