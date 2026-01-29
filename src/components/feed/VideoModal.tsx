import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VideoCard } from './VideoCard';
import { AudioCard } from './AudioCard';
import type { Post } from '@shared/types';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAudioSettings } from '@/hooks/use-audio-settings';
interface VideoModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: () => void;
  onUpdate?: (post: Post) => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}
export function VideoModal({
  post,
  isOpen,
  onClose,
  onDelete,
  onUpdate,
  onNext,
  onPrev,
  hasNext,
  hasPrev
}: VideoModalProps) {
  const { isMuted, volume, toggleMute, setVolume } = useAudioSettings();
  // Keyboard Navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && hasNext && onNext) {
        e.preventDefault();
        onNext();
      } else if (e.key === 'ArrowLeft' && hasPrev && onPrev) {
        e.preventDefault();
        onPrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, hasNext, hasPrev, onNext, onPrev]);
  if (!post) return null;
  const handleDelete = () => {
    onDelete?.();
    // Don't close here, let parent handle logic (e.g. move to next video)
  };
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 bg-black border-none overflow-hidden h-[80vh] md:h-[85vh] flex flex-col items-center justify-center">
        <DialogTitle className="sr-only">Player</DialogTitle>
        <div className="relative w-full h-full group/modal">
            {post.type === 'audio' ? (
              <AudioCard
                key={post.id}
                post={post}
                isActive={isOpen}
                isMuted={isMuted}
                volume={volume}
                toggleMute={toggleMute}
                onVolumeChange={setVolume}
                onDelete={handleDelete}
                onUpdate={onUpdate}
                autoplayEnabled={true}
              />
            ) : (
              <VideoCard
                key={post.id}
                post={post}
                isActive={isOpen}
                isMuted={isMuted}
                volume={volume}
                toggleMute={toggleMute}
                onVolumeChange={setVolume}
                onDelete={handleDelete}
                onUpdate={onUpdate}
                autoplayEnabled={true}
              />
            )}
            {/* Close Button Overlay */}
            <button
                onClick={onClose}
                className="absolute top-4 left-4 p-2 rounded-full bg-black/20 backdrop-blur-md text-white/80 hover:bg-black/40 transition-colors z-50"
            >
                <X className="w-5 h-5" />
            </button>
            {/* Navigation Buttons */}
            {hasPrev && onPrev && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); onPrev(); }}
                className="absolute top-1/2 left-2 -translate-y-1/2 z-50 rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/50 h-10 w-10 md:opacity-0 md:group-hover/modal:opacity-100 transition-opacity"
              >
                <ChevronLeft className="w-6 h-6" />
              </Button>
            )}
            {hasNext && onNext && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => { e.stopPropagation(); onNext(); }}
                className="absolute top-1/2 right-2 -translate-y-1/2 z-50 rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/50 h-10 w-10 md:opacity-0 md:group-hover/modal:opacity-100 transition-opacity"
              >
                <ChevronRight className="w-6 h-6" />
              </Button>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}