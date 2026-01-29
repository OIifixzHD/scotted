export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export interface UserSettings {
  notifications: {
    paused: boolean;
    newFollowers: boolean;
    interactions: boolean;
  };
  privacy: {
    privateAccount: boolean;
  };
  content: {
    autoplay: boolean;
    reducedMotion: boolean;
  };
}
export interface SavedSound {
  id: string;
  name: string;
  artist: string;
  coverUrl?: string;
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
  echoes?: number; // Virtual Currency
  lastDailyReward?: number; // Timestamp of last daily reward claim
  avatarDecoration?: string; // 'gold-border', 'neon-glow', 'blue-fire', etc. (Ring)
  unlockedDecorations?: string[]; // List of owned decoration IDs
  badge?: string; // 'verified-pro', 'owner', 'crystal', etc. (Icon)
  bannerStyle?: string; // 'default', 'cosmic', 'neon', 'sunset', 'ocean', 'midnight'
  isAdmin?: boolean;
  // Phase 2: Governance & Security
  isVerified?: boolean; // Legacy boolean, prefer 'badge' for visual
  bannedUntil?: number; // Timestamp
  banReason?: string;
  bannedBy?: string; // Admin who issued the ban
  blockedUserIds?: string[];
  // Phase 4: Personalization
  notInterestedPostIds?: string[];
  savedSounds?: SavedSound[]; // Added for sound favorites
  createdAt?: number; // Added for analytics
  directMessages?: Record<string, string>; // targetUserId -> chatId
  settings?: UserSettings;
  // Phase 5: Safety
  dateOfBirth?: number; // Timestamp
  isAdult?: boolean; // Computed or stored
}
export interface Comment {
  id: string;
  postId: string;
  userId: string;
  text: string;
  createdAt: number;
  user?: User; // Snapshot of user data for display
  likes?: number; // Added for comment liking
  likedBy?: string[]; // Added for comment liking
}
export interface TextOverlay {
  id: string;
  text: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  color: string;
  style?: string; // 'neon', 'bold', 'italic', etc.
}
export interface Post {
  id: string;
  userId: string;
  type?: 'video' | 'audio'; // Defaults to 'video' if undefined
  videoUrl?: string; // Optional now, used for type='video'
  audioUrl?: string; // Used for type='audio'
  coverArtUrl?: string; // Used for type='audio'
  artist?: string; // Used for type='audio'
  title?: string; // Used for type='audio'
  caption: string;
  likes: number;
  likedBy?: string[]; // Track user IDs who liked the post
  saves?: number; // Track number of bookmarks
  savedBy?: string[]; // Track user IDs who saved the post
  comments: number;
  shares: number;
  views?: number; // Added for view tracking
  promotedUntil?: number; // Timestamp when promotion expires
  user?: User; // Hydrated user data
  tags?: string[];
  createdAt: number;
  commentsList?: Comment[]; // List of comments
  soundId?: string;
  soundName?: string;
  filter?: string; // Video filter ID (e.g., 'cyberpunk', 'noir')
  overlays?: TextOverlay[]; // Text overlays on the video
  isMature?: boolean; // 18+ Content Flag
}
export interface Chat {
  id: string;
  title: string;
  participants?: string[];
  type?: 'dm' | 'group';
  lastMessage?: ChatMessage;
  updatedAt?: number;
  visibility?: 'public' | 'private';
  canType?: 'all' | 'participants' | 'admin';
  ownerId?: string;
}
export interface ChatMessage {
  id: string;
  chatId: string;
  userId: string;
  text: string;
  ts: number; // epoch millis
  status?: 'sent' | 'delivered' | 'read';
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
}
export interface Notification {
  id: string;
  userId: string; // Recipient
  actorId: string; // Who performed the action
  type: 'like' | 'comment' | 'follow' | 'gift';
  postId?: string; // Optional, for like/comment
  read: boolean;
  createdAt: number;
  actor?: User; // Hydrated
  post?: Post; // Hydrated (optional)
  data?: any; // Extra data (e.g. gift amount)
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
  totalEchoes: number;
  userGrowth: ChartDataPoint[];
  activity: ChartDataPoint[];
  echoesDistribution: ChartDataPoint[]; // Added for economy analytics
  contentTypes: ChartDataPoint[]; // Added for content analytics
}