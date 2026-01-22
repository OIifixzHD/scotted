import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api-client';
import type { Chat, ChatMessage, User } from '@shared/types';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, ArrowLeft, Search, MoreVertical, Phone, Video } from 'lucide-react';
import { format } from 'date-fns';
export function MessagesPage() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [inputText, setInputText] = useState('');
  const [currentUser] = useState<User>({ id: 'u1', name: 'NeonDrifter' }); // Mock current user
  const scrollRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  // Fetch Chats on Mount
  useEffect(() => {
    const fetchChats = async () => {
      try {
        setLoadingChats(true);
        const response = await api<{ items: Chat[] }>('/api/chats');
        setChats(response.items);
      } catch (error) {
        console.error('Failed to fetch chats:', error);
      } finally {
        setLoadingChats(false);
      }
    };
    fetchChats();
  }, []);
  // Fetch Messages when Chat Selected & Setup Polling
  useEffect(() => {
    if (!selectedChatId) {
      setMessages([]);
      return;
    }
    const fetchMessages = async (isPolling = false) => {
      try {
        if (!isPolling) setLoadingMessages(true);
        const msgs = await api<ChatMessage[]>(`/api/chats/${selectedChatId}/messages`);
        setMessages(msgs);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      } finally {
        if (!isPolling) setLoadingMessages(false);
      }
    };
    fetchMessages();
    // Poll every 3 seconds
    pollingRef.current = setInterval(() => fetchMessages(true), 3000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [selectedChatId]);
  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !selectedChatId) return;
    const text = inputText.trim();
    setInputText(''); // Optimistic clear
    try {
      await api(`/api/chats/${selectedChatId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          userId: currentUser.id,
          text: text
        })
      });
      // Fetch immediately to update UI
      const msgs = await api<ChatMessage[]>(`/api/chats/${selectedChatId}/messages`);
      setMessages(msgs);
    } catch (error) {
      console.error('Failed to send message:', error);
      setInputText(text); // Restore on error
    }
  };
  const selectedChat = chats.find(c => c.id === selectedChatId);
  return (
    <div className="h-full w-full">
      <div className="flex h-full max-w-7xl mx-auto w-full bg-black/40 backdrop-blur-xl border-x border-white/5 overflow-hidden">
        {/* Sidebar - Chat List */}
        <div className={cn(
          "w-full md:w-80 lg:w-96 flex-col border-r border-white/5 bg-sidebar/50",
          selectedChatId ? "hidden md:flex" : "flex"
        )}>
          <div className="p-4 border-b border-white/5 space-y-4">
            <h1 className="text-xl font-bold font-display px-2">Messages</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search messages..." 
                className="pl-9 bg-secondary/50 border-white/10 rounded-xl"
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2 space-y-1">
              {loadingChats ? (
                <div className="flex justify-center p-4">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : chats.length === 0 ? (
                <div className="text-center p-8 text-muted-foreground text-sm">
                  No conversations yet.
                </div>
              ) : (
                chats.map(chat => (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedChatId(chat.id)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-left group",
                      selectedChatId === chat.id 
                        ? "bg-primary/10 border border-primary/20" 
                        : "hover:bg-white/5 border border-transparent"
                    )}
                  >
                    <Avatar className="w-12 h-12 border border-white/10">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${chat.title}`} />
                      <AvatarFallback>{chat.title.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <span className={cn(
                          "font-semibold truncate",
                          selectedChatId === chat.id ? "text-primary" : "text-foreground"
                        )}>
                          {chat.title}
                        </span>
                        <span className="text-[10px] text-muted-foreground">12:30 PM</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate group-hover:text-foreground/80 transition-colors">
                        Click to start chatting...
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
        {/* Main - Conversation View */}
        <div className={cn(
          "flex-1 flex-col bg-background/50 relative",
          !selectedChatId ? "hidden md:flex" : "flex"
        )}>
          {selectedChatId ? (
            <>
              {/* Chat Header */}
              <div className="h-16 border-b border-white/5 flex items-center justify-between px-4 bg-black/20 backdrop-blur-md z-10">
                <div className="flex items-center gap-3">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="md:hidden -ml-2 text-muted-foreground"
                    onClick={() => setSelectedChatId(null)}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <Avatar className="w-10 h-10 border border-white/10">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${selectedChat?.title}`} />
                    <AvatarFallback>{selectedChat?.title.substring(0, 2)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold text-sm">{selectedChat?.title}</h2>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-xs text-muted-foreground">Online</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                    <Phone className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                    <Video className="w-5 h-5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                    <MoreVertical className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              {/* Messages Area */}
              <div 
                className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
                ref={scrollRef}
              >
                {loadingMessages ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary/50" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2 opacity-50">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                      <Send className="w-8 h-8" />
                    </div>
                    <p>No messages yet. Say hello!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.userId === currentUser.id;
                    return (
                      <div 
                        key={msg.id} 
                        className={cn(
                          "flex w-full",
                          isMe ? "justify-end" : "justify-start"
                        )}
                      >
                        <div className={cn(
                          "max-w-[75%] md:max-w-[60%] rounded-2xl px-4 py-2.5 text-sm shadow-sm",
                          isMe 
                            ? "bg-primary text-primary-foreground rounded-br-none" 
                            : "bg-secondary text-secondary-foreground rounded-bl-none"
                        )}>
                          <p>{msg.text}</p>
                          <p className={cn(
                            "text-[10px] mt-1 text-right opacity-70",
                            isMe ? "text-primary-foreground" : "text-muted-foreground"
                          )}>
                            {format(new Date(msg.ts), 'h:mm a')}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              {/* Input Area */}
              <div className="p-4 bg-black/20 backdrop-blur-md border-t border-white/5">
                <form onSubmit={handleSendMessage} className="flex gap-2 items-end max-w-4xl mx-auto">
                  <Input 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type a message..."
                    className="bg-secondary/50 border-white/10 min-h-[44px] rounded-xl focus-visible:ring-primary/50"
                  />
                  <Button 
                    type="submit" 
                    size="icon"
                    disabled={!inputText.trim()}
                    className="h-11 w-11 rounded-xl bg-primary hover:bg-primary/90 shadow-glow transition-all active:scale-95 shrink-0"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="hidden md:flex flex-col items-center justify-center h-full text-muted-foreground space-y-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500/20 to-teal-500/20 flex items-center justify-center shadow-glow">
                <Send className="w-10 h-10 text-primary" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-xl font-bold text-foreground">Your Messages</h3>
                <p>Select a conversation to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}