import React, { useState } from 'react';
import { FeedContainer } from '@/components/feed/FeedContainer';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
export function HomePage() {
  const [activeTab, setActiveTab] = useState<'foryou' | 'following'>('foryou');
  const { user } = useAuth();
  const handleTabChange = (tab: 'foryou' | 'following') => {
    if (tab === 'following' && !user) {
      toast.error("Please log in to see your following feed");
      return;
    }
    setActiveTab(tab);
  };
  return (
    <div className="h-full w-full bg-black">
      <div className="relative h-full w-full max-w-md mx-auto bg-black shadow-2xl overflow-hidden">
        {/* Header Overlay (Tabs) */}
        <div className="absolute top-0 left-0 right-0 z-20 p-4 flex justify-center pointer-events-none">
            <div className="flex gap-4 text-white font-semibold text-shadow pointer-events-auto">
                <button 
                    onClick={() => handleTabChange('following')}
                    className={cn(
                        "transition-all duration-200 hover:opacity-100",
                        activeTab === 'following' 
                            ? "opacity-100 border-b-2 border-white pb-0.5" 
                            : "opacity-60"
                    )}
                >
                    Following
                </button>
                <div className="w-[1px] h-4 bg-white/40 my-auto"></div>
                <button 
                    onClick={() => handleTabChange('foryou')}
                    className={cn(
                        "transition-all duration-200 hover:opacity-100",
                        activeTab === 'foryou' 
                            ? "opacity-100 border-b-2 border-white pb-0.5" 
                            : "opacity-60"
                    )}
                >
                    For You
                </button>
            </div>
        </div>
        <FeedContainer 
            key={activeTab} // Force re-mount on tab change
            endpoint={activeTab === 'following' ? '/api/feed/following' : '/api/feed'} 
        />
        {/* Theme Toggle hidden but accessible if needed */}
        <div className="hidden">
            <ThemeToggle />
        </div>
      </div>
    </div>
  );
}