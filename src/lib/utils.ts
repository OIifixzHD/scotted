import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export const getDecorationClass = (decoration?: string) => {
  switch (decoration) {
    case 'gold-border': return 'ring-4 ring-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.5)]';
    case 'neon-glow': return 'ring-4 ring-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.8)]';
    case 'blue-fire': return 'ring-4 ring-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.8)]';
    case 'rainbow-ring': return 'ring-4 ring-transparent bg-gradient-to-r from-red-500 via-green-500 to-blue-500 bg-[length:200%_200%] animate-gradient-xy p-[2px]'; // Simplified for ring effect simulation
    case 'cyber-glitch': return 'ring-4 ring-cyan-400 shadow-[2px_2px_0px_rgba(255,0,0,0.8),-2px_-2px_0px_rgba(0,0,255,0.8)]';
    case 'verified-pro': return 'ring-4 ring-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.6)] border-2 border-white';
    default: return 'border-4 border-background';
  }
};