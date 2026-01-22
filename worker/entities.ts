/**
 * Minimal real-world demo: One Durable Object instance per entity (User, ChatBoard, Post), with Indexes for listing.
 */
import { IndexedEntity, Index } from "./core-utils";
import type { Env } from "./core-utils";
import type { User, Chat, ChatMessage, Post } from "@shared/types";
import { MOCK_CHAT_MESSAGES, MOCK_CHATS, MOCK_USERS, MOCK_POSTS } from "@shared/mock-data";
// USER ENTITY
export class UserEntity extends IndexedEntity<User> {
  static readonly entityName = "user";
  static readonly indexName = "users";
  static readonly initialState: User = { id: "", name: "" };
  static seedData = MOCK_USERS;
  /**
   * Helper to find a user by username.
   * In a production app at scale, you would use a separate Index (e.g. "users-by-name")
   * mapping name -> id. For this demo, we scan the existing list.
   */
  static async findByUsername(env: Env, username: string): Promise<User | null> {
    // Ensure seeds exist so we can find default users too
    await this.ensureSeed(env);
    // List all users (up to a reasonable limit for this demo)
    // Since we are using a single DO, listing is fast.
    const idx = new Index<string>(env, this.indexName);
    const { items: ids } = await idx.page(null, 1000);
    // Fetch all user states in parallel
    const users = await Promise.all(ids.map(id => new UserEntity(env, id).getState()));
    // Find match (case-insensitive)
    return users.find(u => u.name.toLowerCase() === username.toLowerCase()) || null;
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
    createdAt: 0
  };
  static seedData = MOCK_POSTS;
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