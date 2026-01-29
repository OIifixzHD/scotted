/**
 * Minimal real-world demo: One Durable Object instance per entity (User, ChatBoard, Post), with Indexes for listing.
 */
import { IndexedEntity, Index, Entity } from "./core-utils";
import type { Env } from "./core-utils";
import type { User, Chat, ChatMessage, Post, Comment, Notification, Report, UserSettings, SavedSound } from "@shared/types";
import { MOCK_CHAT_MESSAGES, MOCK_CHATS, MOCK_USERS, MOCK_POSTS } from "@shared/mock-data";
// Helper type matching the one in core-utils (which isn't exported)
type Doc<T> = { v: number; data: T };
// SYSTEM ENTITY
export interface SystemSettings {
  maintenanceMode: boolean;
  disableSignups: boolean;
  readOnlyMode: boolean;
  announcement: string;
  announcementLevel: 'info' | 'warning' | 'destructive';
  strictBanEnforcement: boolean;
  minAge: number;
}
export class SystemEntity extends Entity<SystemSettings> {
  static readonly entityName = "system";
  static readonly initialState: SystemSettings = {
    maintenanceMode: false,
    disableSignups: false,
    readOnlyMode: false,
    announcement: "",
    announcementLevel: "info",
    strictBanEnforcement: false,
    minAge: 13
  };
  async getSettings(): Promise<SystemSettings> {
    return this.getState();
  }
  async updateSettings(partial: Partial<SystemSettings>): Promise<SystemSettings> {
    return this.mutate(s => ({ ...s, ...partial }));
  }
}
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
    savedSounds: [],
    createdAt: 0,
    echoes: 0,
    lastDailyReward: 0,
    avatarDecoration: "none",
    unlockedDecorations: ["none"],
    badge: "none",
    directMessages: {},
    settings: {
      notifications: { paused: false, newFollowers: true, interactions: true },
      privacy: { privateAccount: false },
      content: { autoplay: true, reducedMotion: false }
    },
    dateOfBirth: 0,
    isAdult: false
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
  /**
   * Add a direct message mapping
   */
  async addDirectMessage(targetId: string, chatId: string): Promise<void> {
    await this.mutate(s => ({
      ...s,
      directMessages: { ...(s.directMessages || {}), [targetId]: chatId }
    }));
  }
  /**
   * Add Echoes (Virtual Currency)
   */
  async addEchoes(amount: number): Promise<number> {
    const newState = await this.mutate(s => ({
      ...s,
      echoes: (s.echoes || 0) + amount
    }));
    return newState.echoes || 0;
  }
  /**
   * Deduct Echoes
   */
  async deductEchoes(amount: number): Promise<number> {
    const state = await this.getState();
    if ((state.echoes || 0) < amount) {
        throw new Error("Insufficient Echoes");
    }
    const newState = await this.mutate(s => ({
      ...s,
      echoes: (s.echoes || 0) - amount
    }));
    return newState.echoes || 0;
  }
  /**
   * Purchase Decoration
   */
  async purchaseDecoration(decorationId: string, cost: number): Promise<User> {
    const state = await this.getState();
    const unlocked = state.unlockedDecorations || ['none'];
    if (unlocked.includes(decorationId)) {
        return state; // Already owned
    }
    // Deduct cost first (will throw if insufficient)
    await this.deductEchoes(cost);
    // Add to unlocked list
    const newState = await this.mutate(s => ({
        ...s,
        unlockedDecorations: [...(s.unlockedDecorations || ['none']), decorationId]
    }));
    return newState;
  }
  /**
   * Claim Daily Reward
   */
  async claimDailyReward(amount: number): Promise<{ success: boolean, balance: number, nextReward: number }> {
    const state = await this.getState();
    const now = Date.now();
    const lastReward = state.lastDailyReward || 0;
    const cooldown = 24 * 60 * 60 * 1000; // 24 hours
    if (now - lastReward < cooldown) {
        throw new Error(`Reward not ready. Next reward in ${Math.ceil((lastReward + cooldown - now) / 60000)} minutes.`);
    }
    const newState = await this.mutate(s => ({
        ...s,
        echoes: (s.echoes || 0) + amount,
        lastDailyReward: now
    }));
    return {
        success: true,
        balance: newState.echoes || 0,
        nextReward: now + cooldown
    };
  }
  /**
   * Toggle Sound Favorite
   */
  async toggleSoundFavorite(sound: SavedSound): Promise<User> {
    return this.mutate(state => {
      const saved = state.savedSounds || [];
      const exists = saved.some(s => s.id === sound.id);
      let newSaved: SavedSound[];
      if (exists) {
        newSaved = saved.filter(s => s.id !== sound.id);
      } else {
        newSaved = [...saved, sound];
      }
      return { ...state, savedSounds: newSaved };
    });
  }
  protected override async ensureState(): Promise<User> {
    const s = await super.ensureState();
    // Migration logic: Ensure settings object exists for legacy users
    if (!s.settings) {
      const defaults = UserEntity.initialState.settings!;
      s.settings = { ...defaults };
      this._state = s;
    }
    // Migration: Ensure unlockedDecorations exists
    if (!s.unlockedDecorations) {
        s.unlockedDecorations = ['none'];
        this._state = s;
    }
    // Migration: Ensure lastDailyReward exists
    if (s.lastDailyReward === undefined) {
        s.lastDailyReward = 0;
        this._state = s;
    }
    // Migration: Ensure savedSounds exists
    if (!s.savedSounds) {
        s.savedSounds = [];
        this._state = s;
    }
    // Migration: Ensure dateOfBirth exists
    if (s.dateOfBirth === undefined) {
        s.dateOfBirth = 0;
        this._state = s;
    }
    return s;
  }
}
// POST ENTITY
export class PostEntity extends IndexedEntity<Post> {
  static readonly entityName = "post";
  static readonly indexName = "posts";
  static readonly initialState: Post = {
    id: "",
    userId: "",
    type: 'video',
    videoUrl: "",
    caption: "",
    likes: 0,
    likedBy: [],
    saves: 0,
    savedBy: [],
    comments: 0,
    shares: 0,
    views: 0,
    promotedUntil: 0,
    createdAt: 0,
    commentsList: [],
    soundId: 'default-sound',
    soundName: 'Original Audio',
    filter: 'none',
    overlays: [],
    isMature: false
  };
  static seedData = MOCK_POSTS;
  async saveVideoBinary(stream: ReadableStream<Uint8Array>, mimeType: string): Promise<string> {
    const CHUNK_SIZE = 128 * 1024; // 128KB chunks (DO limit)
    let chunkIndex = 0;
    let totalLength = 0;
    let buffer = new Uint8Array(0);
    const reader = stream.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const newBuffer = new Uint8Array(buffer.length + value.length);
        newBuffer.set(buffer);
        newBuffer.set(value, buffer.length);
        buffer = newBuffer;
        while (buffer.length >= CHUNK_SIZE) {
          const chunk = buffer.slice(0, CHUNK_SIZE);
          buffer = buffer.slice(CHUNK_SIZE);
          const key = `video:${this.id}:${chunkIndex}`;
          await this.stub.casPut(key, 0, chunk);
          chunkIndex++;
          totalLength += chunk.length;
        }
      }
      if (buffer.length > 0) {
        const key = `video:${this.id}:${chunkIndex}`;
        await this.stub.casPut(key, 0, buffer);
        chunkIndex++;
        totalLength += buffer.length;
      }
    } finally {
      reader.releaseLock();
    }
    // Save metadata with format indicator
    const metaKey = `video:${this.id}:meta`;
    const meta = { count: chunkIndex, mimeType, size: totalLength, format: 'binary' };
    for(let attempt=0; attempt<3; attempt++) {
        const doc = (await this.stub.getDoc(metaKey)) as Doc<typeof meta> | null;
        const v = doc ? doc.v : 0;
        const res = await this.stub.casPut(metaKey, v, meta);
        if (res.ok) break;
    }
    return `/api/content/video/${this.id}`;
  }
  async getVideoMetadata(): Promise<{ count: number, mimeType: string, size: number, format?: string } | null> {
    const metaKey = `video:${this.id}:meta`;
    const doc = await this.stub.getDoc(metaKey) as Doc<{ count: number, mimeType: string, size: number, format?: string }> | null;
    return doc?.data ?? null;
  }
  async getVideoChunk(index: number): Promise<Uint8Array | null> {
    const key = `video:${this.id}:${index}`;
    const doc = await this.stub.getDoc(key) as Doc<unknown> | null;
    if (!doc || doc.data === undefined) return null;
    if (doc.data instanceof Uint8Array) {
        return doc.data;
    } else if (typeof doc.data === 'string') {
        const binaryString = atob(doc.data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    } else if (Array.isArray(doc.data)) {
       return new Uint8Array(doc.data as number[]);
    }
    return null;
  }
  // --- Audio Storage Methods ---
  async saveAudioBinary(stream: ReadableStream<Uint8Array>, mimeType: string): Promise<string> {
    const CHUNK_SIZE = 128 * 1024; // 128KB chunks
    let chunkIndex = 0;
    let totalLength = 0;
    let buffer = new Uint8Array(0);
    const reader = stream.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const newBuffer = new Uint8Array(buffer.length + value.length);
        newBuffer.set(buffer);
        newBuffer.set(value, buffer.length);
        buffer = newBuffer;
        while (buffer.length >= CHUNK_SIZE) {
          const chunk = buffer.slice(0, CHUNK_SIZE);
          buffer = buffer.slice(CHUNK_SIZE);
          const key = `audio:${this.id}:${chunkIndex}`;
          await this.stub.casPut(key, 0, chunk);
          chunkIndex++;
          totalLength += chunk.length;
        }
      }
      if (buffer.length > 0) {
        const key = `audio:${this.id}:${chunkIndex}`;
        await this.stub.casPut(key, 0, buffer);
        chunkIndex++;
        totalLength += buffer.length;
      }
    } finally {
      reader.releaseLock();
    }
    // Save metadata
    const metaKey = `audio:${this.id}:meta`;
    const meta = { count: chunkIndex, mimeType, size: totalLength, format: 'binary' };
    for(let attempt=0; attempt<3; attempt++) {
        const doc = (await this.stub.getDoc(metaKey)) as Doc<typeof meta> | null;
        const v = doc ? doc.v : 0;
        const res = await this.stub.casPut(metaKey, v, meta);
        if (res.ok) break;
    }
    return `/api/content/audio/${this.id}`;
  }
  async getAudioMetadata(): Promise<{ count: number, mimeType: string, size: number, format?: string } | null> {
    const metaKey = `audio:${this.id}:meta`;
    const doc = await this.stub.getDoc(metaKey) as Doc<{ count: number, mimeType: string, size: number, format?: string }> | null;
    return doc?.data ?? null;
  }
  async getAudioChunk(index: number): Promise<Uint8Array | null> {
    const key = `audio:${this.id}:${index}`;
    const doc = await this.stub.getDoc(key) as Doc<unknown> | null;
    if (!doc || doc.data === undefined) return null;
    if (doc.data instanceof Uint8Array) {
        return doc.data;
    } else if (typeof doc.data === 'string') {
        const binaryString = atob(doc.data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    } else if (Array.isArray(doc.data)) {
       return new Uint8Array(doc.data as number[]);
    }
    return null;
  }
  static async search(env: Env, query: string): Promise<Post[]> {
    await this.ensureSeed(env);
    const { items: posts } = await this.list(env, null, 1000);
    const lowerQuery = query.toLowerCase();
    return posts.filter(p =>
      (p.caption && p.caption.toLowerCase().includes(lowerQuery)) ||
      (p.tags && p.tags.some(t => t.toLowerCase().includes(lowerQuery))) ||
      (p.title && p.title.toLowerCase().includes(lowerQuery)) ||
      (p.artist && p.artist.toLowerCase().includes(lowerQuery))
    );
  }
  async toggleLike(userId: string): Promise<{ likes: number, isLiked: boolean }> {
    const state = await this.getState();
    const likedBy = state.likedBy || [];
    const isLiked = likedBy.includes(userId);
    let newLikedBy: string[];
    let newLikes: number;
    if (isLiked) {
      newLikedBy = likedBy.filter(id => id !== userId);
      newLikes = Math.max(0, (state.likes || 0) - 1);
    } else {
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
  async toggleSave(userId: string): Promise<{ saves: number, isSaved: boolean }> {
    const state = await this.getState();
    const savedBy = state.savedBy || [];
    const isSaved = savedBy.includes(userId);
    let newSavedBy: string[];
    let newSaves: number;
    if (isSaved) {
      newSavedBy = savedBy.filter(id => id !== userId);
      newSaves = Math.max(0, (state.saves || 0) - 1);
    } else {
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
  async incrementShares(): Promise<number> {
    const newState = await this.mutate(s => ({
      ...s,
      shares: (s.shares || 0) + 1
    }));
    return newState.shares || 0;
  }
  async incrementViews(): Promise<number> {
    const newState = await this.mutate(s => ({
      ...s,
      views: (s.views || 0) + 1
    }));
    return newState.views || 0;
  }
  async addComment(userId: string, text: string, userSnapshot: User): Promise<Comment> {
    const newComment: Comment = {
      id: crypto.randomUUID(),
      postId: this.id,
      userId,
      text,
      createdAt: Date.now(),
      user: userSnapshot,
      likes: 0,
      likedBy: []
    };
    await this.mutate(state => ({
      ...state,
      comments: (state.comments || 0) + 1,
      commentsList: [...(state.commentsList || []), newComment]
    }));
    return newComment;
  }
  async deleteComment(commentId: string): Promise<boolean> {
    let removed = false;
    await this.mutate(state => {
      const list = state.commentsList || [];
      const newList = list.filter(c => c.id !== commentId);
      if (newList.length !== list.length) {
        removed = true;
      }
      return {
        ...state,
        commentsList: newList,
        comments: newList.length
      };
    });
    return removed;
  }
  async toggleCommentLike(commentId: string, userId: string): Promise<{ likes: number, isLiked: boolean } | null> {
    let result: { likes: number, isLiked: boolean } | null = null;
    await this.mutate(state => {
      const list = state.commentsList || [];
      const commentIndex = list.findIndex(c => c.id === commentId);
      if (commentIndex === -1) {
        return state;
      }
      const comment = list[commentIndex];
      const likedBy = comment.likedBy || [];
      const isLiked = likedBy.includes(userId);
      let newLikedBy: string[];
      let newLikes: number;
      if (isLiked) {
        newLikedBy = likedBy.filter(id => id !== userId);
        newLikes = Math.max(0, (comment.likes || 0) - 1);
      } else {
        newLikedBy = [...likedBy, userId];
        newLikes = (comment.likes || 0) + 1;
      }
      const updatedComment = {
        ...comment,
        likes: newLikes,
        likedBy: newLikedBy
      };
      const newList = [...list];
      newList[commentIndex] = updatedComment;
      result = { likes: newLikes, isLiked: !isLiked };
      return {
        ...state,
        commentsList: newList
      };
    });
    return result;
  }
  async getComments(): Promise<Comment[]> {
    const state = await this.getState();
    return state.commentsList || [];
  }
  async promote(durationMs: number): Promise<Post> {
    const now = Date.now();
    const newState = await this.mutate(s => ({
        ...s,
        promotedUntil: now + durationMs
    }));
    return newState;
  }
  protected override async ensureState(): Promise<Post> {
    const s = await super.ensureState();
    if (s.isMature === undefined) {
        s.isMature = false;
        this._state = s;
    }
    return s;
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
  static readonly initialState: ChatBoardState = {
    id: "",
    title: "",
    messages: [],
    participants: [],
    type: 'group',
    updatedAt: Date.now(),
    visibility: 'private',
    canType: 'all',
    ownerId: ''
  };
  static seedData = SEED_CHAT_BOARDS;
  async listMessages(): Promise<ChatMessage[]> {
    const { messages } = await this.getState();
    return messages;
  }
  async sendMessage(userId: string, text: string, mediaUrl?: string, mediaType?: 'image' | 'video'): Promise<ChatMessage> {
    const msg: ChatMessage = {
      id: crypto.randomUUID(),
      chatId: this.id,
      userId,
      text,
      ts: Date.now(),
      status: 'sent',
      mediaUrl,
      mediaType
    };
    await this.mutate(s => ({
      ...s,
      messages: [...s.messages, msg],
      lastMessage: msg,
      updatedAt: msg.ts
    }));
    return msg;
  }
  async updateSettings(updates: Partial<Chat>): Promise<Chat> {
    const newState = await this.mutate(s => ({
      ...s,
      ...updates
    }));
    const { messages, ...chatData } = newState;
    return chatData;
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
    const { items } = await this.list(env, null, 500);
    const userNotifications = items.filter(n => n.userId === userId);
    userNotifications.sort((a, b) => b.createdAt - a.createdAt);
    return userNotifications.slice(0, limit);
  }
  static async markAllRead(env: Env, userId: string): Promise<void> {
    const { items } = await this.list(env, null, 500);
    const unread = items.filter(n => n.userId === userId && !n.read);
    await Promise.all(unread.map(n => {
        const entity = new NotificationEntity(env, n.id);
        return entity.mutate(state => ({ ...state, read: true }));
    }));
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
    items.sort((a, b) => b.createdAt - a.createdAt);
    return items;
  }
}