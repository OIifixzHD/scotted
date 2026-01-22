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
// Using reliable Google Storage sample videos to prevent 404s
export const MOCK_POSTS: Post[] = [
  {
    id: 'p1',
    userId: 'u1',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    caption: 'The city never sleeps 🌃 #nightlife #vibes',
    likes: 1240,
    comments: 45,
    shares: 12,
    tags: ['nightlife', 'vibes'],
    createdAt: Date.now() - 100000
  },
  {
    id: 'p2',
    userId: 'u2',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    caption: 'Escape the ordinary 🌿 #nature #travel',
    likes: 856,
    comments: 23,
    shares: 5,
    tags: ['nature', 'travel'],
    createdAt: Date.now() - 200000
  },
  {
    id: 'p3',
    userId: 'u3',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    caption: 'Living for these moments 🎉 #fun #friends',
    likes: 5600,
    comments: 120,
    shares: 450,
    tags: ['fun', 'friends'],
    createdAt: Date.now() - 300000
  },
  {
    id: 'p4',
    userId: 'u1',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    caption: 'Speed and adrenaline 🏎️ #racing #fast',
    likes: 342,
    comments: 10,
    shares: 2,
    tags: ['racing', 'fast'],
    createdAt: Date.now() - 400000
  }
];