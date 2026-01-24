import React, { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, MessageCircle, Bell, Search, Plus } from 'lucide-react';
import { api } from '@/lib/api-client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import type { Notification, Chat, ChatMessage, User } from '@shared/types';
import { NotificationItem } from '@/components/activity/NotificationItem';
import { cn } from '@/lib/utils';
import { NewChatDialog } from '@/components/inbox/NewChatDialog';
export function InboxPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('activity');
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
          <MessagesView />
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
    fetchNotifications();
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
function MessagesView() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Fetch Chats
  useEffect(() => {
    const fetchChats = async () => {
      try {
        setLoadingChats(true);
        const res = await api<{ items: Chat[] }>('/api/chats');
        setChats(res.items);
      } catch (error) {
        console.error(error);
        toast.error('Failed to load chats');
      } finally {
        setLoadingChats(false);
      }
    };
    fetchChats();
  }, []);
  // Fetch Messages when chat selected
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
  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChatId || !user) return;
    try {
      setSending(true);
      const res = await api<ChatMessage>(`/api/chats/${selectedChatId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ userId: user.id, text: newMessage.trim() })
      });
      setMessages(prev => [...prev, res]);
      setNewMessage('');
    } catch (error) {
      console.error(error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };
  const handleChatCreated = (chat: Chat) => {
    setChats(prev => [chat, ...prev]);
    setSelectedChatId(chat.id);
  };
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
        <p>Please log in to view messages.</p>
      </div>
    );
  }
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
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
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
                      <span className="text-[10px] text-muted-foreground">12:30 PM</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      Click to view messages
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
        {selectedChatId ? (
          <>
            {/* Chat Header */}
            <div className="h-16 border-b border-white/10 flex items-center px-4 bg-card/30 backdrop-blur-sm">
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
                  {chats.find(c => c.id === selectedChatId)?.title.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="font-semibold text-white">
                {chats.find(c => c.id === selectedChatId)?.title}
              </span>
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
                            "max-w-[75%] px-4 py-2 rounded-2xl text-sm",
                            isMe
                              ? "bg-primary text-white rounded-br-none"
                              : "bg-secondary text-white rounded-bl-none"
                          )}
                        >
                          {msg.text}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>
            {/* Input Area */}
            <div className="p-4 border-t border-white/10 bg-card/30">
              <form onSubmit={handleSendMessage} className="flex gap-2">
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
    </div>
  );
}