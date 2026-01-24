import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VideoCard } from './VideoCard';
import type { Post } from '@shared/types';
import { X } from 'lucide-react';
interface VideoModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: () => void;
  onUpdate?: (post: Post) => void;
}
export function VideoModal({ post, isOpen, onClose, onDelete, onUpdate }: VideoModalProps) {
  const [isMuted, setIsMuted] = useState(false);
  if (!post) return null;
  const handleDelete = () => {
    onDelete?.();
    onClose();
  };
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 bg-black border-none overflow-hidden h-[80vh] md:h-[85vh] flex flex-col items-center justify-center">
        <DialogTitle className="sr-only">Video Player</DialogTitle>
        <div className="relative w-full h-full">
            <VideoCard 
                post={post}
                isActive={isOpen}
                isMuted={isMuted}
                toggleMute={() => setIsMuted(!isMuted)}
                onDelete={handleDelete}
                onUpdate={onUpdate}
            />
            {/* Close Button Overlay */}
            <button 
                onClick={onClose}
                className="absolute top-4 left-4 p-2 rounded-full bg-black/20 backdrop-blur-md text-white/80 hover:bg-black/40 transition-colors z-50"
            >
                <X className="w-5 h-5" />
            </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}