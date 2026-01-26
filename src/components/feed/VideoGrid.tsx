import React, { useState } from 'react';
import Masonry from 'react-masonry-css';
import { Play, Heart, Eye, Music2 } from 'lucide-react';
import type { Post } from '@shared/types';
import { cn } from '@/lib/utils';
import { getFilterClass } from '@/lib/filters';
interface VideoGridProps {
  posts: Post[];
  className?: string;
  onVideoClick?: (post: Post) => void;
}
export function VideoGrid({ posts, className, onVideoClick }: VideoGridProps) {
  const breakpointColumnsObj = {
    default: 4,
    1280: 3,
    1024: 3,
    768: 2,
    640: 1
  };
  if (!posts || posts.length === 0) {
    return (
      <div className="w-full py-20 text-center text-muted-foreground">
        <p>No videos found.</p>
      </div>
    );
  }
  return (
    <Masonry
      breakpointCols={breakpointColumnsObj}
      className={cn("flex w-auto -ml-4", className)}
      columnClassName="pl-4 bg-clip-padding"
    >
      {posts.map((post) => (
        <GridItem key={post.id} post={post} onClick={() => onVideoClick?.(post)} />
      ))}
    </Masonry>
  );
}
function GridItem({ post, onClick }: { post: Post, onClick?: () => void }) {
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