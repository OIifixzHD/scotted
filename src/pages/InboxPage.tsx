import React, { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, MessageCircle, Bell, Search, Plus, Image as ImageIcon, Check, CheckCheck, Settings } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import type { Notification, Chat, ChatMessage, User } from '@shared/types';
import { NotificationItem } from '@/components/activity/NotificationItem';
import { cn } from '@/lib/utils';
import { NewChatDialog } from '@/components/inbox/NewChatDialog';
import { ChatSettingsDialog } from '@/components/inbox/ChatSettingsDialog';
import { ChatListSkeleton } from '@/components/skeletons/ChatListSkeleton';
import { TypingIndicator } from '@/components/ui/typing-indicator';
import { useSearchParams } from 'react-router-dom';
export function InboxPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('activity');
  const [searchParams] = useSearchParams();
  const chatIdParam = searchParams.get('chatId');
  useEffect(() => {
    if (chatIdParam) {
      setActiveTab('messages');
    }
  }, [chatIdParam]);
  return (
    <div className="h-full flex flex-col bg-background">
      <div className="border-b border-white/10 px-4 pt-4 pb-0">
        <h1 className="text-2xl font-bold font-display mb-4 px-2">Inbox</h1>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full justify-start bg-transparent border-b border-transparent p-0 h-auto gap-6">
            <TabsTrigger
              value="activity"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-2 py-3 text-base font-medium transition-all"
            >
              Activity
            </TabsTrigger>
            <TabsTrigger
              value="messages"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary px-2 py-3 text-base font-medium transition-all"
            >
              Messages
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'activity' ? (
          <ActivityView />
        ) : (
          <MessagesView initialChatId={chatIdParam} />
        )}
      </div>
    </div>
  );
}
function ActivityView() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const res = await api<Notification[]>(`/api/notifications?userId=${user.id}`);
        setNotifications(res);
      } catch (error) {
        console.error(error);
        toast.error('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };
    const markRead = async () => {
        try {
            await api('/api/notifications/mark-read', {
                method: 'POST',
                body: JSON.stringify({ userId: user.id })
            });
            // Dispatch event to update sidebar
            window.dispatchEvent(new Event('pulse:notifications-read'));
        } catch (e) {
            console.error("Failed to mark notifications read", e);
        }
    };
    fetchNotifications();
    markRead();
  }, [user]);
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <p>Please log in to view activity.</p>
      </div>
    );
  }
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
          <Bell className="w-8 h-8 opacity-50" />
        </div>
        <h3 className="text-lg font-medium text-white mb-1">No activity yet</h3>
        <p className="text-sm">Likes, comments, and follows will appear here.</p>
      </div>
    );
  }
  return (
    <ScrollArea className="h-full">
      <div className="max-w-2xl mx-auto p-4 space-y-2">
        {notifications.map((notification) => (
          <NotificationItem key={notification.id} notification={notification} />
        ))}
      </div>
    </ScrollArea>
  );
}
function MessagesView({ initialChatId }: { initialChatId: string | null }) {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(initialChatId);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Fetch Chats
  useEffect(() => {
    if (!user) return;
    const fetchChats = async () => {
      try {
        setLoadingChats(true);
        const res = await api<{ items: Chat[] }>(`/api/chats?userId=${user.id}`);
        const sorted = res.items.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
        setChats(sorted);
      } catch (error) {
        console.error(error);
        toast.error('Failed to load chats');
      } finally {
        setLoadingChats(false);
      }
    };
    fetchChats();
  }, [user]);
  // Initial Message Load
  useEffect(() => {
    if (!selectedChatId) return;
    const fetchMessages = async () => {
      try {
        setLoadingMessages(true);
        const res = await api<ChatMessage[]>(`/api/chats/${selectedChatId}/messages`);
        setMessages(res);
      } catch (error) {
        console.error(error);
        toast.error('Failed to load messages');
      } finally {
        setLoadingMessages(false);
      }
    };
    fetchMessages();
  }, [selectedChatId]);
  // Real-time Polling for Messages
  useEffect(() => {
    if (!selectedChatId) return;
    const pollMessages = async () => {
      try {
        const res = await api<ChatMessage[]>(`/api/chats/${selectedChatId}/messages`);
        setMessages(prev => {
          if (res.length !== prev.length) return res;
          if (res.length > 0 && prev.length > 0 && res[res.length - 1].id !== prev[prev.length - 1].id) return res;
          return prev;
        });
      } catch (error) {
        console.error("Polling failed", error);
      }
    };
    const intervalId = setInterval(pollMessages, 3000);
    return () => clearInterval(intervalId);
  }, [selectedChatId]);
  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);
  const handleSendMessage = async (e?: React.FormEvent, mediaUrl?: string, mediaType?: 'image' | 'video') => {
    e?.preventDefault();
    if ((!newMessage.trim() && !mediaUrl) || !selectedChatId || !user) return;
    try {
      setSending(true);
      const res = await api<ChatMessage>(`/api/chats/${selectedChatId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          text: newMessage.trim(),
          mediaUrl,
          mediaType
        })
      });
      setMessages(prev => [...prev, res]);
      setNewMessage('');
      setChats(prev => prev.map(c =>
        c.id === selectedChatId
          ? { ...c, lastMessage: res, updatedAt: res.ts }
          : c
      ).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)));
      setTimeout(() => {
        setIsTyping(true);
      }, 1000);
      setTimeout(() => {
        setIsTyping(false);
      }, 4000);
    } catch (error) {
      console.error(error);
      const msg = error instanceof Error ? error.message : 'Failed to send message';
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) {
      toast.error("Image too large (max 500KB for demo)");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      handleSendMessage(undefined, base64, 'image');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };
  const handleChatCreated = (chat: Chat) => {
    setChats(prev => [chat, ...prev]);
    setSelectedChatId(chat.id);
  };
  const handleChatUpdated = (updatedChat: Chat) => {
    setChats(prev => prev.map(c => c.id === updatedChat.id ? { ...c, ...updatedChat } : c));
  };
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <p>Please log in to view messages.</p>
      </div>
    );
  }
  const activeChat = chats.find(c => c.id === selectedChatId);
  const isOwner = activeChat?.ownerId === user.id;
  return (
    <div className="flex h-full">
      {/* Chat List Sidebar */}
      <div className={cn(
        "w-full md:w-80 border-r border-white/10 flex flex-col bg-card/30",
        selectedChatId ? "hidden md:flex" : "flex"
      )}>
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <div className="relative flex-1 mr-2">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search chats..." className="pl-8 h-9 bg-secondary/50 border-white/10" />
            </div>
            <Button size="icon" variant="ghost" onClick={() => setIsNewChatOpen(true)}>
                <Plus className="w-5 h-5" />
            </Button>
        </div>
        <ScrollArea className="flex-1">
          {loadingChats ? (
            <ChatListSkeleton />
          ) : chats.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No chats yet. Start a new conversation!
            </div>
          ) : (
            <div className="flex flex-col">
              {chats.map(chat => (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChatId(chat.id)}
                  className={cn(
                    "flex items-center gap-3 p-4 hover:bg-white/5 transition-colors text-left border-b border-white/5",
                    selectedChatId === chat.id && "bg-white/10"
                  )}
                >
                  <Avatar className="w-10 h-10 border border-white/10">
                    <AvatarFallback>{chat.title.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <span className="font-medium text-white truncate">{chat.title}</span>
                      {chat.updatedAt && (
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {chat.lastMessage ? (
                        chat.lastMessage.mediaUrl ? (
                          <span className="flex items-center gap-1"><ImageIcon className="w-3 h-3" /> Image</span>
                        ) : (
                          chat.lastMessage.text
                        )
                      ) : (
                        "No messages yet"
                      )}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
      {/* Chat Window */}
      <div className={cn(
        "flex-1 flex flex-col bg-background",
        !selectedChatId ? "hidden md:flex" : "flex"
      )}>
        {selectedChatId && activeChat ? (
          <>
            {/* Chat Header */}
            <div className="h-16 border-b border-white/10 flex items-center justify-between px-4 bg-card/30 backdrop-blur-sm">
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden mr-2 -ml-2"
                  onClick={() => setSelectedChatId(null)}
                >
                  ←
                </Button>
                <Avatar className="w-8 h-8 border border-white/10 mr-3">
                  <AvatarFallback>
                    {activeChat.title.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="font-semibold text-white">
                    {activeChat.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground capitalize">
                    {activeChat.visibility} • {activeChat.participants?.length || 0} participants
                  </span>
                </div>
              </div>
              {isOwner && (
                <Button variant="ghost" size="icon" onClick={() => setIsSettingsOpen(true)}>
                  <Settings className="w-5 h-5 text-muted-foreground hover:text-white" />
                </Button>
              )}
            </div>
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              {loadingMessages ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground min-h-[200px]">
                  <MessageCircle className="w-12 h-12 mb-4 opacity-20" />
                  <p>No messages yet.</p>
                  <p className="text-sm">Say hello!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const isMe = msg.userId === user.id;
                    return (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex w-full",
                          isMe ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[75%] px-4 py-2 rounded-2xl text-sm space-y-2",
                            isMe
                              ? "bg-primary text-white rounded-br-none"
                              : "bg-secondary text-white rounded-bl-none"
                          )}
                        >
                          {msg.mediaUrl && (
                            <img
                              src={msg.mediaUrl}
                              alt="Attachment"
                              className="rounded-lg max-w-full max-h-60 object-cover"
                            />
                          )}
                          {msg.text && <p>{msg.text}</p>}
                          <div className={cn("flex justify-end items-center gap-1 text-[10px] opacity-70", isMe ? "text-white" : "text-muted-foreground")}>
                            <span>{new Date(msg.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            {isMe && (
                                msg.status === 'read' ? <CheckCheck className="w-3 h-3" /> : <Check className="w-3 h-3" />
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {isTyping && (
                    <div className="flex w-full justify-start mb-4">
                        <TypingIndicator />
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>
            {/* Input Area */}
            <div className="p-4 border-t border-white/10 bg-card/30">
              <form onSubmit={(e) => handleSendMessage(e)} className="flex gap-2">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                />
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="text-muted-foreground hover:text-white"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sending}
                >
                  <ImageIcon className="w-5 h-5" />
                </Button>
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-secondary/50 border-white/10 focus-visible:ring-primary"
                  disabled={sending}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!newMessage.trim() || sending}
                  className="bg-primary hover:bg-primary/90 shrink-0"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
              <MessageCircle className="w-10 h-10 opacity-50" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Your Messages</h2>
            <p className="max-w-xs">Select a chat from the list to start messaging.</p>
          </div>
        )}
      </div>
      <NewChatDialog
        open={isNewChatOpen}
        onOpenChange={setIsNewChatOpen}
        onChatCreated={handleChatCreated}
      />
      {activeChat && (
        <ChatSettingsDialog
          open={isSettingsOpen}
          onOpenChange={setIsSettingsOpen}
          chat={activeChat}
          onUpdate={handleChatUpdated}
        />
      )}
    </div>
  );
}