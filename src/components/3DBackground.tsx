
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
    
    // Create security-themed geometries
    const createGeometries = () => {
      // Add a lock shape using combined geometries
      const createLockShape = () => {
        const lockGroup = new THREE.Group();
        
        // Lock body
        const lockBodyGeometry = new THREE.BoxGeometry(0.8, 1, 0.4);
        const lockBodyMaterial = new THREE.MeshPhongMaterial({
          color: new THREE.Color(color),
          transparent: true,
          opacity: 0.8,
          shininess: 100
        });
        const lockBody = new THREE.Mesh(lockBodyGeometry, lockBodyMaterial);
        
        // Lock shackle (the U-shaped part)
        const lockShackleGeometry = new THREE.TorusGeometry(0.3, 0.1, 16, 32, Math.PI);
        const lockShackleMaterial = new THREE.MeshPhongMaterial({
          color: new THREE.Color(color).offsetHSL(0.05, 0, 0.1),
          transparent: true,
          opacity: 0.8,
          shininess: 100
        });
        const lockShackle = new THREE.Mesh(lockShackleGeometry, lockShackleMaterial);
        lockShackle.position.y = 0.6;
        lockShackle.rotation.x = Math.PI / 2;
        
        // Lock keyhole
        const keyholeGeometry = new THREE.CircleGeometry(0.1, 16);
        const keyholeMaterial = new THREE.MeshBasicMaterial({ color: 0x333333 });
        const keyhole = new THREE.Mesh(keyholeGeometry, keyholeMaterial);
        keyhole.position.z = 0.21;
        
        lockGroup.add(lockBody);
        lockGroup.add(lockShackle);
        lockGroup.add(keyhole);
        
        return lockGroup;
      };
      
      // Add a key shape
      const createKeyShape = () => {
        const keyGroup = new THREE.Group();
        
        // Key handle (circle)
        const handleGeometry = new THREE.TorusGeometry(0.3, 0.08, 16, 32);
        const handleMaterial = new THREE.MeshPhongMaterial({
          color: new THREE.Color(color).offsetHSL(0.1, 0, 0),
          transparent: true,
          opacity: 0.7,
          shininess: 100
        });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        
        // Key shaft
        const shaftGeometry = new THREE.BoxGeometry(1, 0.1, 0.1);
        const shaftMaterial = new THREE.MeshPhongMaterial({
          color: new THREE.Color(color).offsetHSL(0.15, 0, 0),
          transparent: true,
          opacity: 0.7,
          shininess: 100
        });
        const shaft = new THREE.Mesh(shaftGeometry, shaftMaterial);
        shaft.position.x = 0.5;
        
        // Key teeth
        const teethGeometry = new THREE.BoxGeometry(0.1, 0.2, 0.1);
        const teethMaterial = new THREE.MeshPhongMaterial({
          color: new THREE.Color(color).offsetHSL(0.2, 0, 0),
          transparent: true,
          opacity: 0.7,
          shininess: 100
        });
        
        // Add teeth to the key
        const teethPositions = [0.3, 0.5, 0.7, 0.9];
        teethPositions.forEach(pos => {
          const tooth = new THREE.Mesh(teethGeometry, teethMaterial);
          tooth.position.set(pos, -0.15, 0);
          keyGroup.add(tooth);
        });
        
        keyGroup.add(handle);
        keyGroup.add(shaft);
        
        return keyGroup;
      };
      
      // Add shield shape for security concept
      const createShieldShape = () => {
        // Create shield shape 
        const shieldShape = new THREE.Shape();
        
        shieldShape.moveTo(0, 1);
        shieldShape.bezierCurveTo(0.5, 0.9, 0.8, 0.8, 0.8, 0);
        shieldShape.lineTo(0, -0.5);
        shieldShape.lineTo(-0.8, 0);
        shieldShape.bezierCurveTo(-0.8, 0.8, -0.5, 0.9, 0, 1);
        
        const extrudeSettings = {
          depth: 0.2,
          bevelEnabled: true,
          bevelSegments: 2,
          bevelSize: 0.05,
          bevelThickness: 0.05
        };
        
        const shieldGeometry = new THREE.ExtrudeGeometry(shieldShape, extrudeSettings);
        const shieldMaterial = new THREE.MeshPhongMaterial({
          color: new THREE.Color(color).offsetHSL(0.3, 0, 0),
          transparent: true,
          opacity: 0.7,
          shininess: 100,
          flatShading: true
        });
        
        const shield = new THREE.Mesh(shieldGeometry, shieldMaterial);
        shield.scale.set(0.7, 0.7, 0.7);
        
        return shield;
      };
      
      // Standard geometries mixed with security themed ones
      const geometries = [
        createLockShape(),
        createKeyShape(),
        createShieldShape(),
        new THREE.Mesh(
          new THREE.OctahedronGeometry(0.7, 0),
          new THREE.MeshPhongMaterial({
            color: new THREE.Color(color).offsetHSL(0.4, 0, 0),
            transparent: true,
            opacity: 0.7,
            shininess: 100,
            flatShading: true
          })
        ),
        new THREE.Mesh(
          new THREE.TetrahedronGeometry(0.7, 0),
          new THREE.MeshPhongMaterial({
            color: new THREE.Color(color).offsetHSL(0.5, 0, 0),
            transparent: true,
            opacity: 0.7,
            shininess: 100,
            flatShading: true
          })
        )
      ];
      
      // Remove old objects
      while (objects.length) {
        const obj = objects.pop();
        if (obj) scene.remove(obj);
      }
      
      // Calculate how many objects to create based on screen size
      const numObjects = Math.max(10, Math.min(18, Math.floor(window.innerWidth / 120)));
      
      for (let i = 0; i < numObjects; i++) {
        // Select a geometry or group
        const randomGeom = geometries[Math.floor(Math.random() * geometries.length)];
        let object;
        
        if (randomGeom instanceof THREE.Mesh) {
          // If it's a basic mesh, clone it
          object = randomGeom.clone();
        } else {
          // If it's a group (lock or key), clone the group
          object = randomGeom.clone();
        }
        
        // Random position
        object.position.set(
          (Math.random() - 0.5) * 15,
          (Math.random() - 0.5) * 15,
          (Math.random() - 3) * 5
        );
        
        // Random rotation
        object.rotation.set(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        );
        
        // Random scale between 0.4 and 1
        const scale = 0.5 + Math.random() * 0.5;
        object.scale.set(scale, scale, scale);
        
        // Store initial rotation for animation
        (object as any).initialRotation = {
          x: object.rotation.x,
          y: object.rotation.y,
          z: object.rotation.z
        };
        
        // Store random rotation speed
        (object as any).rotationSpeed = {
          x: (Math.random() - 0.5) * 0.01,
          y: (Math.random() - 0.5) * 0.01,
          z: (Math.random() - 0.5) * 0.01
        };
        
        scene.add(object);
        objects.push(object as THREE.Mesh);
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
      objects.forEach((obj) => {
        // Base rotation
        obj.rotation.x += (obj as any).rotationSpeed.x;
        obj.rotation.y += (obj as any).rotationSpeed.y;
        obj.rotation.z += (obj as any).rotationSpeed.z;
        
        // Mouse influence
        obj.rotation.x += mouseY * 0.01;
        obj.rotation.y += mouseX * 0.01;
        
        // Apply subtle position changes based on mouse
        obj.position.x += mouseX * 0.005;
        obj.position.y += mouseY * 0.005;
        
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
