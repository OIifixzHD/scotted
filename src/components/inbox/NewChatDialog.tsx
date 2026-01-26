import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Search, UserPlus, MessageSquarePlus, Lock, Globe } from "lucide-react";
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import type { Chat, User } from '@shared/types';
import { useAuth } from '@/context/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
interface NewChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChatCreated: (chat: Chat) => void;
}
export function NewChatDialog({ open, onOpenChange, onChatCreated }: NewChatDialogProps) {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  // New Chat Settings
  const [visibility, setVisibility] = useState<'public' | 'private'>('private');
  const [canType, setCanType] = useState<'all' | 'participants' | 'admin'>('all');
  useEffect(() => {
    if (open) {
      const fetchUsers = async () => {
        setIsLoading(true);
        try {
          const res = await api<{ items: User[] }>('/api/users?limit=100');
          setUsers(res.items.filter(u => u.id !== currentUser?.id));
        } catch (error) {
          console.error(error);
          toast.error('Failed to load users');
        } finally {
          setIsLoading(false);
        }
      };
      fetchUsers();
      setSearchQuery('');
      setVisibility('private');
      setCanType('all');
    }
  }, [open, currentUser]);
  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.displayName && u.displayName.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const handleUserSelect = async (selectedUser: User) => {
    if (isCreating || !currentUser) return;
    setIsCreating(true);
    try {
      const chatTitle = `Chat with ${selectedUser.displayName || selectedUser.name}`;
      const newChat = await api<Chat>('/api/chats', {
        method: 'POST',
        body: JSON.stringify({ 
          title: chatTitle,
          visibility,
          canType,
          ownerId: currentUser.id
        })
      });
      toast.success(`Started chat with ${selectedUser.name}`);
      onChatCreated(newChat);
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to start chat');
    } finally {
      setIsCreating(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card border-white/10 text-foreground p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 border-b border-white/10">
          <DialogTitle className="flex items-center gap-2">
            <MessageSquarePlus className="w-5 h-5 text-primary" />
            New Message
          </DialogTitle>
          <DialogDescription>
            Configure settings and select a user to start a conversation.
          </DialogDescription>
        </DialogHeader>
        {/* Settings Section */}
        <div className="p-4 bg-secondary/10 border-b border-white/10 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Visibility</Label>
              <Select value={visibility} onValueChange={(v: any) => setVisibility(v)}>
                <SelectTrigger className="h-8 text-xs bg-secondary/50 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="public">Public</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Who Can Type</Label>
              <Select value={canType} onValueChange={(v: any) => setCanType(v)}>
                <SelectTrigger className="h-8 text-xs bg-secondary/50 border-white/10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Everyone</SelectItem>
                  <SelectItem value="participants">Participants</SelectItem>
                  <SelectItem value="admin">Admin Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="p-4 border-b border-white/10 bg-secondary/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search people..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-secondary/50 border-white/10 focus-visible:ring-primary"
              autoFocus
            />
          </div>
        </div>
        <ScrollArea className="h-[300px] p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
              <p className="text-sm">Loading users...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground">
              <p className="text-sm">No users found.</p>
            </div>
          ) : (
            <div className="flex flex-col p-2">
              {filteredUsers.map(user => (
                <button
                  key={user.id}
                  onClick={() => handleUserSelect(user)}
                  disabled={isCreating}
                  className="flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg transition-all duration-200 text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Avatar className="w-10 h-10 border border-white/10 group-hover:border-primary/50 transition-colors">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white truncate group-hover:text-primary transition-colors">
                      {user.displayName || user.name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      @{user.name.toLowerCase().replace(/\s/g, '')}
                    </div>
                  </div>
                  {isCreating ? (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  ) : (
                    <UserPlus className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors opacity-0 group-hover:opacity-100" />
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}