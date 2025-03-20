
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface Props {
  color?: string;
}

const ThreeDBackground: React.FC<Props> = ({ color = '#4ade80' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Set up the scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2('#F2FCE2', 0.08);
    
    // Create a camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 7;
    
    // Set up the renderer
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);
    
    // Add lights
    const ambientLight = new THREE.AmbientLight(0xcccccc, 0.4);
    scene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(0xffffff, 0.8);
    camera.add(pointLight);
    scene.add(camera);
    
    // Create objects
    const objects: THREE.Mesh[] = [];
    const createGeometries = () => {
      const geometries = [
        new THREE.IcosahedronGeometry(1, 0), // Basic icosahedron 
        new THREE.OctahedronGeometry(1, 0),  // Basic octahedron
        new THREE.TetrahedronGeometry(1, 0), // Basic tetrahedron
        new THREE.TorusKnotGeometry(0.7, 0.3, 64, 8, 2, 3) // Torus knot
      ];
      
      // Remove old objects
      while (objects.length) {
        const obj = objects.pop();
        if (obj) scene.remove(obj);
      }
      
      // Calculate how many objects to create based on screen size
      const numObjects = Math.max(8, Math.min(15, Math.floor(window.innerWidth / 150)));
      
      for (let i = 0; i < numObjects; i++) {
        const geometry = geometries[Math.floor(Math.random() * geometries.length)];
        const material = new THREE.MeshPhongMaterial({
          color: new THREE.Color(color).offsetHSL(i * 0.1, 0, 0),
          transparent: true,
          opacity: 0.7,
          shininess: 100,
          flatShading: true
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        
        // Random position
        mesh.position.set(
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 15,
          (Math.random() - 3) * 5
        );
        
        // Random rotation
        mesh.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        );
        
        // Random scale between 0.4 and 1
        const scale = 0.4 + Math.random() * 0.6;
        mesh.scale.set(scale, scale, scale);
        
        // Store initial rotation for animation
        (mesh as any).initialRotation = {
          x: mesh.rotation.x,
          y: mesh.rotation.y,
          z: mesh.rotation.z
        };
        
        // Store random rotation speed
        (mesh as any).rotationSpeed = {
          x: (Math.random() - 0.5) * 0.01,
          y: (Math.random() - 0.5) * 0.01,
          z: (Math.random() - 0.5) * 0.01
        };
        
        scene.add(mesh);
        objects.push(mesh);
      }
    };
    
    createGeometries();
    
    // Handle mouse movement to rotate objects
    let mouseX = 0;
    let mouseY = 0;
    
    const handleMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    
    // Handle window resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      createGeometries(); // Recreate geometries for new screen size
    };
    
    window.addEventListener('resize', handleResize);
    
    // Animation loop
    let frameId: number;
    
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      
      // Apply mouse movement influence
      objects.forEach((obj, index) => {
        // Base rotation
        obj.rotation.x += (obj as any).rotationSpeed.x;
        obj.rotation.y += (obj as any).rotationSpeed.y;
        obj.rotation.z += (obj as any).rotationSpeed.z;
        
        // Mouse influence
        obj.rotation.x += mouseY * 0.01;
        obj.rotation.y += mouseX * 0.01;
        
        // Apply subtle position changes based on mouse
        obj.position.x += mouseX * 0.01;
        obj.position.y += mouseY * 0.01;
        
        // Limit position changes
        obj.position.x = Math.max(-10, Math.min(10, obj.position.x));
        obj.position.y = Math.max(-10, Math.min(10, obj.position.y));
      });
      
      renderer.render(scene, camera);
    };
    
    animate();
    
    // Cleanup
    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [color]);
  
  return (
    <div 
      ref={containerRef} 
      className="fixed top-0 left-0 w-full h-full -z-10"
      style={{ pointerEvents: 'none' }}
    />
  );
};

export default ThreeDBackground;
