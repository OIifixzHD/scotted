import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Play, Pause, Music2, MoreHorizontal, Disc } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Post } from '@shared/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { ShareDialog } from './ShareDialog';
import { CommentsSheet } from './CommentsSheet';
import { useAuth } from '@/context/AuthContext';
import { PostOptions } from './PostOptions';
import { LikeExplosion } from '@/components/ui/like-explosion';
import { Slider } from '@/components/ui/slider';
import { AudioVisualizer } from '@/components/ui/audio-visualizer';
interface AudioCardProps {
  post: Post;
  isActive: boolean;
  isMuted: boolean;
  toggleMute: () => void;
  onDelete?: () => void;
  onUpdate?: (post: Post) => void;
  onHide?: () => void;
  autoplayEnabled?: boolean;
}
export function AudioCard({
  post,
  isActive,
  isMuted,
  toggleMute,
  onDelete,
  onUpdate,
  onHide,
  autoplayEnabled = true
}: AudioCardProps) {
  const { user } = useAuth();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  // Interaction State
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [commentCount, setCommentCount] = useState(post.comments);
  const [shareCount, setShareCount] = useState(post.shares || 0);
  const [showExplosion, setShowExplosion] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  // Sync with props
  useEffect(() => {
    if (user) {
      setIsLiked(post.likedBy?.includes(user.id) || false);
    }
    setLikeCount(post.likes);
    setCommentCount(post.comments);
    setShareCount(post.shares || 0);
  }, [post, user]);
  // Playback Logic
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = isMuted;
    if (isActive && autoplayEnabled) {
      audio.play().catch(() => setIsPlaying(false));
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, [isActive, isMuted, autoplayEnabled]);
  const togglePlay = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  }, [isPlaying]);
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const curr = audioRef.current.currentTime;
      const dur = audioRef.current.duration;
      if (dur > 0) {
        setProgress((curr / dur) * 100);
        setDuration(dur);
      }
    }
  };
  const handleSeek = (val: number[]) => {
    if (audioRef.current && duration > 0) {
      const newTime = (val[0] / 100) * duration;
      audioRef.current.currentTime = newTime;
      setProgress(val[0]);
    }
  };
  const handleLike = async () => {
    if (!user) {
      toast.error("Please log in to like");
      return;
    }
    const prevLiked = isLiked;
    setIsLiked(!prevLiked);
    setLikeCount(prev => prevLiked ? prev - 1 : prev + 1);
    if (!prevLiked) setShowExplosion(true);
    try {
      const res = await api<{ likes: number, isLiked: boolean }>(`/api/posts/${post.id}/like`, {
        method: 'POST',
        body: JSON.stringify({ userId: user.id })
      });
      setLikeCount(res.likes);
      setIsLiked(res.isLiked);
    } catch (e) {
      setIsLiked(prevLiked);
      setLikeCount(prevLiked ? likeCount : likeCount);
    }
  };
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  return (
    <div className="relative w-full h-full max-w-md mx-auto bg-black snap-start shrink-0 overflow-hidden md:rounded-xl border border-white/5 shadow-2xl flex flex-col">
      <audio
        ref={audioRef}
        src={post.audioUrl}
        loop
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => setIsPlaying(false)}
      />
      {/* Background Blur */}
      <div className="absolute inset-0 z-0">
        <img
          src={post.coverArtUrl || post.user?.avatar}
          alt="Background"
          className="w-full h-full object-cover opacity-30 blur-3xl scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/90" />
      </div>
      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col p-6 justify-center items-center text-center space-y-8">
        {/* Visualizer Background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-50">
             <AudioVisualizer isPlaying={isPlaying} barCount={30} className="h-64 gap-1" />
        </div>
        {/* Cover Art */}
        <motion.div
          animate={{ rotate: isPlaying ? 360 : 0 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear", repeatType: "loop" }}
          className={cn(
            "w-64 h-64 rounded-full shadow-2xl border-4 border-white/10 overflow-hidden relative z-10",
            !isPlaying && "animation-play-state: paused"
          )}
        >
          {post.coverArtUrl ? (
            <img src={post.coverArtUrl} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
              <Music2 className="w-24 h-24 text-white/50" />
            </div>
          )}
          {/* Center Hole for Vinyl Look */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-black rounded-full border border-white/20" />
        </motion.div>
        {/* Metadata */}
        <div className="space-y-2 max-w-xs relative z-10">
          <h2 className="text-2xl font-bold text-white truncate">{post.title || "Untitled Track"}</h2>
          <p className="text-lg text-muted-foreground truncate">{post.artist || post.user?.name}</p>
        </div>
        {/* Progress & Controls */}
        <div className="w-full max-w-xs space-y-4 relative z-10">
          <div className="space-y-1">
            <Slider
              value={[progress]}
              max={100}
              step={0.1}
              onValueChange={handleSeek}
              className="cursor-pointer"
            />
            <div className="flex justify-between text-xs text-muted-foreground font-mono">
              <span>{formatTime(audioRef.current?.currentTime || 0)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
          <div className="flex justify-center items-center gap-6">
            <button
              onClick={togglePlay}
              className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shadow-glow"
            >
              {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
            </button>
          </div>
        </div>
      </div>
      {/* Right Sidebar Actions */}
      <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6 z-20">
        <div className="flex flex-col items-center gap-1">
            <Link to={`/profile/${post.userId}`} className="relative cursor-pointer transition-transform hover:scale-105 active:scale-95">
                <Avatar className="w-12 h-12 border-2 border-white shadow-lg">
                    <AvatarImage src={post.user?.avatar} />
                    <AvatarFallback>{post.user?.name?.substring(0, 2)}</AvatarFallback>
                </Avatar>
            </Link>
        </div>
        <button onClick={handleLike} className="flex flex-col items-center gap-1 group">
          <div className={cn(
            "p-3 rounded-full bg-black/20 backdrop-blur-sm transition-all duration-200 group-hover:bg-black/40",
            isLiked ? "text-red-500" : "text-white"
          )}>
            <Heart className={cn("w-7 h-7", isLiked && "fill-current")} />
          </div>
          <span className="text-xs font-medium text-white text-shadow">{likeCount}</span>
        </button>
        <button onClick={() => setIsCommentsOpen(true)} className="flex flex-col items-center gap-1 group">
          <div className="p-3 rounded-full bg-black/20 backdrop-blur-sm text-white transition-all duration-200 group-hover:bg-black/40">
            <MessageCircle className="w-7 h-7 fill-white/10" />
          </div>
          <span className="text-xs font-medium text-white text-shadow">{commentCount}</span>
        </button>
        <button onClick={() => setIsShareOpen(true)} className="flex flex-col items-center gap-1 group">
          <div className="p-3 rounded-full bg-black/20 backdrop-blur-sm text-white transition-all duration-200 group-hover:bg-black/40">
            <Share2 className="w-7 h-7" />
          </div>
          <span className="text-xs font-medium text-white text-shadow">{shareCount}</span>
        </button>
        <PostOptions post={post} onDelete={onDelete} onUpdate={onUpdate} onHide={onHide} />
      </div>
      {/* Bottom Caption */}
      <div className="absolute bottom-0 left-0 right-0 p-4 pb-6 bg-gradient-to-t from-black/90 to-transparent z-10">
        <div className="max-w-[80%]">
          <p className="text-sm text-white/90 line-clamp-2">{post.caption}</p>
        </div>
      </div>
      {/* Effects & Dialogs */}
      <AnimatePresence>
        {showExplosion && <LikeExplosion />}
      </AnimatePresence>
      <ShareDialog open={isShareOpen} onOpenChange={setIsShareOpen} postId={post.id} />
      <CommentsSheet
        postId={post.id}
        open={isCommentsOpen}
        onOpenChange={setIsCommentsOpen}
        onCommentAdded={() => setCommentCount(prev => prev + 1)}
      />
    </div>
  );
}