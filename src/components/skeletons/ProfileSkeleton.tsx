import React from 'react';
import { GridSkeleton } from './GridSkeleton';
export function ProfileSkeleton() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10 lg:py-12">
        <div className="space-y-8">
          {/* Header Skeleton */}
          <div className="relative">
            {/* Banner */}
            <div className="h-48 md:h-64 w-full rounded-2xl bg-white/5 animate-pulse border border-white/5" />
            {/* Info */}
            <div className="px-4 md:px-8 pb-4">
              <div className="relative -mt-16 mb-4 flex flex-col md:flex-row md:items-end gap-4 md:gap-8">
                {/* Avatar */}
                <div className="w-32 h-32 rounded-full bg-black p-1 shrink-0">
                  <div className="w-full h-full rounded-full bg-white/10 animate-pulse border-4 border-black" />
                </div>
                {/* Name & Actions */}
                <div className="flex-1 space-y-2 pt-2 md:pt-0 w-full">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2">
                      <div className="h-8 w-48 bg-white/10 rounded animate-pulse" />
                      <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
                    </div>
                    <div className="flex gap-3">
                      <div className="h-10 w-24 bg-white/10 rounded animate-pulse" />
                      <div className="h-10 w-24 bg-white/10 rounded animate-pulse" />
                      <div className="h-10 w-10 bg-white/10 rounded animate-pulse" />
                    </div>
                  </div>
                </div>
              </div>
              {/* Bio & Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-6">
                <div className="md:col-span-2 space-y-4">
                  <div className="h-4 w-full bg-white/10 rounded animate-pulse" />
                  <div className="h-4 w-2/3 bg-white/10 rounded animate-pulse" />
                  <div className="flex gap-4 mt-2">
                    <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
                    <div className="h-4 w-32 bg-white/10 rounded animate-pulse" />
                  </div>
                </div>
                <div className="flex items-center justify-start md:justify-end gap-8">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-1">
                      <div className="h-6 w-12 bg-white/10 rounded animate-pulse" />
                      <div className="h-3 w-16 bg-white/10 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          {/* Tabs Skeleton */}
          <div className="space-y-6">
            <div className="flex gap-8 border-b border-white/10 pb-px">
              <div className="h-10 w-24 bg-white/10 rounded-t animate-pulse" />
              <div className="h-10 w-24 bg-white/5 rounded-t animate-pulse" />
            </div>
            <GridSkeleton count={8} />
          </div>
        </div>
      </div>
    </div>
  );
}