import React, { useEffect, useState, useRef } from 'react';
import { VideoCard } from './VideoCard';
import { FeedSkeleton } from './FeedSkeleton';
import { api } from '@/lib/api-client';
import type { Post } from '@shared/types';
export function FeedContainer() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  // Track which video is currently in view
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fetchFeed = async () => {
      try {
        setLoading(true);
        const response = await api<{ items: Post[] }>('/api/feed');
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
  }, []);
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
  return (
    <div
        ref={containerRef}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar scroll-smooth bg-black"
    >
      {posts.map((post) => (
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