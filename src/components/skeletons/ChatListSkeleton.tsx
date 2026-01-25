import React from 'react';
export function ChatListSkeleton() {
  return (
    <div className="flex flex-col">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-4 border-b border-white/5 animate-pulse"
        >
          {/* Avatar Skeleton */}
          <div className="w-10 h-10 rounded-full bg-white/10 shrink-0" />
          {/* Content Skeleton */}
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex justify-between items-baseline">
              {/* Title/Name */}
              <div className="h-4 w-24 bg-white/10 rounded" />
              {/* Timestamp */}
              <div className="h-3 w-12 bg-white/5 rounded" />
            </div>
            {/* Message Preview */}
            <div className="h-3 w-32 bg-white/5 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}