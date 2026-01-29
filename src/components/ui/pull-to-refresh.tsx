import React, { useState, useRef, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  disabled?: boolean;
}
export function PullToRefresh({ onRefresh, children, disabled = false }: PullToRefreshProps) {
  const [startY, setStartY] = useState(0);
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const THRESHOLD = 80;
  const MAX_PULL = 120;
  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || refreshing) return;
    // Only enable pull if we are at the top of the scroll container
    // We check the window scroll or a specific container if provided via context/props
    // For simplicity, we assume window scroll or parent scroll is 0
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    // Also check if the target element is inside a scrollable container that isn't at top
    let target = e.target as HTMLElement;
    let isScrolled = false;
    while (target && target !== containerRef.current) {
        if (target.scrollTop > 0) {
            isScrolled = true;
            break;
        }
        target = target.parentElement as HTMLElement;
    }
    if (scrollTop === 0 && !isScrolled) {
        setStartY(e.touches[0].clientY);
    } else {
        setStartY(0);
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!startY || disabled || refreshing) return;
    const currentY = e.touches[0].clientY;
    const diff = currentY - startY;
    if (diff > 0) {
        // Add resistance
        const newPull = Math.min(diff * 0.5, MAX_PULL);
        setPullDistance(newPull);
        // Prevent default only if we are pulling down significantly to avoid interfering with normal scroll
        if (diff > 10 && e.cancelable) {
            // e.preventDefault(); // Chrome treats touchmove as passive by default, so this might not work without config
        }
    }
  };
  const handleTouchEnd = async () => {
    if (!startY || disabled || refreshing) return;
    if (pullDistance > THRESHOLD) {
        setRefreshing(true);
        setPullDistance(THRESHOLD); // Snap to threshold
        try {
            await onRefresh();
        } finally {
            setRefreshing(false);
            setPullDistance(0);
        }
    } else {
        setPullDistance(0);
    }
    setStartY(0);
  };
  return (
    <div 
        ref={containerRef}
        className="relative min-h-full"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
    >
        {/* Loading Indicator */}
        <div 
            className="absolute top-0 left-0 right-0 flex justify-center pointer-events-none z-50"
            style={{ 
                transform: `translateY(${pullDistance - 40}px)`,
                opacity: Math.min(pullDistance / THRESHOLD, 1),
                transition: refreshing ? 'transform 0.2s' : 'none'
            }}
        >
            <div className={cn(
                "w-10 h-10 rounded-full bg-background border border-white/10 shadow-xl flex items-center justify-center",
                refreshing && "animate-spin"
            )}>
                <Loader2 className={cn("w-5 h-5 text-primary", !refreshing && "rotate-0")} style={{ transform: `rotate(${pullDistance * 2}deg)` }} />
            </div>
        </div>
        {/* Content */}
        <div 
            style={{ 
                transform: `translateY(${pullDistance}px)`,
                transition: refreshing ? 'transform 0.2s' : 'transform 0.1s ease-out'
            }}
        >
            {children}
        </div>
    </div>
  );
}