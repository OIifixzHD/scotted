import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
export function formatBytes(bytes: number, decimals = 0) {
  if (!+bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}
export function getDecorationClass(decoration?: string) {
  switch (decoration) {
    case 'gold-border': return 'ring-4 ring-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]';
    case 'neon-glow': return 'ring-2 ring-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.8)]';
    case 'blue-fire': return 'ring-2 ring-blue-500 shadow-[0_0_25px_rgba(59,130,246,0.8)] animate-pulse';
    case 'rainbow-ring': return 'ring-4 ring-transparent bg-gradient-to-r from-red-500 via-green-500 to-blue-500 bg-[length:200%_200%] animate-gradient-xy p-[2px]';
    case 'cyber-glitch': return 'ring-2 ring-cyan-400 shadow-[2px_2px_0px_rgba(255,0,0,0.5),-2px_-2px_0px_rgba(0,255,255,0.5)]';
    case 'plasma-aura': return 'ring-2 ring-blue-500 shadow-[0_0_15px_5px_rgba(147,51,234,0.6)] animate-pulse';
    case 'glitch-ring': return 'ring-2 ring-cyan-400 shadow-[2px_0_0_rgba(255,0,0,0.8),-2px_0_0_rgba(0,255,255,0.8)]';
    case 'royal-gold': return 'ring-4 ring-yellow-500 bg-gradient-to-tr from-yellow-300 via-yellow-500 to-yellow-700 p-[2px]';
    case 'cosmic-dust': return 'ring-2 ring-transparent shadow-[0_0_10px_rgba(255,255,255,0.8),0_0_20px_rgba(255,0,255,0.6),0_0_30px_rgba(0,255,255,0.6)]';
    default: return '';
  }
}
export function getBannerStyle(style?: string) {
  switch (style) {
    case 'cosmic': return 'bg-gradient-to-r from-indigo-900 via-purple-900 to-pink-900';
    case 'neon': return 'bg-gradient-to-r from-fuchsia-600 to-cyan-600';
    case 'sunset': return 'bg-gradient-to-r from-orange-500 to-red-600';
    case 'ocean': return 'bg-gradient-to-r from-blue-600 to-teal-400';
    case 'midnight': return 'bg-gradient-to-r from-slate-900 to-slate-800';
    default: return 'bg-gradient-to-r from-purple-600 to-blue-600'; // Default
  }
}