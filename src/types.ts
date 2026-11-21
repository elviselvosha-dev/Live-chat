export type ReactionType = 'like' | 'love' | 'haha' | 'wow';

export interface UserProfile {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  coverPhoto: string;
  bio: string;
  location: string;
  work: string;
  verified: boolean;
  followers: string[];
  following: string[];
  joinedAt: string;
}

export interface PostComment {
  id: string;
  authorId: string;
  text: string;
  createdAt: string;
}

export interface FeedPost {
  id: string;
  authorId: string;
  content: string;
  image?: string;
  imageSizeKb?: number;
  location?: string;
  createdAt: string;
  reactions: Record<ReactionType, string[]>;
  comments: PostComment[];
  shares: number;
}

export interface ReelItem {
  id: string;
  authorId: string;
  caption: string;
  audioTrack: string;
  posterImage: string;
  videoUrl?: string;
  durationSec: number;
  sizeMb: number;
  likes: string[];
  comments: PostComment[];
  views: number;
  createdAt: string;
}

export interface LiveComment {
  id: string;
  authorId: string;
  text: string;
  createdAt: string;
}

export interface LiveStream {
  id: string;
  hostId: string;
  title: string;
  category: string;
  isLive: boolean;
  viewerIds: string[];
  viewerCount: number;
  thumbnail: string;
  startedAt: string;
  comments: LiveComment[];
  reactionsCount: number;
}

export type MarketplaceCategory =
  | 'All'
  | 'Electronics'
  | 'Vehicles'
  | 'Furniture'
  | 'Apparel'
  | 'Home & Garden';

export interface MarketplaceItem {
  id: string;
  sellerId: string;
  title: string;
  price: number;
  currency: string;
  condition: 'New' | 'Like New' | 'Good' | 'Fair';
  category: Exclude<MarketplaceCategory, 'All'>;
  location: string;
  distanceKm: number;
  description: string;
  image: string;
  imageSizeKb: number;
  savedBy: string[];
  status: 'available' | 'pending' | 'sold';
  buyerId?: string;
  createdAt: string;
}

export interface StoryItem {
  id: string;
  authorId: string;
  mediaUrl?: string;
  caption: string;
  bgColor?: string;
  viewedBy: string[];
  createdAt: string;
  expiresAt: string;
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  text: string;
  attachmentListingId?: string;
  reactions?: Record<string, string[]>;
  createdAt: string;
  read: boolean;
}

export interface StoreState {
  users: UserProfile[];
  posts: FeedPost[];
  stories: StoryItem[];
  reels: ReelItem[];
  streams: LiveStream[];
  listings: MarketplaceItem[];
  messages: DirectMessage[];
}

export interface BootstrapResponse extends StoreState {
  onlineUserIds: string[];
}

export type TabKey = 'feed' | 'reels' | 'live' | 'marketplace' | 'messages' | 'profile';
