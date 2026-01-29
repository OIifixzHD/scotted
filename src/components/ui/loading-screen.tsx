import React from 'react';
import { Zap } from 'lucide-react';
export function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-background z-[100] flex flex-col items-center justify-center">
      <div className="relative">
        {/* Pulsing Background */}
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-ping" />
        {/* Logo Container */}
        <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600 to-teal-400 flex items-center justify-center shadow-glow animate-pulse">
          <Zap className="w-10 h-10 text-white fill-white" />
        </div>
      </div>
      <div className="mt-8 space-y-2 text-center">
        <h2 className="text-2xl font-bold font-display text-white tracking-tight animate-fade-in">
          Scotted
        </h2>
        <p className="text-muted-foreground text-sm animate-pulse">
          Initializing...
        </p>
      </div>
    </div>
  );
}