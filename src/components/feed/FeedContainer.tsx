import React, { useEffect, useState, useRef } from 'react';
import { VideoCard } from './VideoCard';
import { FeedSkeleton } from './FeedSkeleton';
import { api } from '@/lib/api-client';
import type { Post } from '@shared/types';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Film, Plus, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
interface FeedContainerProps {
  endpoint?: string;
}
export function FeedContainer({ endpoint = '/api/feed' }: FeedContainerProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Track which video is currently in view
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  useEffect(() => {
    const fetchFeed = async () => {
      try {
        setLoading(true);
        setError(null);
        let url = endpoint;
        // Append userId for personalization if logged in
        if (user) {
            const separator = url.includes('?') ? '&' : '?';
            url = `${url}${separator}userId=${user.id}`;
        }
        const response = await api<{ items: Post[] }>(url);
        setPosts(response.items);
        if (response.items.length > 0) {
            setActiveVideoId(response.items[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load feed');
      } finally {
        setLoading(false);
      }
    };
    fetchFeed();
  }, [endpoint, user]);
  // Intersection Observer logic for scroll snapping
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
    setPosts(prev => prev.filter(p => p.id !== postId));
  };
  const handlePostUpdate = (updatedPost: Post) => {
    setPosts(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
  };
  const handlePostHide = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
  };
  if (loading) {
    return (
      <div className="h-full w-full bg-black py-4 md:py-8">
         <FeedSkeleton />
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-background text-red-500">
        <p>Error: {error}</p>
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
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar scroll-smooth bg-black"
    >
      {posts.map((post, index) => (
        <div
            key={post.id}
            data-id={post.id}
            className="h-full w-full flex items-center justify-center snap-start snap-always py-4 md:py-8"
        >
          <VideoCard
            post={post}
            isActive={activeVideoId === post.id}
            isMuted={isMuted}
            toggleMute={() => setIsMuted(!isMuted)}
            onDelete={() => handlePostDelete(post.id)}
            onUpdate={handlePostUpdate}
            onHide={() => handlePostHide(post.id)}
            shouldPreload={index === activeIndex + 1}
          />
        </div>
      ))}
      {/* Loading more indicator (mock) */}
      <div className="h-20 flex items-center justify-center snap-start">
        <p className="text-muted-foreground text-sm">You've reached the end for now.</p>
      </div>
    </div>
  );
}