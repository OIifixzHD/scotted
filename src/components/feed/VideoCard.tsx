import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, Music2, Volume2, VolumeX, Play, AlertCircle, Eye, RefreshCw, Loader2, Link as LinkIcon, Ban, Flag, Trash2, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getBadgeIcon } from '@/components/ui/badge-icons';
import type { Post } from '@shared/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { ShareDialog } from './ShareDialog';
import { CommentsSheet } from './CommentsSheet';
import { useAuth } from '@/context/AuthContext';
import { PostOptions } from './PostOptions';
import { Button } from '@/components/ui/button';
import { LikeExplosion } from '@/components/ui/like-explosion';
import { ReportDialog } from '@/components/profile/ReportDialog';
import { EditPostDialog } from '@/components/feed/EditPostDialog';
import { getFilterClass } from '@/lib/filters';
import { OverlayCanvas } from '@/components/upload/OverlayCanvas';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
interface VideoCardProps {
  post: Post;
  isActive: boolean;
  isMuted: boolean;
  toggleMute: () => void;
  onDelete?: () => void;
  onUpdate?: (post: Post) => void;
  onHide?: () => void;
  shouldPreload?: boolean;
  autoplayEnabled?: boolean;
}
export function VideoCard({
  post,
  isActive,
  isMuted,
  toggleMute: propToggleMute,
  onDelete,
  onUpdate,
  onHide,
  shouldPreload,
  autoplayEnabled = true
}: VideoCardProps) {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
    }
    propToggleMute();
  }, [propToggleMute]);
  // Initialize state from props
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.likes);
  const [commentCount, setCommentCount] = useState(post.comments);
  const [shareCount, setShareCount] = useState(post.shares || 0);
  const [viewCount, setViewCount] = useState(post.views || 0);
  const [showHeartAnimation, setShowHeartAnimation] = useState(false);
  const [showExplosion, setShowExplosion] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [showUnmuteHint, setShowUnmuteHint] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const hasViewedRef = useRef(false);
  const isOwner = user?.id === post.userId;
  const isAdmin = user?.isAdmin;
  const canDelete = isOwner || isAdmin;
  const canEdit = isOwner || isAdmin;
  // Sync with prop updates and user auth state
  useEffect(() => {
    if (user) {
      setIsLiked(post.likedBy?.includes(user.id) || false);
    } else {
      setIsLiked(false);
    }
    setLikeCount(post.likes);
    setCommentCount(post.comments);
    setShareCount(post.shares || 0);
    setViewCount(post.views || 0);
  }, [post, user]);
  // Handle Play/Pause based on active state and autoplay preference
  useEffect(() => {
    const video = videoRef.current;
    if (!video || hasError) return;
    // Sync muted state
    video.muted = isMuted;
    if (isActive) {
      if (autoplayEnabled) {
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
              // Show unmute hint if the video is still muted
              if (video.muted) {
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
        // Autoplay disabled, ensure paused but ready
        setIsPlaying(false);
        video.pause();
      }
    } else {
      video.pause();
      setIsPlaying(false);
      video.currentTime = 0;
      setProgress(0);
      setIsBuffering(false);
    }
  }, [isActive, hasError, post.id, isMuted, autoplayEnabled]);
  const togglePlay = useCallback(() => {
    if (videoRef.current && !hasError) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play().catch(e => console.warn("Play failed", e));
        setIsPlaying(true);
        // If manually played, count as view if not already
        if (!hasViewedRef.current) {
            hasViewedRef.current = true;
            api<{ views: number }>(`/api/posts/${post.id}/view`, { method: 'POST' })
                .then(res => setViewCount(res.views))
                .catch(e => console.error("Failed to increment view", e));
        }
      }
    }
  }, [isPlaying, hasError, post.id]);
  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    setHasError(false);
    setIsBuffering(false);
    if (videoRef.current) {
        videoRef.current.load();
        if (isActive && autoplayEnabled) videoRef.current.play().catch(console.warn);
    }
  };
  const triggerLikeEffects = useCallback(() => {
    setShowHeartAnimation(true);
    setShowExplosion(true);
    setTimeout(() => setShowHeartAnimation(false), 800);
    setTimeout(() => setShowExplosion(false), 1000);
  }, []);
  const handleLike = useCallback(async () => {
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
      triggerLikeEffects();
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
  }, [user, isLiked, likeCount, post.id, triggerLikeEffects]);
  // Keyboard Shortcuts
  useEffect(() => {
    if (!isActive) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        toggleMute();
      } else if (e.code === 'KeyL') {
        e.preventDefault();
        handleLike();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isActive, togglePlay, toggleMute, handleLike]);
  const handleShare = async () => {
    setIsShareOpen(true);
    // Optimistic update
    setShareCount(prev => prev + 1);
    try {
        const res = await api<{ shares: number }>(`/api/posts/${post.id}/share`, { method: 'POST' });
        setShareCount(res.shares);
    } catch (e) {
        console.error("Failed to track share", e);
    }
  };
  const handleDoubleTap = () => {
    if (!user) {
        toast.error("Please log in to like posts");
        return;
    }
    triggerLikeEffects();
    if (!isLiked) {
        handleLike();
    }
  };
  const handleError = () => {
    console.error(`Video failed to load: ${post.videoUrl}`);
    setHasError(true);
    setIsPlaying(false);
    setIsBuffering(false);
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
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation(); // Don't toggle play
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    if (videoRef.current && videoRef.current.duration) {
      videoRef.current.currentTime = percentage * videoRef.current.duration;
      setProgress(percentage * 100);
    }
  };
  const handleCopyLink = async () => {
    const url = `${window.location.origin}/post/${post.id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard");
    } catch (err) {
      toast.error("Failed to copy link");
    }
  };
  const handleNotInterested = async () => {
    if (!user) return;
    try {
      await api(`/api/users/${user.id}/not-interested`, {
        method: 'POST',
        body: JSON.stringify({ postId: post.id })
      });
      toast.success("Post hidden");
      onHide?.();
    } catch (error) {
      console.error(error);
      toast.error("Failed to hide post");
    }
  };
  const handleDelete = async () => {
    if (!user) return;
    if (!confirm("Are you sure you want to delete this post?")) return;
    try {
      await api(`/api/posts/${post.id}`, {
        method: 'DELETE',
        body: JSON.stringify({ userId: user.id })
      });
      toast.success("Post deleted");
      onDelete?.();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete post");
    }
  };
  const renderCaption = (text: string) => {
    if (!text) return [];
    // Split by whitespace but keep delimiters to preserve formatting
    const parts = text.split(/(\s+)/);
    return parts.map((part, index) => {
      if (part.startsWith('#') && part.length > 1) {
        const tag = part.substring(1);
        return (
          <Link
            key={index}
            to={`/discover?q=${encodeURIComponent(tag)}`}
            className="text-primary font-bold hover:underline hover:text-primary/80 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </Link>
        );
      }
      return part;
    });
  };
  return (
    <ContextMenu>
      <ContextMenuTrigger className="w-full h-full">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="relative w-full h-full max-w-md mx-auto bg-black snap-start shrink-0 overflow-hidden md:rounded-xl border border-white/5 shadow-2xl group/video"
        >
          {/* Video Player */}
          <div
            className="absolute inset-0 cursor-pointer bg-gray-900"
            onClick={togglePlay}
            onDoubleClick={handleDoubleTap}
          >
            {!hasError ? (
                <>
                  <video
                    ref={videoRef}
                    src={post.videoUrl}
                    className={cn("w-full h-full object-cover", getFilterClass(post.filter))}
                    loop
                    muted={isMuted}
                    playsInline
                    crossOrigin="anonymous"
                    preload={isActive || shouldPreload ? "auto" : "metadata"}
                    onError={handleError}
                    onTimeUpdate={handleTimeUpdate}
                    onWaiting={() => setIsBuffering(true)}
                    onPlaying={() => { setIsBuffering(false); setIsPlaying(true); }}
                  />
                  {/* Text Overlays */}
                  <OverlayCanvas overlays={post.overlays || []} readOnly />
                </>
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground bg-gray-900 z-10">
                    <AlertCircle className="w-12 h-12 mb-2 opacity-50" />
                    <p className="text-sm mb-4">Video unavailable</p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRetry}
                        className="border-white/10 hover:bg-white/5"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry
                    </Button>
                </div>
            )}
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80 pointer-events-none" />
            {/* Play/Pause Indicator */}
            {!isPlaying && !hasError && !isBuffering && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20">
                    <Play className="w-16 h-16 text-white/80 fill-white/80" />
                </div>
            )}
            {/* Buffering Indicator */}
            {isBuffering && isPlaying && !hasError && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <Loader2 className="w-12 h-12 text-white/70 animate-spin drop-shadow-lg" />
                </div>
            )}
            {/* HD Badge */}
            {!hasError && !isBuffering && (
                <div className="absolute top-4 left-4 z-20 px-2 py-1 bg-black/40 backdrop-blur-md rounded border border-white/10 text-[10px] font-bold text-white/80 pointer-events-none">
                    HD
                </div>
            )}
            {/* Unmute Hint */}
            <AnimatePresence>
                {/* Show unmute hint if video is playing, currently muted */}
                {showUnmuteHint && isPlaying && videoRef.current?.muted && (
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
            {/* Like Explosion Effect */}
            <AnimatePresence>
              {showExplosion && <LikeExplosion />}
            </AnimatePresence>
            {/* Big Heart Animation */}
            <AnimatePresence>
              {showHeartAnimation && (
                <motion.div
                  initial={{ scale: 0, opacity: 0, rotate: -45 }}
                  animate={{ scale: 1.5, opacity: 1, rotate: 0 }}
                  exit={{ scale: 0, opacity: 0, rotate: 45 }}
                  className="absolute inset-0 flex items-center justify-center pointer-events-none z-40"
                >
                  <Heart className="w-32 h-32 text-red-500 fill-red-500 drop-shadow-glow" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {/* Interactive Progress Bar */}
          <div
            className="absolute bottom-0 left-0 right-0 h-4 z-30 cursor-pointer group flex items-end"
            onClick={handleSeek}
          >
            <div className="w-full h-1 bg-white/20 group-hover:h-2 transition-all duration-200">
               <div
                 className="h-full bg-primary transition-all duration-100 ease-linear relative"
                 style={{ width: `${progress}%` }}
               >
                  {/* Scrubber Handle (visible on hover) */}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 shadow-sm scale-0 group-hover:scale-100 transition-all duration-200" />
               </div>
            </div>
          </div>
          {/* Right Sidebar Actions */}
          <div className="absolute right-4 bottom-12 flex flex-col items-center gap-6 z-20">
            <div className="flex flex-col items-center gap-1">
                <Link to={`/profile/${post.userId}`} className="relative cursor-pointer transition-transform hover:scale-105 active:scale-95">
                    <Avatar className="w-12 h-12 border-2 border-white shadow-lg">
                        <AvatarImage src={post.user?.avatar} />
                        <AvatarFallback>{post.user?.displayName?.substring(0, 2) || post.user?.name?.substring(0, 2) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-red-500 rounded-full p-0.5">
                        <div className="w-3 h-3 bg-white rounded-full flex items-center justify-center">
                            <span className="text-[10px] font-bold text-red-500">+</span>
                        </div>
                    </div>
                </Link>
            </div>
            <button
              onClick={handleLike}
              className="flex flex-col items-center gap-1 group"
            >
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
              onClick={handleShare}
              className="flex flex-col items-center gap-1 group"
            >
              <div className="p-3 rounded-full bg-black/20 backdrop-blur-sm text-white transition-all duration-200 group-hover:bg-black/40 group-active:scale-90">
                <Share2 className="w-7 h-7" />
              </div>
              <span className="text-xs font-medium text-white text-shadow">{shareCount}</span>
            </button>
            {/* View Count */}
            <div className="flex flex-col items-center gap-1 group">
              <div className="p-3 rounded-full bg-black/20 backdrop-blur-sm text-white transition-all duration-200 group-hover:bg-black/40">
                <Eye className="w-7 h-7" />
              </div>
              <span className="text-xs font-medium text-white text-shadow">{viewCount}</span>
            </div>
            {/* More Options */}
            <PostOptions post={post} onDelete={onDelete} onUpdate={onUpdate} onHide={onHide} />
            {/* Spinning Disc Removed as per user request */}
          </div>
          {/* Bottom Info Area */}
          <div className="absolute bottom-1 left-0 right-0 p-4 pb-8 z-10 bg-gradient-to-t from-black/90 to-transparent pointer-events-none">
            <div className="max-w-[80%] space-y-2 pointer-events-auto">
              <Link to={`/profile/${post.userId}`} className="flex items-center gap-2 group/name">
                <h3 className="text-lg font-bold text-white text-shadow group-hover/name:underline cursor-pointer">
                  {post.user?.displayName || post.user?.name || 'unknown'}
                </h3>
                {getBadgeIcon(post.user?.badge)}
              </Link>
              <p className="text-sm text-white/90 text-shadow-lg line-clamp-2 text-pretty">
                {renderCaption(post.caption)}
              </p>
              <Link
                to={`/sound/${post.soundId || 'default-sound'}`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center gap-2 text-white/80 text-xs font-medium mt-2 hover:text-white hover:underline transition-colors w-fit"
              >
                <Music2 className="w-3 h-3" />
                <div className="overflow-hidden w-32">
                    <p className="animate-marquee whitespace-nowrap">
                      {post.soundName || 'Original Audio'} • {post.user?.displayName || post.user?.name || 'Unknown User'}
                    </p>
                </div>
              </Link>
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
          {/* Report Dialog */}
          <ReportDialog
            open={isReportDialogOpen}
            onClose={() => setIsReportDialogOpen(false)}
            targetId={post.id}
            targetType="post"
            targetName="this post"
          />
          {/* Edit Post Dialog */}
          <EditPostDialog
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            post={post}
            onSuccess={(updatedPost) => {
              onUpdate?.(updatedPost);
            }}
          />
        </motion.div>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-64 bg-card/95 backdrop-blur-xl border-white/10 text-foreground">
        <ContextMenuItem onClick={handleLike}>
          <Heart className={cn("mr-2 h-4 w-4", isLiked && "fill-red-500 text-red-500")} />
          {isLiked ? "Unlike" : "Like"}
        </ContextMenuItem>
        <ContextMenuItem onClick={() => setIsCommentsOpen(true)}>
          <MessageCircle className="mr-2 h-4 w-4" />
          Comment
        </ContextMenuItem>
        <ContextMenuItem onClick={handleShare}>
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </ContextMenuItem>
        <ContextMenuItem onClick={handleCopyLink}>
          <LinkIcon className="mr-2 h-4 w-4" />
          Copy Link
        </ContextMenuItem>
        <ContextMenuSeparator className="bg-white/10" />
        {user && !isOwner && (
          <>
            <ContextMenuItem onClick={handleNotInterested}>
              <Ban className="mr-2 h-4 w-4" />
              Not Interested
            </ContextMenuItem>
            <ContextMenuItem onClick={() => setIsReportDialogOpen(true)} className="text-yellow-500 focus:text-yellow-500">
              <Flag className="mr-2 h-4 w-4" />
              Report
            </ContextMenuItem>
          </>
        )}
        {canEdit && (
          <ContextMenuItem onClick={() => setIsEditDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Post
          </ContextMenuItem>
        )}
        {canDelete && (
          <ContextMenuItem onClick={handleDelete} className="text-red-500 focus:text-red-500">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </ContextMenuItem>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
}