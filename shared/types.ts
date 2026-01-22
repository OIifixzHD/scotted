export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export interface User {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  followers?: number;
  following?: number;
}
export interface Post {
  id: string;
  userId: string;
  videoUrl: string;
  caption: string;
  likes: number;
  comments: number;
  shares: number;
  user?: User; // Hydrated user data
  tags?: string[];
  createdAt: number;
}
export interface Chat {
  id: string;
  title: string;
}
export interface ChatMessage {
  id: string;
  chatId: string;
  userId: string;
  text: string;
  ts: number; // epoch millis
}