import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, AlertTriangle } from 'lucide-react';
export function NotFoundPage() {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-black relative overflow-hidden p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-purple-900/10 to-black pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="relative z-10 text-center space-y-8 max-w-md mx-auto">
        <div className="relative inline-block">
          <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/10 tracking-tighter select-none">
            404
          </h1>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-2 bg-primary/50 blur-xl" />
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 text-primary animate-pulse">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-mono text-sm tracking-widest uppercase">System Error</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-white">
            You've ventured into the void
          </h2>
          <p className="text-muted-foreground">
            The signal you're looking for has been lost in the static. Let's get you back to the feed.
          </p>
        </div>
        <Button asChild size="lg" className="bg-primary hover:bg-primary/90 shadow-glow group">
          <Link to="/">
            <Home className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
            Return Home
          </Link>
        </Button>
      </div>
    </div>
  );
}