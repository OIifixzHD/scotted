import React from 'react';
import { motion } from 'framer-motion';
const PARTICLE_COUNT = 24;
export function LikeExplosion() {
  // Generate particles with random properties
  // We use useMemo in a real app, but since this component is mounted/unmounted 
  // for the effect, calculating on render is acceptable and ensures randomness each time.
  const particles = Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
    // Distribute angles but add some randomness
    const angleBase = (i / PARTICLE_COUNT) * 360;
    const angleRandom = Math.random() * 20 - 10;
    const angle = angleBase + angleRandom;
    // Random distance from center
    const distance = Math.random() * 120 + 60; // 60px to 180px radius
    // Random colors from the brand palette + heart red
    const colors = [
      '#ef4444', // Red-500 (Heart)
      '#7c3aed', // Violet-600 (Primary)
      '#2dd4bf', // Teal-400 (Secondary)
      '#f472b6', // Pink-400
      '#ffffff', // White
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];
    // Random size
    const size = Math.random() * 8 + 4;
    return {
      id: i,
      angle,
      distance,
      color,
      size,
      delay: Math.random() * 0.1, // Slight stagger
    };
  });
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
          animate={{
            x: Math.cos((p.angle * Math.PI) / 180) * p.distance,
            y: Math.sin((p.angle * Math.PI) / 180) * p.distance,
            scale: [0, 1.2, 0],
            opacity: [0, 1, 0],
          }}
          transition={{ 
            duration: 0.8, 
            ease: "easeOut",
            delay: p.delay 
          }}
          style={{
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: '50%',
            position: 'absolute',
            boxShadow: `0 0 10px ${p.color}`,
          }}
        />
      ))}
      {/* Central burst ring */}
      <motion.div
        initial={{ scale: 0, opacity: 0.8, borderWidth: 10 }}
        animate={{ scale: 2, opacity: 0, borderWidth: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="absolute w-20 h-20 rounded-full border-white/50"
      />
    </div>
  );
}