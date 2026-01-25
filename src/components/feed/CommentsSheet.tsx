import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, MessageCircle, Trash2, Heart } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { api } from '@/lib/api-client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import type { Comment } from '@shared/types';
import { cn } from '@/lib/utils';
interface CommentsSheetProps {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCommentAdded?: () => void;
}
export function CommentsSheet({ postId, open, onOpenChange, onCommentAdded }: CommentsSheetProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [text, setText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api<Comment[]>(`/api/posts/${postId}/comments`);
      // Sort by newest first
      setComments(res.sort((a, b) => b.createdAt - a.createdAt));
    } catch (error) {
      console.error('Failed to load comments', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [postId]);
  useEffect(() => {
    if (open && postId) {
      fetchComments();
    }
  }, [open, postId, fetchComments]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || !user) return;
    const tempId = crypto.randomUUID();
    const optimisticComment: Comment = {
      id: tempId,
      postId,
      userId: user.id,
      text: text.trim(),
      createdAt: Date.now(),
      user: user,
      likes: 0,
      likedBy: []
    };
    try {
      setSubmitting(true);
      // Optimistic update
      setComments(prev => [optimisticComment, ...prev]);
      setText('');
      await api(`/api/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ userId: user.id, text: optimisticComment.text })
      });
      if (onCommentAdded) onCommentAdded();
      // Refresh to get real ID and server state
      fetchComments();
    } catch (error) {
      console.error('Failed to post comment', error);
      toast.error('Failed to post comment');
      // Revert optimistic update
      setComments(prev => prev.filter(c => c.id !== tempId));
    } finally {
      setSubmitting(false);
    }
  };
  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;
    // Optimistic update
    const prevComments = comments;
    setComments(prev => prev.filter(c => c.id !== commentId));
    try {
        await api(`/api/posts/${postId}/comments/${commentId}`, {
            method: 'DELETE',
            body: JSON.stringify({ userId: user.id })
        });
        toast.success('Comment deleted');
    } catch (e) {
        console.error(e);
        toast.error('Failed to delete comment');
        setComments(prevComments); // Revert
    }
  };
  const handleLikeComment = async (commentId: string) => {
    if (!user) {
        toast.error("Please log in to like comments");
        return;
    }
    // Optimistic update
    setComments(prev => prev.map(c => {
        if (c.id === commentId) {
            const isLiked = c.likedBy?.includes(user.id);
            const newLikes = isLiked ? (c.likes || 0) - 1 : (c.likes || 0) + 1;
            const newLikedBy = isLiked
                ? c.likedBy?.filter(id => id !== user.id)
                : [...(c.likedBy || []), user.id];
            return { ...c, likes: newLikes, likedBy: newLikedBy };
        }
        return c;
    }));
    try {
        await api(`/api/posts/${postId}/comments/${commentId}/like`, {
            method: 'POST',
            body: JSON.stringify({ userId: user.id })
        });
    } catch (e) {
        console.error(e);
        toast.error("Failed to like comment");
        // Revert (fetch fresh comments or undo logic)
        fetchComments();
    }
  };
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 bg-card border-l border-white/10 flex flex-col h-full z-[100]">
        <SheetHeader className="p-4 border-b border-white/10">
          <SheetTitle className="flex items-center gap-2 text-white">
            <MessageCircle className="w-5 h-5" />
            Comments
            <span className="text-sm font-normal text-muted-foreground ml-2">
              {comments.length}
            </span>
          </SheetTitle>
          <SheetDescription className="sr-only">
            View and add comments to this post.
          </SheetDescription>
        </SheetHeader>
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-center">
              <MessageCircle className="w-12 h-12 mb-4 opacity-20" />
              <p>No comments yet.</p>
              <p className="text-sm">Be the first to share your thoughts!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-3 animate-fade-in group w-full">
                  <Avatar className="w-8 h-8 border border-white/10 mt-1 shrink-0">
                    <AvatarImage src={comment.user?.avatar} />
                    <AvatarFallback>{comment.user?.name?.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-semibold text-white truncate">
                        {comment.user?.name || 'Unknown'}
                      </span>
                      <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                        {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-white/90 leading-relaxed break-words">
                      {comment.text}
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-1 pt-1 shrink-0">
                    <button
                        onClick={() => handleLikeComment(comment.id)}
                        className={cn(
                            "text-muted-foreground hover:text-red-500 transition-colors p-1",
                            comment.likedBy?.includes(user?.id || '') && "text-red-500"
                        )}
                    >
                        <Heart className={cn("w-4 h-4", comment.likedBy?.includes(user?.id || '') && "fill-current")} />
                    </button>
                    {(comment.likes || 0) > 0 && (
                        <span className="text-[10px] text-muted-foreground">{comment.likes}</span>
                    )}
                  </div>
                  {(user?.id === comment.userId || user?.isAdmin) && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                        onClick={() => handleDeleteComment(comment.id)}
                    >
                        <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        <div className="p-4 bg-card border-t border-white/10 mt-auto">
          {user ? (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Avatar className="w-8 h-8 border border-white/10 hidden sm:block">
                <AvatarImage src={user.avatar} />
                <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
              </Avatar>
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 bg-secondary/50 border-white/10 focus-visible:ring-primary"
                disabled={submitting}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!text.trim() || submitting}
                className="bg-primary hover:bg-primary/90 shrink-0"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </form>
          ) : (
            <div className="text-center p-2">
              <p className="text-sm text-muted-foreground mb-2">Log in to comment</p>
              <Button variant="outline" className="w-full border-white/10 hover:bg-white/5" asChild>
                <a href="/login">Log In</a>
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}