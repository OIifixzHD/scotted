import React from 'react';
import { CheckCircle2, Shield, Zap, Gem, Flame, Sparkles, Cpu, Ghost } from 'lucide-react';
import { cn } from '@/lib/utils';
export function getBadgeIcon(badge?: string, className?: string) {
  const baseClass = cn("w-4 h-4", className);
  switch (badge) {
    case 'verified-pro': return <CheckCircle2 className={cn(baseClass, "text-blue-400 fill-blue-400/10")} />;
    case 'owner': return <Shield className={cn(baseClass, "text-yellow-400 fill-yellow-400/10")} />;
    case 'ultra-verified': return <Zap className={cn(baseClass, "text-cyan-400 fill-cyan-400/10")} />;
    case 'crystal': return <Gem className={cn(baseClass, "text-indigo-400 fill-indigo-400/10")} />;
    case 'magma': return <Flame className={cn(baseClass, "text-orange-500 fill-orange-500/10")} />;
    case 'holographic': return <Sparkles className={cn(baseClass, "text-pink-400 fill-pink-400/10")} />;
    case 'steampunk': return <Cpu className={cn(baseClass, "text-amber-600 fill-amber-600/10")} />;
    case 'phantom': return <Ghost className={cn(baseClass, "text-slate-400 fill-slate-400/10")} />;
    default: return null;
  }
}