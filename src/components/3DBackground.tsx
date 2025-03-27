
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ThreeDBackgroundProps {
  color?: string;
}

const ThreeDBackground: React.FC<ThreeDBackgroundProps> = ({ color = '#10b981' }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    mountRef.current.appendChild(renderer.domElement);

    // Responsive handling
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Camera position
    camera.position.z = 30;

    // Set up lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    // Convert color string to THREE.Color
    const themeColor = new THREE.Color(color);
    
    // Create security-themed objects
    const objects: THREE.Mesh[] = [];
    
    // Create locks
    for (let i = 0; i < 15; i++) {
      const geometry = new THREE.BoxGeometry(1.5, 2, 0.5);
      const material = new THREE.MeshPhongMaterial({ 
        color: themeColor,
        transparent: true,
        opacity: 0.7,
        specular: 0xffffff,
        shininess: 100
      });
      
      const lock = new THREE.Mesh(geometry, material);
      
      // Add a "shackle" to make it look like a padlock
      const shackleGeometry = new THREE.TorusGeometry(0.5, 0.1, 16, 32, Math.PI);
      const shackleMaterial = new THREE.MeshPhongMaterial({ 
        color: themeColor,
        transparent: true,
        opacity: 0.7
      });
      const shackle = new THREE.Mesh(shackleGeometry, shackleMaterial);
      shackle.rotation.x = Math.PI / 2;
      shackle.position.y = 1.25;
      
      // Group the lock parts
      const lockGroup = new THREE.Group();
      lockGroup.add(lock);
      lockGroup.add(shackle);
      
      // Position randomly in space
      lockGroup.position.x = Math.random() * 60 - 30;
      lockGroup.position.y = Math.random() * 40 - 20;
      lockGroup.position.z = Math.random() * 30 - 40;
      
      // Random rotation
      lockGroup.rotation.x = Math.random() * Math.PI;
      lockGroup.rotation.y = Math.random() * Math.PI;
      
      scene.add(lockGroup);
      objects.push(lock); // Add to objects array for animation
    }
    
    // Create shield objects
    for (let i = 0; i < 10; i++) {
      const shieldShape = new THREE.Shape();
      shieldShape.moveTo(0, 2);
      shieldShape.bezierCurveTo(2, 2, 2, -2, 0, -2);
      shieldShape.bezierCurveTo(-2, -2, -2, 2, 0, 2);
      
      const extrudeSettings = {
        steps: 1,
        depth: 0.3,
        bevelEnabled: true,
        bevelThickness: 0.1,
        bevelSize: 0.1,
        bevelSegments: 3
      };
      
      const geometry = new THREE.ExtrudeGeometry(shieldShape, extrudeSettings);
      const material = new THREE.MeshPhongMaterial({ 
        color: themeColor, 
        transparent: true, 
        opacity: 0.6,
        specular: 0xffffff,
        shininess: 30
      });
      
      const shield = new THREE.Mesh(geometry, material);
      
      // Position randomly
      shield.position.x = Math.random() * 60 - 30;
      shield.position.y = Math.random() * 40 - 20;
      shield.position.z = Math.random() * 30 - 35;
      
      // Random scale
      const scale = Math.random() * 0.5 + 0.5;
      shield.scale.set(scale, scale, scale);
      
      // Random rotation
      shield.rotation.x = Math.random() * Math.PI;
      shield.rotation.y = Math.random() * Math.PI;
      shield.rotation.z = Math.random() * Math.PI;
      
      scene.add(shield);
      objects.push(shield);
    }
    
    // Create key objects
    for (let i = 0; i < 8; i++) {
      // Key handle
      const handleGeometry = new THREE.TorusGeometry(0.6, 0.2, 16, 32);
      const keyMaterial = new THREE.MeshPhongMaterial({ 
        color: themeColor,
        transparent: true,
        opacity: 0.7,
        specular: 0xffffff,
        shininess: 80
      });
      const handle = new THREE.Mesh(handleGeometry, keyMaterial);
      
      // Key shaft
      const shaftGeometry = new THREE.CylinderGeometry(0.15, 0.15, 3, 8);
      const shaft = new THREE.Mesh(shaftGeometry, keyMaterial);
      shaft.position.y = -1.5;
      shaft.rotation.x = Math.PI / 2;
      
      // Key teeth
      const teethGroup = new THREE.Group();
      for (let j = 0; j < 4; j++) {
        const toothGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
        const tooth = new THREE.Mesh(toothGeometry, keyMaterial);
        tooth.position.set(0, -j * 0.5 - 2.5, 0);
        teethGroup.add(tooth);
      }
      
      // Group all key parts
      const key = new THREE.Group();
      key.add(handle);
      key.add(shaft);
      key.add(teethGroup);
      
      // Position randomly
      key.position.x = Math.random() * 60 - 30;
      key.position.y = Math.random() * 40 - 20;
      key.position.z = Math.random() * 30 - 35;
      
      // Random rotation
      key.rotation.x = Math.random() * Math.PI;
      key.rotation.y = Math.random() * Math.PI;
      key.rotation.z = Math.random() * Math.PI;
      
      scene.add(key);
      objects.push(shaft); // Use shaft for animation
    }
    
    // Add binary/code particles for a cybersecurity feel
    const particlesCount = 500;
    const positions = new Float32Array(particlesCount * 3);
    
    for (let i = 0; i < particlesCount * 3; i += 3) {
      positions[i] = Math.random() * 100 - 50;
      positions[i + 1] = Math.random() * 100 - 50;
      positions[i + 2] = Math.random() * 50 - 75;
    }
    
    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const particleMaterial = new THREE.PointsMaterial({
      color: themeColor,
      size: 0.3,
      transparent: true,
      opacity: 0.7
    });
    
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);
    
    // Mouse interaction
    const mouse = new THREE.Vector2();
    const windowHalf = new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2);
    
    const onMouseMove = (event: MouseEvent) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    
    window.addEventListener('mousemove', onMouseMove);
    
    // Animation
    const animate = () => {
      requestAnimationFrame(animate);
      
      // Rotate objects
      objects.forEach((obj) => {
        obj.rotation.x += 0.002;
        obj.rotation.y += 0.003;
      });
      
      // Move objects based on mouse position
      objects.forEach((obj) => {
        // Fixed: Use non-optional chaining for assignment
        if (obj.parent) {
          obj.parent.position.x += mouse.x * 0.01;
          obj.parent.position.y += mouse.y * 0.01;
        }
      });
      
      // Rotate particles
      particles.rotation.y += 0.001;
      
      // Subtle camera movement based on mouse
      camera.position.x += (mouse.x * 2 - camera.position.x) * 0.05;
      camera.position.y += (-mouse.y * 2 - camera.position.y) * 0.05;
      camera.lookAt(scene.position);
      
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', onMouseMove);
      if (mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      // Dispose geometries and materials
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
      
      renderer.dispose();
    };
  }, [color]);
  
  return (
    <div 
      ref={mountRef} 
      className="fixed top-0 left-0 w-full h-full -z-10"
      style={{ pointerEvents: 'none' }}
    />
  );
};

export default ThreeDBackground;
