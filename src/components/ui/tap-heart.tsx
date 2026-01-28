import React from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
interface TapHeartProps {
  id: string;
  x: number;
  y: number;
  rotation: number;
  onComplete: (id: string) => void;
}
export function TapHeart({ id, x, y, rotation, onComplete }: TapHeartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, rotate: rotation }}
      animate={{ 
        opacity: [0, 1, 1, 0], 
        scale: [0.5, 1.5, 1.5, 0.5],
        y: -100 
      }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      onAnimationComplete={() => onComplete(id)}
      className="absolute pointer-events-none z-50 drop-shadow-lg"
      style={{ 
        left: x, 
        top: y,
        // Center the heart on the tap coordinates
        marginLeft: -24, 
        marginTop: -24 
      }}
    >
      <Heart className="w-12 h-12 fill-red-500 text-red-500" />
    </motion.div>
  );
}