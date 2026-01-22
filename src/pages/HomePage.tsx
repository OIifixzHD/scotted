import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { FeedContainer } from '@/components/feed/FeedContainer';
import { ThemeToggle } from '@/components/ThemeToggle';
export function HomePage() {
  return (
    <AppLayout container={false} className="bg-black">
      <div className="relative h-full w-full max-w-md mx-auto bg-black shadow-2xl overflow-hidden">
        {/* Header Overlay (Mobile) */}
        <div className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-center md:hidden pointer-events-none">
            <div className="flex gap-4 text-white font-semibold text-shadow pointer-events-auto">
                <button className="opacity-60 hover:opacity-100 transition-opacity">Following</button>
                <div className="w-[1px] h-4 bg-white/40 my-auto"></div>
                <button className="opacity-100 border-b-2 border-white pb-0.5">For You</button>
            </div>
        </div>
        <FeedContainer />
        {/* Theme Toggle hidden but accessible if needed, mostly forcing dark mode */}
        <div className="hidden">
            <ThemeToggle />
        </div>
      </div>
    </AppLayout>
  );
}