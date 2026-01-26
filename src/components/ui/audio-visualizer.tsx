import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
interface AudioVisualizerProps {
  isPlaying: boolean;
  className?: string;
  barCount?: number;
}
export function AudioVisualizer({ isPlaying, className, barCount = 20 }: AudioVisualizerProps) {
  return (
    <div className={cn("flex items-end justify-center gap-[2px] h-12", className)}>
      {Array.from({ length: barCount }).map((_, i) => (
        <motion.div
          key={i}
          className="w-1 bg-primary/80 rounded-t-sm"
          animate={{
            height: isPlaying 
              ? [
                  `${Math.random() * 20 + 10}%`, 
                  `${Math.random() * 50 + 50}%`, 
                  `${Math.random() * 20 + 10}%`
                ] 
              : "10%",
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
            delay: i * 0.05, // Stagger effect
          }}
          style={{
            height: "10%", 
          }}
        />
      ))}
    </div>
  );
}