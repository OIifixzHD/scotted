import React, { useState, useEffect } from 'react';
import Masonry from 'react-masonry-css';
import { Play, Heart, Eye, Music2, Loader2, Pin } from 'lucide-react';
import type { Post } from '@shared/types';
import { cn } from '@/lib/utils';
import { getFilterClass } from '@/lib/filters';
import { useInView } from 'react-intersection-observer';
interface VideoGridProps {
  posts: Post[];
  className?: string;
  onVideoClick?: (post: Post) => void;
  onLoadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
  pinnedPostIds?: string[];
}
export function VideoGrid({ posts, className, onVideoClick, onLoadMore, hasMore, loading, pinnedPostIds }: VideoGridProps) {
  const breakpointColumnsObj = {
    default: 4,
    1280: 3,
    1024: 3,
    768: 2,
    640: 1
  };
  const { ref: sentinelRef, inView } = useInView({
      threshold: 0.1,
      rootMargin: '200px',
  });
  useEffect(() => {
      if (inView && hasMore && !loading && onLoadMore) {
          onLoadMore();
      }
  }, [inView, hasMore, loading, onLoadMore]);
  if (!posts || posts.length === 0) {
    if (loading) {
        return (
            <div className="w-full py-20 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }
    return (
      <div className="w-full py-20 text-center text-muted-foreground">
        <p>No videos found.</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col w-full">
        <Masonry
          breakpointCols={breakpointColumnsObj}
          className={cn("flex w-auto -ml-4", className)}
          columnClassName="pl-4 bg-clip-padding"
        >
          {posts.map((post) => (
            <GridItem
                key={post.id}
                post={post}
                onClick={() => onVideoClick?.(post)}
                isPinned={pinnedPostIds?.includes(post.id)}
            />
          ))}
        </Masonry>
        {/* Sentinel */}
        {onLoadMore && (
            <div ref={sentinelRef} className="w-full py-8 flex justify-center">
                {loading && hasMore && <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />}
            </div>
        )}
    </div>
  );
}
function GridItem({ post, onClick, isPinned }: { post: Post, onClick?: () => void, isPinned?: boolean }) {
  const [isHovered, setIsHovered] = useState(false);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const handleMouseEnter = () => {
    setIsHovered(true);
    if (post.type !== 'audio') {
        videoRef.current?.play().catch(() => {});
    }
  };
  const handleMouseLeave = () => {
    setIsHovered(false);
    if (post.type !== 'audio') {
        videoRef.current?.pause();
        if (videoRef.current) videoRef.current.currentTime = 0;
    }
  };
  return (
    <div
      className={cn(
        "relative mb-4 rounded-xl overflow-hidden bg-card border border-white/5 group cursor-pointer",
        post.type === 'audio' ? "aspect-square" : "aspect-[9/16]"
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
    >
      {post.type === 'audio' ? (
        <>
          <img
            src={post.coverArtUrl || post.user?.avatar}
            alt={post.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm p-1.5 rounded-full">
            <Music2 className="w-4 h-4 text-white" />
          </div>
        </>
      ) : (
        <video
          ref={videoRef}
          src={post.videoUrl}
          className={cn("w-full h-full object-cover", getFilterClass(post.filter))}
          muted
          loop
          playsInline
        />
      )}
      {/* Pinned Badge */}
      {isPinned && (
        <div className="absolute top-2 left-2 bg-primary/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-lg z-20 border border-white/20">
            <Pin className="w-3 h-3 fill-white" />
            Pinned
        </div>
      )}
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-300" />
      {/* Stats Overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-100">
        <div className="flex items-center justify-between text-white text-xs font-medium">
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3 fill-white/50" />
            <span>{post.views || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <Heart className="w-3 h-3" />
            <span>{post.likes}</span>
          </div>
        </div>
      </div>
      {/* Play Icon on Hover */}
      <div className={cn(
        "absolute inset-0 flex items-center justify-center transition-opacity duration-300",
        isHovered ? "opacity-100" : "opacity-0"
      )}>
        <Play className="w-10 h-10 text-white/80 fill-white/80 drop-shadow-lg" />
      </div>
    </div>
  );
}