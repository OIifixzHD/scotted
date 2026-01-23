import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Music2, Volume2, VolumeX, Play, AlertCircle, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Post } from '@shared/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { ShareDialog } from './ShareDialog';
import { CommentsSheet } from './CommentsSheet';
import { useAuth } from '@/context/AuthContext';
interface VideoCardProps {
  post: Post;
  isActive: boolean;
  isMuted: boolean;
  toggleMute: () => void;
}
export function VideoCard({ post, isActive, isMuted, toggleMute }: VideoCardProps) {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  // Initialize state from props
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [commentCount, setCommentCount] = useState(post.comments);
  const [viewCount, setViewCount] = useState(post.views || 0);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showUnmuteHint, setShowUnmuteHint] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const hasViewedRef = useRef(false);
  // Sync with prop updates and user auth state
  useEffect(() => {
    if (user && post.likedBy) {
      setIsLiked(post.likedBy.includes(user.id));
    } else {
      setIsLiked(false);
    }
    setLikeCount(post.likes);
    setCommentCount(post.comments);
    setViewCount(post.views || 0);
  }, [post, user]);
  // Handle Play/Pause based on active state
  useEffect(() => {
    const video = videoRef.current;
    if (!video || hasError) return;
    if (isActive) {
      // Ensure muted state is set before playing to satisfy autoplay policies
      video.muted = isMuted;
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
            if (isMuted) {
                setShowUnmuteHint(true);
                setTimeout(() => setShowUnmuteHint(false), 3000);
            }
            // Increment view count if not already viewed in this session
            if (!hasViewedRef.current) {
                hasViewedRef.current = true;
                api<{ views: number }>(`/api/posts/${post.id}/view`, { method: 'POST' })
                    .then(res => setViewCount(res.views))
                    .catch(e => console.error("Failed to increment view", e));
            }
          })
          .catch((error) => {
            // Auto-play was prevented
            console.warn("Autoplay prevented:", error);
            setIsPlaying(false);
          });
      }
    } else {
      video.pause();
      setIsPlaying(false);
      video.currentTime = 0;
      setProgress(0);
    }
  }, [isActive, hasError, isMuted, post.id]);
  const handleLike = async () => {
    if (!user) {
      toast.error("Please log in to like posts");
      return;
    }
    // Optimistic Update
    const previousLiked = isLiked;
    const previousCount = likeCount;
    setIsLiked(!previousLiked);
    setLikeCount(prev => previousLiked ? prev - 1 : prev + 1);
    if (!previousLiked) {
      setShowHeartAnimation(true);
      setTimeout(() => setShowHeartAnimation(false), 800);
    }
    try {
      const res = await api<{ likes: number, isLiked: boolean }>(`/api/posts/${post.id}/like`, {
        method: 'POST',
        body: JSON.stringify({ userId: user.id })
      });
      // Sync with server response to be sure
      setLikeCount(res.likes);
      setIsLiked(res.isLiked);
    } catch (error) {
      console.error('Failed to toggle like:', error);
      // Revert on error
      setIsLiked(previousLiked);
      setLikeCount(previousCount);
      toast.error('Failed to update like');
    }
  };
  const handleDoubleTap = () => {
    if (!user) {
        toast.error("Please log in to like posts");
        return;
    }
    if (!isLiked) {
        handleLike();
    } else {
        setShowHeartAnimation(true);
        setTimeout(() => setShowHeartAnimation(false), 800);
    }
  };
  const togglePlay = () => {
    if (videoRef.current && !hasError) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(e => console.warn("Play failed", e));
        setIsPlaying(true);
      }
    }
  };
  const handleError = () => {
    console.error(`Video failed to load: ${post.videoUrl}`);
    setHasError(true);
    setIsPlaying(false);
  };
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const duration = videoRef.current.duration;
      if (duration > 0) {
        setProgress((current / duration) * 100);
      }
    }
  };
  return (
    <div className="relative w-full h-full max-w-md mx-auto bg-black snap-start shrink-0 overflow-hidden md:rounded-xl border border-white/5 shadow-2xl">
      {/* Video Player */}
      <div
        className="absolute inset-0 cursor-pointer bg-gray-900"
        onClick={togglePlay}
        onDoubleClick={handleDoubleTap}
      >
        {!hasError ? (
            <video
              ref={videoRef}
              src={post.videoUrl}
              className="w-full h-full object-cover"
              loop
              muted={isMuted}
              playsInline
              onError={handleError}
              onTimeUpdate={handleTimeUpdate}
            />
        ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-gray-900">
                <AlertCircle className="w-12 h-12 mb-2 opacity-50" />
                <p className="text-sm">Video unavailable</p>
            </div>
        )}
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80 pointer-events-none" />
        {/* Play/Pause Indicator */}
        {!isPlaying && !hasError && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20">
                <Play className="w-16 h-16 text-white/80 fill-white/80" />
            </div>
        )}
        {/* Unmute Hint */}
        <AnimatePresence>
            {showUnmuteHint && isPlaying && isMuted && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full pointer-events-none"
                >
                    <p className="text-white text-sm font-medium">Tap to unmute</p>
                </motion.div>
            )}
        </AnimatePresence>
        {/* Big Heart Animation */}
        <AnimatePresence>
          {showHeartAnimation && (
            <motion.div
              initial={{ scale: 0, opacity: 0, rotate: -45 }}
              animate={{ scale: 1.5, opacity: 1, rotate: 0 }}
              exit={{ scale: 0, opacity: 0, rotate: 45 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <Heart className="w-32 h-32 text-red-500 fill-red-500 drop-shadow-glow" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-30">
        <div
          className="h-full bg-primary transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
      {/* Right Sidebar Actions */}
      <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6 z-20">
        <div className="flex flex-col items-center gap-1">
            <Link to={`/profile/${post.userId}`} className="relative cursor-pointer transition-transform hover:scale-105 active:scale-95">
                <Avatar className="w-12 h-12 border-2 border-white shadow-lg">
                    <AvatarImage src={post.user?.avatar} />
                    <AvatarFallback>{post.user?.name?.substring(0, 2) ?? 'U'}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-red-500 rounded-full p-0.5">
                    <div className="w-3 h-3 bg-white rounded-full flex items-center justify-center">
                        <span className="text-[10px] font-bold text-red-500">+</span>
                    </div>
                </div>
            </Link>
        </div>
        <button onClick={handleLike} className="flex flex-col items-center gap-1 group">
          <div className={cn(
            "p-3 rounded-full bg-black/20 backdrop-blur-sm transition-all duration-200 group-hover:bg-black/40 group-active:scale-90",
            isLiked ? "text-red-500" : "text-white"
          )}>
            <Heart className={cn("w-7 h-7", isLiked && "fill-current")} />
          </div>
          <span className="text-xs font-medium text-white text-shadow">{likeCount}</span>
        </button>
        <button
          onClick={() => setIsCommentsOpen(true)}
          className="flex flex-col items-center gap-1 group"
        >
          <div className="p-3 rounded-full bg-black/20 backdrop-blur-sm text-white transition-all duration-200 group-hover:bg-black/40 group-active:scale-90">
            <MessageCircle className="w-7 h-7 fill-white/10" />
          </div>
          <span className="text-xs font-medium text-white text-shadow">{commentCount}</span>
        </button>
        <button
          onClick={() => setIsShareOpen(true)}
          className="flex flex-col items-center gap-1 group"
        >
          <div className="p-3 rounded-full bg-black/20 backdrop-blur-sm text-white transition-all duration-200 group-hover:bg-black/40 group-active:scale-90">
            <Share2 className="w-7 h-7" />
          </div>
          <span className="text-xs font-medium text-white text-shadow">{post.shares}</span>
        </button>
        {/* View Count */}
        <div className="flex flex-col items-center gap-1 group">
          <div className="p-3 rounded-full bg-black/20 backdrop-blur-sm text-white transition-all duration-200 group-hover:bg-black/40">
            <Eye className="w-7 h-7" />
          </div>
          <span className="text-xs font-medium text-white text-shadow">{viewCount}</span>
        </div>
      </div>
      {/* Bottom Info Area */}
      <div className="absolute bottom-1 left-0 right-0 p-4 pb-8 z-10 bg-gradient-to-t from-black/90 to-transparent pointer-events-none">
        <div className="max-w-[80%] space-y-2 pointer-events-auto">
          <Link to={`/profile/${post.userId}`}>
            <h3 className="text-lg font-bold text-white text-shadow hover:underline cursor-pointer inline-block">
              @{post.user?.name ?? 'unknown'}
            </h3>
          </Link>
          <p className="text-sm text-white/90 text-shadow-lg line-clamp-2 text-pretty">
            {post.caption}
          </p>
          <div className="flex items-center gap-2 text-white/80 text-xs font-medium mt-2">
            <Music2 className="w-3 h-3 animate-spin-slow" />
            <div className="overflow-hidden w-32">
                <p className="animate-marquee whitespace-nowrap">
                  Original Sound - {post.user?.name ?? 'Unknown User'} • Pulse Original Audio
                </p>
            </div>
          </div>
        </div>
      </div>
      {/* Mute Toggle */}
      <button
        onClick={(e) => { e.stopPropagation(); toggleMute(); }}
        className="absolute top-4 right-4 p-2 rounded-full bg-black/20 backdrop-blur-md text-white/80 hover:bg-black/40 transition-colors z-30"
      >
        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
      </button>
      {/* Share Dialog */}
      <ShareDialog
        open={isShareOpen}
        onOpenChange={setIsShareOpen}
        postId={post.id}
      />
      {/* Comments Sheet */}
      <CommentsSheet
        postId={post.id}
        open={isCommentsOpen}
        onOpenChange={setIsCommentsOpen}
        onCommentAdded={() => setCommentCount(prev => prev + 1)}
      />
    </div>
  );
}