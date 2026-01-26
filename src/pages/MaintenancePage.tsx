import React from 'react';
import { Wrench, Clock } from 'lucide-react';
import { GlitchText } from '@/components/ui/glitch-text';
export function MaintenancePage() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-black relative overflow-hidden p-4">
      <div className="absolute inset-0 bg-gradient-to-b from-amber-900/10 to-black pointer-events-none" />
      <div className="relative z-10 max-w-md w-full text-center space-y-8">
        <div className="w-24 h-24 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto ring-4 ring-amber-500/20 animate-pulse">
          <Wrench className="w-12 h-12 text-amber-500" />
        </div>
        <div className="space-y-4">
          <GlitchText text="System Maintenance" className="text-3xl md:text-4xl font-bold tracking-tight" />
          <p className="text-muted-foreground text-lg">
            We are currently upgrading our systems to bring you a better experience.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-white/80">
          <Clock className="w-4 h-4" />
          <span>Estimated return: Shortly</span>
        </div>
      </div>
    </div>
  );
}