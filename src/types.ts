export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  displayName?: string;
  avatar?: string;
  banner?: string;
  bio?: string;
  phone?: string;
  phoneVisibility?: 'private' | 'contacts' | 'public';
  company?: string;
  domain?: string;
  accountType?: 'person' | 'company';
  role?: 'user' | 'support' | 'reviewer' | 'moderator' | 'admin' | 'owner';
  isVerified?: boolean;
  isOnline?: boolean;
  isFollowing?: boolean;
  isFollower?: boolean;
  followersCount?: number;
  followingCount?: number;
  distanceKm?: string;
  shareLocation?: boolean;
  lat?: number;
  lng?: number;
}

export interface StreamGuest {
  id: string;
  userId?: string;
  name: string;
  avatar?: string;
  status: 'backstage' | 'stage';
  isMuted: boolean;
  camOn: boolean;
  micOn: boolean;
  joinedAt: number;
}

export interface LiveStream {
  id: string;
  hostId: string;
  hostName: string;
  hostAvatar?: string;
  title: string;
  description?: string;
  category: string;
  roomName: string;
  roomUrl: string;
  hostToken?: string;
  coverUrl?: string;
  status: 'live' | 'ended';
  startedAt: number;
  viewerCount: number;
  guestCount: number;
  guests?: StreamGuest[];
  activeLayout?: 'solo' | 'side-by-side' | 'grid' | 'pip';
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  mediaUrl?: string;
  createdAt: number;
  read: boolean;
}

export interface ConversationItem {
  peerId: string;
  peerName: string;
  peerUsername: string;
  peerAvatar?: string;
  isOnline: boolean;
  lastMessage: string;
  lastMessageTime: number;
  unreadCount: number;
}

export interface CallRecord {
  id: string;
  callerId: string;
  callerName: string;
  callerAvatar?: string;
  receiverId: string;
  receiverName: string;
  receiverAvatar?: string;
  callType: 'audio' | 'video';
  roomUrl: string;
  status: 'ringing' | 'active' | 'ended' | 'rejected' | 'missed';
  startedAt: number;
  endedAt?: number;
  duration?: number;
}

export interface VideoItem {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  videoUrl: string;
  caption: string;
  privacy: 'public' | 'followers' | 'friends' | 'private';
  allowComments: boolean;
  allowDownload: boolean;
  likes: string[];
  createdAt: number;
}

export interface VideoComment {
  id: string;
  videoId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  text: string;
  createdAt: number;
}

export interface MarketAd {
  id: string;
  authorId: string;
  authorName: string;
  authorPhone?: string;
  title: string;
  category: string;
  price: string;
  location: string;
  description: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  dynamicFields?: Record<string, any>;
  createdAt: number;
}

export interface Company {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  domain?: string;
  desc?: string;
  logo?: string;
  cover?: string;
  verified: boolean;
  members: Array<{ userId: string; role: string }>;
  createdAt: number;
}

export interface Group {
  id: string;
  ownerId: string;
  name: string;
  slug: string;
  visibility: 'public' | 'private';
  desc?: string;
  members: string[];
  createdAt: number;
}

export interface GroupMessage {
  id: string;
  groupId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  createdAt: number;
}

export interface VerificationRequest {
  id: string;
  userId: string;
  userName: string;
  legalName: string;
  crNumber: string;
  phone: string;
  email: string;
  ownerName: string;
  crDocumentUrl?: string;
  ownerIdUrl?: string;
  status: 'pending' | 'needs_info' | 'approved' | 'rejected';
  note?: string;
  createdAt: number;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: any;
  read: boolean;
  createdAt: number;
}
