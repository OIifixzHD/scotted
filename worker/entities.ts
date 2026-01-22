/**
 * Minimal real-world demo: One Durable Object instance per entity (User, ChatBoard, Post), with Indexes for listing.
 */
import { IndexedEntity, Index } from "./core-utils";
import type { Env } from "./core-utils";
import type { User, Chat, ChatMessage, Post, Comment } from "@shared/types";
import { MOCK_CHAT_MESSAGES, MOCK_CHATS, MOCK_USERS, MOCK_POSTS } from "@shared/mock-data";
// USER ENTITY
export class UserEntity extends IndexedEntity<User> {
  static readonly entityName = "user";
  static readonly indexName = "users";
  static readonly initialState: User = { id: "", name: "" };
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
    comments: 0,
    shares: 0,
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