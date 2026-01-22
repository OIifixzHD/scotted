import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Music2, Volume2, VolumeX, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Post } from '@shared/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
interface VideoCardProps {
  post: Post;
  isActive: boolean;
  isMuted: boolean;
  toggleMute: () => void;
}
export function VideoCard({ post, isActive, isMuted, toggleMute }: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  // Initialize liked state from local storage
  useEffect(() => {
    const storedLike = localStorage.getItem(`liked_post_${post.id}`);
    if (storedLike === 'true') {
      setIsLiked(true);
    }
    setLikeCount(post.likes);
  }, [post.id, post.likes]);
  // Handle Play/Pause based on active state
  useEffect(() => {
    if (isActive) {
      const playPromise = videoRef.current?.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch((error) => {
            console.warn("Autoplay prevented:", error);
            setIsPlaying(false);
          });
      }
    } else {
      videoRef.current?.pause();
      setIsPlaying(false);
    }
  }, [isActive]);
  const handleLike = async () => {
    if (isLiked) return; // Prevent double liking for this demo (or implement unlike)
    // Optimistic Update
    setIsLiked(true);
    setLikeCount(prev => prev + 1);
    setShowHeartAnimation(true);
    setTimeout(() => setShowHeartAnimation(false), 800);
    // Persist locally
    localStorage.setItem(`liked_post_${post.id}`, 'true');
    // API Call
    try {
      await api(`/api/posts/${post.id}/like`, { method: 'POST' });
    } catch (error) {
      console.error('Failed to like post:', error);
      // Revert on error
      setIsLiked(false);
      setLikeCount(prev => prev - 1);
      localStorage.removeItem(`liked_post_${post.id}`);
      toast.error('Failed to like post');
    }
  };
  const handleDoubleTap = () => {
    if (!isLiked) handleLike();
    else {
        setShowHeartAnimation(true);
        setTimeout(() => setShowHeartAnimation(false), 800);
    }
  };
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };
  return (
    <div className="relative w-full h-full max-w-md mx-auto bg-black snap-start shrink-0 overflow-hidden md:rounded-xl border border-white/5 shadow-2xl">
      {/* Video Player */}
      <div 
        className="absolute inset-0 cursor-pointer"
        onClick={togglePlay}
        onDoubleClick={handleDoubleTap}
      >
        <video
          ref={videoRef}
          src={post.videoUrl}
          className="w-full h-full object-cover"
          loop
          muted={isMuted}
          playsInline
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80 pointer-events-none" />
        {/* Play/Pause Indicator */}
        {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20">
                <Play className="w-16 h-16 text-white/80 fill-white/80" />
            </div>
        )}
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
      {/* Right Sidebar Actions */}
      <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6 z-20">
        <div className="flex flex-col items-center gap-1">
            <div className="relative">
                <Avatar className="w-12 h-12 border-2 border-white shadow-lg">
                    <AvatarImage src={post.user?.avatar} />
                    <AvatarFallback>{post.user?.name?.substring(0, 2) ?? 'U'}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-red-500 rounded-full p-0.5">
                    <div className="w-3 h-3 bg-white rounded-full flex items-center justify-center">
                        <span className="text-[10px] font-bold text-red-500">+</span>
                    </div>
                </div>
            </div>
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
        <button className="flex flex-col items-center gap-1 group">
          <div className="p-3 rounded-full bg-black/20 backdrop-blur-sm text-white transition-all duration-200 group-hover:bg-black/40 group-active:scale-90">
            <MessageCircle className="w-7 h-7 fill-white/10" />
          </div>
          <span className="text-xs font-medium text-white text-shadow">{post.comments}</span>
        </button>
        <button className="flex flex-col items-center gap-1 group">
          <div className="p-3 rounded-full bg-black/20 backdrop-blur-sm text-white transition-all duration-200 group-hover:bg-black/40 group-active:scale-90">
            <Share2 className="w-7 h-7" />
          </div>
          <span className="text-xs font-medium text-white text-shadow">{post.shares}</span>
        </button>
      </div>
      {/* Bottom Info Area */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 z-10 bg-gradient-to-t from-black/90 to-transparent">
        <div className="max-w-[80%] space-y-2">
          <h3 className="text-lg font-bold text-white text-shadow hover:underline cursor-pointer">
            @{post.user?.name ?? 'unknown'}
          </h3>
          <p className="text-sm text-white/90 text-shadow-lg line-clamp-2 text-pretty">
            {post.caption}
          </p>
          <div className="flex items-center gap-2 text-white/80 text-xs font-medium mt-2">
            <Music2 className="w-3 h-3 animate-spin-slow" />
            <div className="overflow-hidden w-32">
                <p className="animate-marquee whitespace-nowrap">Original Sound - {post.user?.name} • Pulse Original Audio</p>
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
    </div>
  );
}