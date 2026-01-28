import React, { useEffect, useRef } from 'react';
interface ConfettiProps {
  active: boolean;
  duration?: number;
}
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
}
const COLORS = ['#7c3aed', '#2dd4bf', '#f472b6', '#fbbf24', '#ffffff'];
export function Confetti({ active }: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const animationId = useRef<number | null>(null);
  useEffect(() => {
    if (!active) {
      if (animationId.current) {
        cancelAnimationFrame(animationId.current);
        animationId.current = null;
      }
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Resize canvas to full screen
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    // Initialize particles (Explosion from center)
    const createParticles = () => {
      const particleCount = 150;
      const newParticles: Particle[] = [];
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 15 + 5;
        newParticles.push({
          x: centerX,
          y: centerY,
          vx: Math.cos(angle) * velocity,
          vy: Math.sin(angle) * velocity,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          alpha: 1,
          size: Math.random() * 8 + 4,
          rotation: Math.random() * 360,
          rotationSpeed: Math.random() * 10 - 5,
        });
      }
      particles.current = newParticles;
    };
    createParticles();
    // Animation Loop
    const animate = () => {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const activeParticles = particles.current.filter(p => p.alpha > 0.01);
      activeParticles.forEach(p => {
        // Physics
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.5; // Gravity
        p.vx *= 0.96; // Air resistance
        p.vy *= 0.96;
        p.alpha -= 0.01; // Fade out
        p.rotation += p.rotationSpeed;
        // Draw
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      });
      particles.current = activeParticles;
      if (activeParticles.length > 0) {
        animationId.current = requestAnimationFrame(animate);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };
    animate();
    return () => {
      window.removeEventListener('resize', resize);
      if (animationId.current) {
        cancelAnimationFrame(animationId.current);
      }
    };
  }, [active]);
  if (!active) return null;
  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[100]"
      style={{ width: '100%', height: '100%' }}
    />
  );
}