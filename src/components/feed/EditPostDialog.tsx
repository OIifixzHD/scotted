import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import type { Post } from '@shared/types';
import { useAuth } from '@/context/AuthContext';
interface EditPostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: Post;
  onSuccess: (updatedPost: Post) => void;
}
export function EditPostDialog({ open, onOpenChange, post, onSuccess }: EditPostDialogProps) {
  const { user } = useAuth();
  const [caption, setCaption] = useState(post.caption);
  const [tags, setTags] = useState(post.tags?.join(', ') || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    if (open) {
      setCaption(post.caption);
      setTags(post.tags?.join(', ') || '');
    }
  }, [open, post]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    try {
      const tagList = tags.split(',').map(t => t.trim()).filter(Boolean);
      const updatedPost = await api<Post>(`/api/posts/${post.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          userId: user.id,
          caption,
          tags: tagList
        })
      });
      toast.success('Post updated successfully');
      onSuccess(updatedPost);
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update post');
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card border-white/10 text-foreground">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
          <DialogDescription>Update your post caption and tags.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="caption">Caption</Label>
            <Textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="bg-secondary/50 border-white/10 min-h-[100px]"
              placeholder="Write a caption..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="bg-secondary/50 border-white/10"
              placeholder="comma, separated, tags"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}