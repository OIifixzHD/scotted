import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Settings } from "lucide-react";
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import type { Chat } from '@shared/types';
import { useAuth } from '@/context/AuthContext';
interface ChatSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chat: Chat;
  onUpdate: (updatedChat: Chat) => void;
}
export function ChatSettingsDialog({ open, onOpenChange, chat, onUpdate }: ChatSettingsDialogProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState(chat.title);
  const [visibility, setVisibility] = useState<'public' | 'private'>(chat.visibility || 'private');
  const [canType, setCanType] = useState<'all' | 'participants' | 'admin'>(chat.canType || 'all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    if (open) {
      setTitle(chat.title);
      setVisibility(chat.visibility || 'private');
      setCanType(chat.canType || 'all');
    }
  }, [open, chat]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    try {
      const updatedChat = await api<Chat>(`/api/chats/${chat.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          userId: user.id,
          title,
          visibility,
          canType
        })
      });
      onUpdate(updatedChat);
      toast.success('Chat settings updated');
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Failed to update settings');
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card border-white/10 text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            Chat Settings
          </DialogTitle>
          <DialogDescription>
            Manage privacy and permissions for this chat.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Chat Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-secondary/50 border-white/10"
            />
          </div>
          <div className="space-y-2">
            <Label>Visibility</Label>
            <Select 
              value={visibility} 
              onValueChange={(val: 'public' | 'private') => setVisibility(val)}
            >
              <SelectTrigger className="bg-secondary/50 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="private">Private (Participants Only)</SelectItem>
                <SelectItem value="public">Public (Visible to Everyone)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Private chats are only visible to invited participants.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Who Can Type</Label>
            <Select 
              value={canType} 
              onValueChange={(val: 'all' | 'participants' | 'admin') => setCanType(val)}
            >
              <SelectTrigger className="bg-secondary/50 border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Everyone</SelectItem>
                <SelectItem value="participants">Participants Only</SelectItem>
                <SelectItem value="admin">Admin Only (Read Only)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Restrict who can send messages in this chat.
            </p>
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