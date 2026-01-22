import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Send, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { api } from '@/lib/api-client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import type { Comment } from '@shared/types';
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
      user: user
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
                <div key={comment.id} className="flex gap-3 animate-fade-in">
                  <Avatar className="w-8 h-8 border border-white/10 mt-1">
                    <AvatarImage src={comment.user?.avatar} />
                    <AvatarFallback>{comment.user?.name?.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm font-semibold text-white">
                        {comment.user?.name || 'Unknown'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(comment.createdAt, { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-sm text-white/90 leading-relaxed break-words">
                      {comment.text}
                    </p>
                  </div>
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