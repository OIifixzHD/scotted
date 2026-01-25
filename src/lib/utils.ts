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
    case 'rainbow-ring': return 'ring-4 ring-transparent bg-gradient-to-r from-red-500 via-green-500 to-blue-500 bg-[length:200%_200%] animate-gradient-xy p-[2px]';
    case 'cyber-glitch': return 'ring-4 ring-cyan-400 shadow-[2px_2px_0px_rgba(255,0,0,0.8),-2px_-2px_0px_rgba(0,0,255,0.8)]';
    case 'verified-pro': return 'ring-4 ring-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.6)] border-2 border-white';
    // New Badges
    case 'owner': return 'ring-4 ring-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.6)] border-2 border-amber-200';
    case 'ultra-verified': return 'ring-4 ring-cyan-500 shadow-[0_0_25px_rgba(6,182,212,0.8)] border-2 border-white';
    default: return 'border-4 border-background';
  }
};
export const getBannerStyle = (style?: string) => {
  switch (style) {
    case 'cosmic': return 'bg-gradient-to-r from-slate-900 via-purple-900 to-black';
    case 'neon': return 'bg-gradient-to-r from-fuchsia-600 via-purple-600 to-cyan-600';
    case 'sunset': return 'bg-gradient-to-r from-orange-500 via-red-500 to-purple-600';
    case 'ocean': return 'bg-gradient-to-r from-blue-900 via-teal-800 to-emerald-900';
    case 'midnight': return 'bg-gradient-to-b from-gray-900 to-black';
    case 'default':
    default: return 'bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900';
  }
};
export function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}