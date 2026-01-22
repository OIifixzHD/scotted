import React from 'react';
export function FeedSkeleton() {
  return (
    <div className="relative w-full h-full max-w-md mx-auto bg-card/20 animate-pulse md:rounded-xl border border-white/5 overflow-hidden">
      {/* Video Placeholder Background */}
      <div className="absolute inset-0 bg-white/5" />
      {/* Right Sidebar Actions */}
      <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6 z-20">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full bg-white/10" />
            <div className="w-8 h-3 rounded bg-white/10" />
          </div>
        ))}
      </div>
      {/* Bottom Info Area */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 z-10 bg-gradient-to-t from-black/90 to-transparent">
        <div className="max-w-[80%] space-y-3">
          {/* User Name */}
          <div className="h-6 w-32 bg-white/10 rounded" />
          {/* Caption Line 1 */}
          <div className="h-4 w-full bg-white/10 rounded" />
          {/* Caption Line 2 */}
          <div className="h-4 w-2/3 bg-white/10 rounded" />
          {/* Music Info */}
          <div className="flex items-center gap-2 mt-2">
             <div className="w-4 h-4 rounded-full bg-white/10" />
             <div className="h-3 w-24 bg-white/10 rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}