import React from 'react';
import { cn } from '@/lib/utils';
interface GridSkeletonProps {
  count?: number;
  className?: string;
}
export function GridSkeleton({ count = 8, className }: GridSkeletonProps) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="aspect-[9/16] rounded-xl bg-white/5 animate-pulse border border-white/5 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3 space-y-2">
            <div className="h-3 w-1/2 bg-white/10 rounded" />
            <div className="flex justify-between">
               <div className="h-2 w-1/4 bg-white/10 rounded" />
               <div className="h-2 w-1/4 bg-white/10 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}