/**
 * Minimal real-world demo: One Durable Object instance per entity (User, ChatBoard, Post), with Indexes for listing.
 */
import { IndexedEntity, Index } from "./core-utils";
import type { Env } from "./core-utils";
import type { User, Chat, ChatMessage, Post, Comment, Notification, Report } from "@shared/types";
import { MOCK_CHAT_MESSAGES, MOCK_CHATS, MOCK_USERS, MOCK_POSTS } from "@shared/mock-data";
// USER ENTITY
export class UserEntity extends IndexedEntity<User> {
  static readonly entityName = "user";
  static readonly indexName = "users";
  static readonly initialState: User = {
    id: "",
    name: "",
    isVerified: false,
    bannedUntil: 0,
    banReason: "",
    blockedUserIds: []
  };
  static seedData = MOCK_USERS;
  /**
   * Helper to find a user by username.
   */
  static async findByUsername(env: Env, username: string): Promise<User | null> {
    await this.ensureSeed(env);
    const idx = new Index<string>(env, this.indexName);
    const { items: ids } = await idx.page(null, 1000);
    const users = await Promise.all(ids.map(id => new UserEntity(env, id).getState()));
    return users.find(u => u.name.toLowerCase() === username.toLowerCase()) || null;
  }
  /**
   * Search users by name or bio
   */
  static async search(env: Env, query: string): Promise<User[]> {
    await this.ensureSeed(env);
    // For demo scale, we fetch a large batch and filter in memory
    const { items: users } = await this.list(env, null, 1000);
    const lowerQuery = query.toLowerCase();
    return users.filter(u =>
      u.name.toLowerCase().includes(lowerQuery) ||
      (u.bio && u.bio.toLowerCase().includes(lowerQuery))
    );
  }
  /**
   * Admin update for stats and decorations
   */
  async updateAdminStats(updates: Partial<User>): Promise<User> {
    return this.mutate(state => ({
      ...state,
      ...updates
    }));
  }
  /**
   * Toggle block status for a target user
   */
  async toggleBlock(targetId: string): Promise<{ blocked: boolean, blockedUserIds: string[] }> {
    const state = await this.getState();
    const blockedIds = state.blockedUserIds || [];
    const isBlocked = blockedIds.includes(targetId);
    let newBlockedIds: string[];
    if (isBlocked) {
      newBlockedIds = blockedIds.filter(id => id !== targetId);
    } else {
      newBlockedIds = [...blockedIds, targetId];
    }
    await this.mutate(s => ({
      ...s,
      blockedUserIds: newBlockedIds
    }));
    return { blocked: !isBlocked, blockedUserIds: newBlockedIds };
  }
}
// POST ENTITY
export class PostEntity extends IndexedEntity<Post> {
  static readonly entityName = "post";
  static readonly indexName = "posts";
  static readonly initialState: Post = {
    id: "",
    userId: "",
    videoUrl: "",
    caption: "",
    likes: 0,
    likedBy: [],
    comments: 0,
    shares: 0,
    views: 0,
    createdAt: 0,
    commentsList: []
  };
  static seedData = MOCK_POSTS;
  /**
   * Search posts by caption or tags
   */
  static async search(env: Env, query: string): Promise<Post[]> {
    await this.ensureSeed(env);
    const { items: posts } = await this.list(env, null, 1000);
    const lowerQuery = query.toLowerCase();
    return posts.filter(p =>
      (p.caption && p.caption.toLowerCase().includes(lowerQuery)) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(lowerQuery)))
    );
  }
  /**
   * Toggle like for a user
   */
  async toggleLike(userId: string): Promise<{ likes: number, isLiked: boolean }> {
    const state = await this.getState();
    const likedBy = state.likedBy || [];
    const isLiked = likedBy.includes(userId);
    let newLikedBy: string[];
    let newLikes: number;
    if (isLiked) {
      // Unlike
      newLikedBy = likedBy.filter(id => id !== userId);
      newLikes = Math.max(0, (state.likes || 0) - 1);
    } else {
      // Like
      newLikedBy = [...likedBy, userId];
      newLikes = (state.likes || 0) + 1;
    }
    await this.mutate(s => ({
      ...s,
      likes: newLikes,
      likedBy: newLikedBy
    }));
    return { likes: newLikes, isLiked: !isLiked };
  }
  /**
   * Increment view count
   */
  async incrementViews(): Promise<number> {
    const newState = await this.mutate(s => ({
      ...s,
      views: (s.views || 0) + 1
    }));
    return newState.views || 0;
  }
  /**
   * Add a comment to the post
   */
  async addComment(userId: string, text: string, userSnapshot: User): Promise<Comment> {
    const newComment: Comment = {
      id: crypto.randomUUID(),
      postId: this.id,
      userId,
      text,
      createdAt: Date.now(),
      user: userSnapshot
    };
    await this.mutate(state => ({
      ...state,
      comments: (state.comments || 0) + 1,
      commentsList: [...(state.commentsList || []), newComment]
    }));
    return newComment;
  }
  /**
   * Get all comments for this post
   */
  async getComments(): Promise<Comment[]> {
    const state = await this.getState();
    return state.commentsList || [];
  }
}
// CHAT BOARD ENTITY
export type ChatBoardState = Chat & { messages: ChatMessage[] };
const SEED_CHAT_BOARDS: ChatBoardState[] = MOCK_CHATS.map(c => ({
  ...c,
  messages: MOCK_CHAT_MESSAGES.filter(m => m.chatId === c.id),
}));
export class ChatBoardEntity extends IndexedEntity<ChatBoardState> {
  static readonly entityName = "chat";
  static readonly indexName = "chats";
  static readonly initialState: ChatBoardState = { id: "", title: "", messages: [] };
  static seedData = SEED_CHAT_BOARDS;
  async listMessages(): Promise<ChatMessage[]> {
    const { messages } = await this.getState();
    return messages;
  }
  async sendMessage(userId: string, text: string): Promise<ChatMessage> {
    const msg: ChatMessage = { id: crypto.randomUUID(), chatId: this.id, userId, text, ts: Date.now() };
    await this.mutate(s => ({ ...s, messages: [...s.messages, msg] }));
    return msg;
  }
}
// NOTIFICATION ENTITY
export class NotificationEntity extends IndexedEntity<Notification> {
  static readonly entityName = "notification";
  static readonly indexName = "notifications";
  static readonly initialState: Notification = {
    id: "",
    userId: "",
    actorId: "",
    type: "like",
    read: false,
    createdAt: 0
  };
  static seedData = [];
  static async listForUser(env: Env, userId: string, limit: number = 50): Promise<Notification[]> {
    // In a real app, we would have a secondary index for userId.
    // For this demo with limited data, we list all and filter.
    const { items } = await this.list(env, null, 500);
    const userNotifications = items.filter(n => n.userId === userId);
    // Sort by newest first
    userNotifications.sort((a, b) => b.createdAt - a.createdAt);
    return userNotifications.slice(0, limit);
  }
}
// REPORT ENTITY
export class ReportEntity extends IndexedEntity<Report> {
  static readonly entityName = "report";
  static readonly indexName = "reports";
  static readonly initialState: Report = {
    id: "",
    reporterId: "",
    targetId: "",
    reason: "",
    createdAt: 0,
    status: 'pending'
  };
  static seedData = [];
  static async listAll(env: Env): Promise<Report[]> {
    const { items } = await this.list(env, null, 1000);
    // Sort by newest first
    items.sort((a, b) => b.createdAt - a.createdAt);
    return items;
  }
}