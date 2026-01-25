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
    displayName: "",
    isVerified: false,
    bannedUntil: 0,
    banReason: "",
    bannedBy: "",
    blockedUserIds: [],
    bannerStyle: "default",
    notInterestedPostIds: [],
    createdAt: 0
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
   * Search users by name, display name, or bio
   */
  static async search(env: Env, query: string): Promise<User[]> {
    await this.ensureSeed(env);
    // For demo scale, we fetch a large batch and filter in memory
    const { items: users } = await this.list(env, null, 1000);
    const lowerQuery = query.toLowerCase();
    return users.filter(u =>
      u.name.toLowerCase().includes(lowerQuery) ||
      (u.displayName && u.displayName.toLowerCase().includes(lowerQuery)) ||
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
  /**
   * Mark a post as not interested
   */
  async markNotInterested(postId: string): Promise<void> {
    await this.mutate(s => {
        const current = s.notInterestedPostIds || [];
        if (current.includes(postId)) return s;
        return { ...s, notInterestedPostIds: [...current, postId] };
    });
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
    saves: 0,
    savedBy: [],
    comments: 0,
    shares: 0,
    views: 0,
    createdAt: 0,
    commentsList: [],
    soundId: 'default-sound',
    soundName: 'Original Audio'
  };
  static seedData = MOCK_POSTS;
  /**
   * Save a large video file by chunking it into smaller pieces in the Durable Object storage.
   * Returns the URL where the video can be served from.
   */
  async saveVideo(base64String: string): Promise<string> {
    const CHUNK_SIZE = 100 * 1024; // 100KB chunks to stay safely under 128KB limit
    // Extract MIME type if present
    let mimeType = 'video/mp4';
    let data = base64String;
    if (base64String.startsWith('data:')) {
        const matches = base64String.match(/^data:([^;]+);base64,(.+)$/);
        if (matches) {
            mimeType = matches[1];
            data = matches[2];
        }
    }
    const totalLength = data.length;
    const chunks = Math.ceil(totalLength / CHUNK_SIZE);
    // Save chunks
    for (let i = 0; i < chunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, data.length);
        const chunk = data.substring(start, end);
        const key = `video:${this.id}:${i}`;
        // Force put with retry for version mismatch
        let saved = false;
        for(let attempt=0; attempt<3; attempt++) {
            const doc = await this.stub.getDoc<string>(key);
            const v = doc?.v ?? 0;
            const res = await this.stub.casPut(key, v, chunk);
            if (res.ok) {
                saved = true;
                break;
            }
        }
        if (!saved) throw new Error(`Failed to save chunk ${i}`);
    }
    // Save metadata
    const metaKey = `video:${this.id}:meta`;
    const meta = { count: chunks, mimeType, size: totalLength };
    for(let attempt=0; attempt<3; attempt++) {
        const doc = await this.stub.getDoc(metaKey);
        const v = doc?.v ?? 0;
        const res = await this.stub.casPut(metaKey, v, meta);
        if (res.ok) break;
    }
    return `/api/content/video/${this.id}`;
  }
  /**
   * Retrieve and reassemble video chunks.
   */
  async getVideoData(): Promise<{ data: Uint8Array, mimeType: string } | null> {
    const metaKey = `video:${this.id}:meta`;
    const metaDoc = await this.stub.getDoc<{ count: number, mimeType: string }>(metaKey);
    if (!metaDoc) return null;
    const { count, mimeType } = metaDoc.data;
    const chunks: string[] = [];
    for (let i = 0; i < count; i++) {
        const key = `video:${this.id}:${i}`;
        const doc = await this.stub.getDoc<string>(key);
        if (doc) chunks.push(doc.data);
    }
    const fullBase64 = chunks.join('');
    // Convert base64 to Uint8Array
    const binaryString = atob(fullBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return { data: bytes, mimeType };
  }
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
   * Toggle save (bookmark) for a user
   */
  async toggleSave(userId: string): Promise<{ saves: number, isSaved: boolean }> {
    const state = await this.getState();
    const savedBy = state.savedBy || [];
    const isSaved = savedBy.includes(userId);
    let newSavedBy: string[];
    let newSaves: number;
    if (isSaved) {
      // Unsave
      newSavedBy = savedBy.filter(id => id !== userId);
      newSaves = Math.max(0, (state.saves || 0) - 1);
    } else {
      // Save
      newSavedBy = [...savedBy, userId];
      newSaves = (state.saves || 0) + 1;
    }
    await this.mutate(s => ({
      ...s,
      saves: newSaves,
      savedBy: newSavedBy
    }));
    return { saves: newSaves, isSaved: !isSaved };
  }
  /**
   * Increment share count
   */
  async incrementShares(): Promise<number> {
    const newState = await this.mutate(s => ({
      ...s,
      shares: (s.shares || 0) + 1
    }));
    return newState.shares || 0;
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
    targetType: "user",
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