export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export interface User {
  id: string;
  name: string; // Username/Handle (Immutable)
  displayName?: string; // Visual Name (Mutable)
  password?: string; // Added for auth
  avatar?: string;
  bio?: string;
  followers?: number;
  following?: number;
  followingIds?: string[]; // Added for social graph
  avatarDecoration?: string; // 'gold-border', 'neon-glow', 'blue-fire', etc.
  bannerStyle?: string; // 'default', 'cosmic', 'neon', 'sunset', 'ocean', 'midnight'
  isAdmin?: boolean;
  // Phase 2: Governance & Security
  isVerified?: boolean;
  bannedUntil?: number; // Timestamp
  banReason?: string;
  bannedBy?: string; // Admin who issued the ban
  blockedUserIds?: string[];
  // Phase 4: Personalization
  notInterestedPostIds?: string[];
  createdAt?: number; // Added for analytics
}
export interface Comment {
  id: string;
  postId: string;
  userId: string;
  text: string;
  createdAt: number;
  user?: User; // Snapshot of user data for display
}
export interface Post {
  id: string;
  userId: string;
  videoUrl: string; // Can be a URL or a Base64 Data URI
  caption: string;
  likes: number;
  likedBy?: string[]; // Track user IDs who liked the post
  saves?: number; // Track number of bookmarks
  savedBy?: string[]; // Track user IDs who saved the post
  comments: number;
  shares: number;
  views?: number; // Added for view tracking
  user?: User; // Hydrated user data
  tags?: string[];
  createdAt: number;
  commentsList?: Comment[]; // List of comments
  soundId?: string;
  soundName?: string;
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
export interface Notification {
  id: string;
  userId: string; // Recipient
  actorId: string; // Who performed the action
  type: 'like' | 'comment' | 'follow';
  postId?: string; // Optional, for like/comment
  read: boolean;
  createdAt: number;
  actor?: User; // Hydrated
  post?: Post; // Hydrated (optional)
}
export interface Report {
  id: string;
  reporterId: string;
  targetId: string;
  targetType: 'user' | 'post'; // Added to distinguish report targets
  reason: string;
  description?: string;
  createdAt: number;
  status: 'pending' | 'resolved' | 'dismissed';
  reporter?: User; // Hydrated
  target?: User; // Hydrated (if targetType is user)
  post?: Post; // Hydrated (if targetType is post)
}
// Analytics Types
export interface ChartDataPoint {
  name: string;
  [key: string]: string | number;
}
export interface AdminStats {
  totalUsers: number;
  totalPosts: number;
  totalViews: number;
  totalEngagement: number;
  totalLikes: number;
  totalComments: number;
  userGrowth: ChartDataPoint[];
  activity: ChartDataPoint[];
}