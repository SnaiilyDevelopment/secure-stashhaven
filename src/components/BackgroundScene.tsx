
import React, { useEffect, useRef } from 'react';

const BackgroundScene: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    
    // Set canvas size to match window
    const setCanvasSize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
    };
    
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    // Define leaf objects
    const leaves: Leaf[] = [];
    const leafCount = Math.floor(width * height / 20000); // Adjust density based on screen size
    
    class Leaf {
      x: number;
      y: number;
      size: number;
      rotation: number;
      rotationSpeed: number;
      color: string;
      opacity: number;
      speedY: number;
      speedX: number;
      wobbleSpeed: number;
      wobbleAmount: number;
      wobble: number;
      leafType: number;

      constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 30 + 15;
        this.rotation = Math.random() * 360;
        this.rotationSpeed = (Math.random() - 0.5) * 0.5;
        this.color = `rgba(${40 + Math.random() * 30}, ${160 + Math.random() * 50}, ${60 + Math.random() * 40}, 0.${Math.floor(Math.random() * 3 + 1)})`;
        this.opacity = 0.1 + Math.random() * 0.3;
        this.speedY = Math.random() * 0.5 + 0.2;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.wobbleSpeed = Math.random() * 0.05;
        this.wobbleAmount = Math.random() * 30;
        this.wobble = Math.random() * Math.PI * 2;
        this.leafType = Math.floor(Math.random() * 3);
      }

      update() {
        this.y += this.speedY;
        this.x += this.speedX + Math.sin(this.wobble) * 0.3;
        this.rotation += this.rotationSpeed;
        this.wobble += this.wobbleSpeed;

        // Reset when out of screen
        if (this.y > height + this.size) {
          this.y = -this.size;
          this.x = Math.random() * width;
        }
        
        if (this.x < -this.size) this.x = width + this.size;
        if (this.x > width + this.size) this.x = -this.size;
      }

      draw(ctx: CanvasRenderingContext2D) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate((this.rotation * Math.PI) / 180);
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        
        // Draw different leaf shapes
        switch(this.leafType) {
          case 0: // Oval leaf
            this.drawOvalLeaf(ctx);
            break;
          case 1: // Maple-like leaf
            this.drawMapleLeaf(ctx);
            break;
          case 2: // Simple rounded leaf
            this.drawRoundedLeaf(ctx);
            break;
        }
        
        ctx.restore();
      }
      
      drawOvalLeaf(ctx: CanvasRenderingContext2D) {
        const halfSize = this.size / 2;
        
        ctx.beginPath();
        ctx.ellipse(0, 0, halfSize * 0.7, halfSize, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Stem
        ctx.fillRect(-halfSize * 0.1, halfSize * 0.8, this.size * 0.2, this.size * 0.3);
        
        // Vein
        ctx.strokeStyle = `rgba(${40 + Math.random() * 30}, ${140 + Math.random() * 30}, ${60 + Math.random() * 20}, 0.5)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -halfSize * 0.8);
        ctx.lineTo(0, halfSize * 0.8);
        ctx.stroke();
      }
      
      drawMapleLeaf(ctx: CanvasRenderingContext2D) {
        const s = this.size / 2;
        
        ctx.beginPath();
        ctx.moveTo(0, -s);
        
        // Top right section
        ctx.bezierCurveTo(s * 0.3, -s, s * 0.7, -s * 0.5, s, -s * 0.3);
        ctx.bezierCurveTo(s * 0.8, -s * 0.3, s * 0.7, -s * 0.1, s * 0.9, s * 0.3);
        
        // Bottom right
        ctx.bezierCurveTo(s * 0.8, s * 0.3, s * 0.7, s * 0.8, 0, s);
        
        // Bottom left (mirror of right)
        ctx.bezierCurveTo(-s * 0.7, s * 0.8, -s * 0.8, s * 0.3, -s * 0.9, s * 0.3);
        
        // Top left
        ctx.bezierCurveTo(-s * 0.7, -s * 0.1, -s * 0.8, -s * 0.3, -s, -s * 0.3);
        ctx.bezierCurveTo(-s * 0.7, -s * 0.5, -s * 0.3, -s, 0, -s);
        
        ctx.fill();
      }
      
      drawRoundedLeaf(ctx: CanvasRenderingContext2D) {
        const s = this.size / 2;
        
        ctx.beginPath();
        ctx.moveTo(0, -s);
        
        // Draw a raindrop/teardrop shape
        ctx.bezierCurveTo(s * 0.8, -s * 0.5, s, s * 0.3, 0, s);
        ctx.bezierCurveTo(-s, s * 0.3, -s * 0.8, -s * 0.5, 0, -s);
        
        ctx.fill();
        
        // Vein
        ctx.strokeStyle = `rgba(${40 + Math.random() * 30}, ${140 + Math.random() * 30}, ${60 + Math.random() * 20}, 0.5)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, -s * 0.8);
        ctx.lineTo(0, s * 0.8);
        ctx.stroke();
      }
    }

    // Create initial leaves
    for (let i = 0; i < leafCount; i++) {
      leaves.push(new Leaf());
    }

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      // Update and draw leaves
      leaves.forEach(leaf => {
        leaf.update();
        leaf.draw(ctx);
      });

      requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', setCanvasSize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{ opacity: 0.6 }}
    />
  );
};

export default BackgroundScene;
