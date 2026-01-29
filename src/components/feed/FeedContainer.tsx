import React, { useEffect, useState, useRef } from 'react';
import { VideoCard } from './VideoCard';
import { AudioCard } from './AudioCard';
import { FeedSkeleton } from './FeedSkeleton';
import type { Post } from '@shared/types';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Film, Plus, Users, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAudioSettings } from '@/hooks/use-audio-settings';
import { useInfiniteFeed } from '@/hooks/use-infinite-feed';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { useInView } from 'react-intersection-observer';
interface FeedContainerProps {
  endpoint?: string;
}
export function FeedContainer({ endpoint = '/api/feed' }: FeedContainerProps) {
  const { user } = useAuth();
  // Construct endpoint with userId if available
  const finalEndpoint = React.useMemo(() => {
      let url = endpoint;
      if (user) {
          const separator = url.includes('?') ? '&' : '?';
          url = `${url}${separator}userId=${user.id}`;
      }
      return url;
  }, [endpoint, user]);
  const { items: posts, loading, error, loadMore, hasMore, refresh } = useInfiniteFeed<Post>({
      endpoint: finalEndpoint,
      initialLimit: 5 // Smaller batch for faster initial load
  });
  // Track which video is currently in view
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  // Use global audio settings
  const { isMuted, volume, toggleMute, setVolume } = useAudioSettings();
  // Initialize autoplay state from localStorage
  const [autoplayEnabled] = useState(() => {
    const saved = localStorage.getItem('scotted_autoplay');
    return saved !== 'false'; // Default to true if not set
  });
  const containerRef = useRef<HTMLDivElement>(null);
  // Sentinel for infinite scroll
  const { ref: sentinelRef, inView } = useInView({
      threshold: 0.1,
      rootMargin: '400px', // Load more before reaching bottom
  });
  useEffect(() => {
      if (inView && hasMore && !loading) {
          loadMore();
      }
  }, [inView, hasMore, loading, loadMore]);
  // Intersection Observer logic for scroll snapping active video
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            const id = entry.target.getAttribute('data-id');
            if (id) setActiveVideoId(id);
          }
        });
      },
      {
        root: container,
        threshold: 0.7, // Trigger when 70% visible
      }
    );
    const elements = container.querySelectorAll('[data-id]');
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [posts]);
  // Set initial active video
  useEffect(() => {
      if (posts.length > 0 && !activeVideoId) {
          setActiveVideoId(posts[0].id);
      }
  }, [posts, activeVideoId]);
  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (posts.length === 0) return;
      // Prevent default scrolling for arrow keys
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
      } else {
        return;
      }
      const currentIndex = posts.findIndex(p => p.id === activeVideoId);
      if (currentIndex === -1) return;
      let nextIndex = currentIndex;
      if (e.key === 'ArrowDown') {
        nextIndex = Math.min(posts.length - 1, currentIndex + 1);
      } else if (e.key === 'ArrowUp') {
        nextIndex = Math.max(0, currentIndex - 1);
      }
      if (nextIndex !== currentIndex) {
        const nextId = posts[nextIndex].id;
        const element = document.querySelector(`[data-id="${nextId}"]`);
        element?.scrollIntoView({ behavior: 'smooth' });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [posts, activeVideoId]);
  const handlePostDelete = (postId: string) => {
    // We can't easily update the hook state from here without exposing a setter
    // For now, we'll just force a refresh or accept it might be stale until refresh
    refresh();
  };
  const handlePostUpdate = (updatedPost: Post) => {
    // Ideally update local state, but hook manages it. 
    // For simplicity in this phase, we rely on re-fetch or just let it be.
    // A robust implementation would expose setItems from the hook.
  };
  const handlePostHide = (postId: string) => {
    refresh();
  };
  if (loading && posts.length === 0) {
    return (
      <div className="h-full w-full bg-black py-4 md:py-8">
         <FeedSkeleton />
      </div>
    );
  }
  if (error && posts.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-background text-red-500">
        <p>Error: {error}</p>
        <Button onClick={() => refresh()} variant="outline" className="ml-4">Retry</Button>
      </div>
    );
  }
  // Empty State for Following Feed
  if (posts.length === 0 && endpoint.includes('following')) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-black p-6 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
          <Users className="w-10 h-10 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">Your Following feed is empty</h2>
          <p className="text-muted-foreground max-w-xs mx-auto">
            Follow creators to see their latest pulses here.
          </p>
        </div>
        <Button asChild variant="outline" className="border-white/10 hover:bg-white/5">
          <Link to="/discover">
            Find People to Follow
          </Link>
        </Button>
      </div>
    );
  }
  // Empty State for General Feed
  if (posts.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-black p-6 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center animate-pulse">
          <Film className="w-10 h-10 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">No Pulses Yet</h2>
          <p className="text-muted-foreground max-w-xs mx-auto">
            The feed is quiet. Be the first to start the trend and share your vibe!
          </p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90 shadow-glow">
          <Link to="/upload">
            <Plus className="w-4 h-4 mr-2" />
            Create Pulse
          </Link>
        </Button>
      </div>
    );
  }
  const activeIndex = posts.findIndex(p => p.id === activeVideoId);
  return (
    <div
        ref={containerRef}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar scroll-smooth bg-black overscroll-contain"
    >
      <PullToRefresh onRefresh={async () => { await refresh(); }}>
          {posts.map((post, index) => (
            <div
                key={post.id}
                data-id={post.id}
                className="h-full w-full flex items-center justify-center snap-start snap-always py-0 md:py-8"
            >
              {post.type === 'audio' ? (
                <AudioCard
                  post={post}
                  isActive={activeVideoId === post.id}
                  isMuted={isMuted}
                  volume={volume}
                  toggleMute={toggleMute}
                  onVolumeChange={setVolume}
                  onDelete={() => handlePostDelete(post.id)}
                  onUpdate={handlePostUpdate}
                  onHide={() => handlePostHide(post.id)}
                  autoplayEnabled={autoplayEnabled}
                />
              ) : (
                <VideoCard
                  post={post}
                  isActive={activeVideoId === post.id}
                  isMuted={isMuted}
                  volume={volume}
                  toggleMute={toggleMute}
                  onVolumeChange={setVolume}
                  onDelete={() => handlePostDelete(post.id)}
                  onUpdate={handlePostUpdate}
                  onHide={() => handlePostHide(post.id)}
                  shouldPreload={index === activeIndex + 1}
                  autoplayEnabled={autoplayEnabled}
                />
              )}
            </div>
          ))}
          {/* Sentinel for infinite scroll */}
          <div ref={sentinelRef} className="h-20 flex items-center justify-center snap-start w-full">
            {loading && hasMore ? (
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            ) : !hasMore ? (
                <p className="text-muted-foreground text-sm">You've reached the end.</p>
            ) : null}
          </div>
      </PullToRefresh>
    </div>
  );
}