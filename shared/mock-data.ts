import type { User, Chat, ChatMessage, Post } from './types';
// Seed the initial Admin User
export const MOCK_USERS: User[] = [
  {
    id: 'admin-seed-001',
    name: 'AdminUser001',
    displayName: 'Admin',
    password: 'ABCDEF', // In a real app, this would be hashed
    isAdmin: true,
    isVerified: true,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin',
    bio: 'System Administrator',
    followers: 0,
    following: 0,
    followingIds: [],
    blockedUserIds: [],
    bannedUntil: 0,
    banReason: '',
    avatarDecoration: 'verified-pro'
  }
];
export const MOCK_CHATS: Chat[] = [];
export const MOCK_CHAT_MESSAGES: ChatMessage[] = [];
export const MOCK_POSTS: Post[] = [];