import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import type { Chat } from '@shared/types';
interface NewChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChatCreated: (chat: Chat) => void;
}
export function NewChatDialog({ open, onOpenChange, onChatCreated }: NewChatDialogProps) {
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsLoading(true);
    try {
      const newChat = await api<Chat>('/api/chats', {
        method: 'POST',
        body: JSON.stringify({ title: title.trim() })
      });
      toast.success('Chat created');
      onChatCreated(newChat);
      onOpenChange(false);
      setTitle('');
    } catch (error) {
      console.error(error);
      toast.error('Failed to create chat');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card border-white/10 text-foreground">
        <DialogHeader>
          <DialogTitle>New Chat</DialogTitle>
          <DialogDescription>Start a new conversation.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Chat Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Project Alpha"
              className="bg-secondary/50 border-white/10"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isLoading || !title.trim()} className="bg-primary hover:bg-primary/90">
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Chat
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}