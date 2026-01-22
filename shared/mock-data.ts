import type { User, Chat, ChatMessage, Post } from './types';
export const MOCK_USERS: User[] = [
  { 
    id: 'u1', 
    name: 'NeonDrifter', 
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NeonDrifter',
    bio: 'Chasing lights in the digital void.',
    followers: 1205,
    following: 45
  },
  { 
    id: 'u2', 
    name: 'CyberPunk_99', 
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CyberPunk',
    bio: 'Tech enthusiast & night owl.',
    followers: 8900,
    following: 120
  },
  { 
    id: 'u3', 
    name: 'VibeMaster', 
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Vibe',
    bio: 'Just good vibes only.',
    followers: 450,
    following: 300
  }
];
export const MOCK_CHATS: Chat[] = [
  { id: 'c1', title: 'General' },
];
export const MOCK_CHAT_MESSAGES: ChatMessage[] = [
  { id: 'm1', chatId: 'c1', userId: 'u1', text: 'Hello', ts: Date.now() },
];
// Using reliable public domain or creative commons video samples
export const MOCK_POSTS: Post[] = [
  {
    id: 'p1',
    userId: 'u1',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-waves-in-the-water-1164-large.mp4',
    caption: 'Ocean vibes 🌊 #chill #nature',
    likes: 1240,
    comments: 45,
    shares: 12,
    tags: ['chill', 'nature'],
    createdAt: Date.now() - 100000
  },
  {
    id: 'p2',
    userId: 'u2',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-tree-with-yellow-flowers-1173-large.mp4',
    caption: 'Spring is here! 🌸 #flowers #bloom',
    likes: 856,
    comments: 23,
    shares: 5,
    tags: ['flowers', 'bloom'],
    createdAt: Date.now() - 200000
  },
  {
    id: 'p3',
    userId: 'u3',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-stars-in-space-1610-large.mp4',
    caption: 'To the moon 🚀 #space #stars',
    likes: 5600,
    comments: 120,
    shares: 450,
    tags: ['space', 'stars'],
    createdAt: Date.now() - 300000
  },
  {
    id: 'p4',
    userId: 'u1',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-red-bull-finishing-the-race-in-first-place-43685-large.mp4',
    caption: 'Need for speed 🏎️ #racing #fast',
    likes: 342,
    comments: 10,
    shares: 2,
    tags: ['racing', 'fast'],
    createdAt: Date.now() - 400000
  }
];