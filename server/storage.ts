import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  passwordHash: string;
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
  createdAt: number;
  lastSeen: number;
  lat?: number;
  lng?: number;
  shareLocation?: boolean;
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
  createdAt: number;
  startedAt: number;
  endedAt?: number;
  viewers: Record<string, { id: string; name: string; avatar?: string; lastSeen: number }>;
  guests: StreamGuest[];
  activeLayout: 'solo' | 'side-by-side' | 'grid' | 'pip';
}

export interface StreamChatMessage {
  id: string;
  streamId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text: string;
  createdAt: number;
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

export interface MessageItem {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  mediaUrl?: string;
  createdAt: number;
  read: boolean;
}

interface DatabaseSchema {
  users: Record<string, User>;
  sessions: Record<string, { token: string; userId: string; createdAt: number }>;
  follows: Record<string, boolean>; // `${followerId}:${followingId}`
  blocks: Record<string, boolean>; // `${blockerId}:${blockedId}`
  messages: MessageItem[];
  quickReplies: Array<{ id: string; userId: string; label: string; text: string }>;
  calls: Record<string, CallRecord>;
  streams: Record<string, LiveStream>;
  streamChat: StreamChatMessage[];
  streamReactions: Array<{ id: string; streamId: string; type: string; count: number; createdAt: number }>;
  videos: VideoItem[];
  videoComments: VideoComment[];
  marketAds: MarketAd[];
  companies: Company[];
  groups: Group[];
  groupMessages: GroupMessage[];
  verifications: VerificationRequest[];
  notifications: NotificationItem[];
}

const DATA_FILE = path.resolve(process.cwd(), 'data/snns_data.json');

class Storage {
  private db: DatabaseSchema;

  constructor() {
    this.db = this.load();
    // Ensure admin accounts or default admin state exists if needed
    this.ensureSTSAccount();
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Error loading db file, initializing fresh:', e);
    }
    return {
      users: {},
      sessions: {},
      follows: {},
      blocks: {},
      messages: [],
      quickReplies: [],
      calls: {},
      streams: {},
      streamChat: [],
      streamReactions: [],
      videos: [],
      videoComments: [],
      marketAds: [],
      companies: [],
      groups: [],
      groupMessages: [],
      verifications: [],
      notifications: [],
    };
  }

  public save() {
    try {
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.db, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to persist database:', e);
    }
  }

  public hashPassword(pwd: string): string {
    return crypto.createHash('sha256').update(pwd + 'snns_salt_2026').digest('hex');
  }

  private ensureSTSAccount() {
    // Admin / STS user with ID 1007363904 and PIN 139213 as documented in SNNS release notes
    const stsId = '1007363904';
    if (!this.db.users[stsId]) {
      this.db.users[stsId] = {
        id: stsId,
        name: 'إدارة المنصة',
        username: 'sts_admin',
        email: 'sts@snns.internal',
        passwordHash: this.hashPassword('139213'),
        displayName: 'SNNS STS Root',
        role: 'owner',
        isVerified: true,
        createdAt: Date.now(),
        lastSeen: Date.now(),
      };
      this.save();
    }
  }

  // --- Users ---
  public getUser(id: string): User | undefined {
    return this.db.users[id];
  }

  public getUserByUsername(username: string): User | undefined {
    const clean = username.trim().toLowerCase();
    return Object.values(this.db.users).find((u) => u.username.toLowerCase() === clean);
  }

  public getUserByEmail(email: string): User | undefined {
    const clean = email.trim().toLowerCase();
    return Object.values(this.db.users).find((u) => u.email.toLowerCase() === clean);
  }

  public createUser(user: User): User {
    this.db.users[user.id] = user;
    this.save();
    return user;
  }

  public updateUser(id: string, updates: Partial<User>): User | undefined {
    const existing = this.db.users[id];
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    this.db.users[id] = updated;
    this.save();
    return updated;
  }

  public getAllUsers(excludeRoles: string[] = ['owner', 'admin', 'moderator']): User[] {
    return Object.values(this.db.users).filter((u) => !excludeRoles.includes(u.role || 'user'));
  }

  public getAllUsersAdmin(): User[] {
    return Object.values(this.db.users);
  }

  // --- Sessions ---
  public createSession(userId: string): string {
    const token = 'snns_tok_' + crypto.randomBytes(32).toString('hex');
    this.db.sessions[token] = { token, userId, createdAt: Date.now() };
    this.save();
    return token;
  }

  public getSession(token: string): { token: string; userId: string; createdAt: number } | undefined {
    return this.db.sessions[token];
  }

  public deleteSession(token: string) {
    delete this.db.sessions[token];
    this.save();
  }

  // --- Follows ---
  public isFollowing(followerId: string, followingId: string): boolean {
    return !!this.db.follows[`${followerId}:${followingId}`];
  }

  public toggleFollow(followerId: string, followingId: string): boolean {
    const key = `${followerId}:${followingId}`;
    if (this.db.follows[key]) {
      delete this.db.follows[key];
      this.save();
      return false;
    } else {
      this.db.follows[key] = true;
      this.save();
      return true;
    }
  }

  public getFollowersCount(userId: string): number {
    return Object.keys(this.db.follows).filter((k) => k.endsWith(`:${userId}`)).length;
  }

  public getFollowingCount(userId: string): number {
    return Object.keys(this.db.follows).filter((k) => k.startsWith(`${userId}:`)).length;
  }

  // --- Blocks ---
  public isBlocked(blockerId: string, blockedId: string): boolean {
    return !!this.db.blocks[`${blockerId}:${blockedId}`] || !!this.db.blocks[`${blockedId}:${blockerId}`];
  }

  public toggleBlock(blockerId: string, blockedId: string): boolean {
    const key = `${blockerId}:${blockedId}`;
    if (this.db.blocks[key]) {
      delete this.db.blocks[key];
      this.save();
      return false;
    } else {
      this.db.blocks[key] = true;
      this.save();
      return true;
    }
  }

  public getBlockedUserIds(userId: string): string[] {
    return Object.keys(this.db.blocks)
      .filter((k) => k.startsWith(`${userId}:`))
      .map((k) => k.split(':')[1]);
  }

  // --- Messages ---
  public addMessage(msg: MessageItem) {
    this.db.messages.push(msg);
    this.save();
    return msg;
  }

  public getConversation(user1: string, user2: string): MessageItem[] {
    return this.db.messages.filter(
      (m) =>
        (m.senderId === user1 && m.receiverId === user2) ||
        (m.senderId === user2 && m.receiverId === user1)
    );
  }

  public getChatList(userId: string) {
    const conversations: Record<string, { lastMessage: MessageItem; unread: number }> = {};
    for (const m of this.db.messages) {
      const peerId = m.senderId === userId ? m.receiverId : m.senderId;
      if (peerId === userId) continue;
      if (!conversations[peerId]) {
        conversations[peerId] = { lastMessage: m, unread: 0 };
      }
      if (m.createdAt >= conversations[peerId].lastMessage.createdAt) {
        conversations[peerId].lastMessage = m;
      }
      if (m.receiverId === userId && !m.read) {
        conversations[peerId].unread++;
      }
    }
    return conversations;
  }

  public markMessagesRead(senderId: string, receiverId: string) {
    let changed = false;
    for (const m of this.db.messages) {
      if (m.senderId === senderId && m.receiverId === receiverId && !m.read) {
        m.read = true;
        changed = true;
      }
    }
    if (changed) this.save();
  }

  // --- Quick replies ---
  public getQuickReplies(userId: string) {
    return this.db.quickReplies.filter((q) => q.userId === userId);
  }

  public addQuickReply(userId: string, label: string, text: string) {
    const item = { id: 'qr_' + Date.now(), userId, label, text };
    this.db.quickReplies.push(item);
    this.save();
    return item;
  }

  public removeQuickReply(userId: string, id: string) {
    this.db.quickReplies = this.db.quickReplies.filter((q) => !(q.userId === userId && q.id === id));
    this.save();
  }

  // --- Calls ---
  public createCall(call: CallRecord) {
    this.db.calls[call.id] = call;
    this.save();
    return call;
  }

  public getCall(callId: string): CallRecord | undefined {
    return this.db.calls[callId];
  }

  public updateCall(callId: string, updates: Partial<CallRecord>): CallRecord | undefined {
    const existing = this.db.calls[callId];
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    this.db.calls[callId] = updated;
    this.save();
    return updated;
  }

  public getActiveCallForUser(userId: string): CallRecord | undefined {
    return Object.values(this.db.calls).find(
      (c) => (c.receiverId === userId || c.callerId === userId) && (c.status === 'ringing' || c.status === 'active')
    );
  }

  public getCallHistory(userId: string): CallRecord[] {
    return Object.values(this.db.calls)
      .filter((c) => c.callerId === userId || c.receiverId === userId)
      .sort((a, b) => b.startedAt - a.startedAt);
  }

  // --- Streams (SNNS LIVE) ---
  public createStream(stream: LiveStream): LiveStream {
    this.db.streams[stream.id] = stream;
    this.save();
    return stream;
  }

  public getStream(id: string): LiveStream | undefined {
    return this.db.streams[id];
  }

  public updateStream(id: string, updates: Partial<LiveStream>): LiveStream | undefined {
    const existing = this.db.streams[id];
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    this.db.streams[id] = updated;
    this.save();
    return updated;
  }

  public getLiveStreams(): LiveStream[] {
    const now = Date.now();
    // Prune stale heartbeat viewers (inactive for > 30s)
    for (const stream of Object.values(this.db.streams)) {
      if (stream.status === 'live') {
        const active: Record<string, any> = {};
        for (const [vid, viewer] of Object.entries(stream.viewers || {})) {
          if (now - viewer.lastSeen < 35000) {
            active[vid] = viewer;
          }
        }
        stream.viewers = active;
      }
    }
    return Object.values(this.db.streams).filter((s) => s.status === 'live');
  }

  public updateViewerHeartbeat(streamId: string, viewer: { id: string; name: string; avatar?: string }) {
    const stream = this.db.streams[streamId];
    if (!stream || stream.status !== 'live') return 0;
    if (!stream.viewers) stream.viewers = {};
    stream.viewers[viewer.id] = { ...viewer, lastSeen: Date.now() };
    this.save();
    return Object.keys(stream.viewers).length;
  }

  public removeViewer(streamId: string, viewerId: string) {
    const stream = this.db.streams[streamId];
    if (stream && stream.viewers) {
      delete stream.viewers[viewerId];
      this.save();
    }
  }

  // --- Stream Chat ---
  public addStreamChat(msg: StreamChatMessage): StreamChatMessage {
    this.db.streamChat.push(msg);
    // keep recent 300 messages per stream
    if (this.db.streamChat.length > 2000) {
      this.db.streamChat = this.db.streamChat.slice(-1000);
    }
    this.save();
    return msg;
  }

  public getStreamChat(streamId: string): StreamChatMessage[] {
    return this.db.streamChat.filter((c) => c.streamId === streamId);
  }

  // --- Stream Reactions ---
  public addStreamReaction(streamId: string, type: string) {
    const item = { id: 'rx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6), streamId, type, count: 1, createdAt: Date.now() };
    this.db.streamReactions.push(item);
    if (this.db.streamReactions.length > 500) {
      this.db.streamReactions = this.db.streamReactions.slice(-300);
    }
    this.save();
    return item;
  }

  public getStreamReactions(streamId: string, since: number) {
    return this.db.streamReactions.filter((r) => r.streamId === streamId && r.createdAt > since);
  }

  // --- Videos / Moments ---
  public addVideo(v: VideoItem): VideoItem {
    this.db.videos.unshift(v);
    this.save();
    return v;
  }

  public getVideos(): VideoItem[] {
    return this.db.videos;
  }

  public getVideo(id: string): VideoItem | undefined {
    return this.db.videos.find((v) => v.id === id);
  }

  public toggleVideoLike(videoId: string, userId: string): boolean {
    const v = this.getVideo(videoId);
    if (!v) return false;
    const idx = v.likes.indexOf(userId);
    if (idx >= 0) {
      v.likes.splice(idx, 1);
      this.save();
      return false;
    } else {
      v.likes.push(userId);
      this.save();
      return true;
    }
  }

  public addVideoComment(comment: VideoComment): VideoComment {
    this.db.videoComments.push(comment);
    this.save();
    return comment;
  }

  public getVideoComments(videoId: string): VideoComment[] {
    return this.db.videoComments.filter((c) => c.videoId === videoId);
  }

  // --- Marketplace ---
  public addMarketAd(ad: MarketAd): MarketAd {
    this.db.marketAds.unshift(ad);
    this.save();
    return ad;
  }

  public getMarketAds(): MarketAd[] {
    return this.db.marketAds;
  }

  public deleteMarketAd(adId: string, userId: string): boolean {
    const idx = this.db.marketAds.findIndex((a) => a.id === adId && a.authorId === userId);
    if (idx >= 0) {
      this.db.marketAds.splice(idx, 1);
      this.save();
      return true;
    }
    return false;
  }

  // --- Companies ---
  public getCompanies(): Company[] {
    return this.db.companies;
  }

  public addCompany(c: Company): Company {
    this.db.companies.push(c);
    this.save();
    return c;
  }

  public getCompany(id: string): Company | undefined {
    return this.db.companies.find((c) => c.id === id || c.slug === id);
  }

  // --- Groups ---
  public getGroups(): Group[] {
    return this.db.groups;
  }

  public addGroup(g: Group): Group {
    this.db.groups.push(g);
    this.save();
    return g;
  }

  public getGroup(id: string): Group | undefined {
    return this.db.groups.find((g) => g.id === id || g.slug === id);
  }

  public addGroupMessage(gm: GroupMessage): GroupMessage {
    this.db.groupMessages.push(gm);
    this.save();
    return gm;
  }

  public getGroupMessages(groupId: string): GroupMessage[] {
    return this.db.groupMessages.filter((m) => m.groupId === groupId);
  }

  // --- Verifications & STS ---
  public addVerification(v: VerificationRequest): VerificationRequest {
    this.db.verifications.unshift(v);
    this.save();
    return v;
  }

  public getVerifications(): VerificationRequest[] {
    return this.db.verifications;
  }

  public updateVerification(id: string, updates: Partial<VerificationRequest>): VerificationRequest | undefined {
    const item = this.db.verifications.find((v) => v.id === id);
    if (!item) return undefined;
    Object.assign(item, updates);
    if (updates.status === 'approved') {
      const user = this.getUser(item.userId);
      if (user) {
        user.isVerified = true;
        user.accountType = 'company';
      }
    }
    this.save();
    return item;
  }

  // --- Notifications ---
  public addNotification(n: NotificationItem): NotificationItem {
    this.db.notifications.unshift(n);
    if (this.db.notifications.length > 500) {
      this.db.notifications = this.db.notifications.slice(0, 300);
    }
    this.save();
    return n;
  }

  public getNotifications(userId: string): NotificationItem[] {
    return this.db.notifications.filter((n) => n.userId === userId);
  }

  public markNotificationsRead(userId: string) {
    for (const n of this.db.notifications) {
      if (n.userId === userId) {
        n.read = true;
      }
    }
    this.save();
  }

  // --- Stats for STS Admin ---
  public getStats() {
    const now = Date.now();
    const users = Object.values(this.db.users);
    const online = users.filter((u) => now - (u.lastSeen || 0) < 60000).length;
    const verified = users.filter((u) => u.isVerified).length;
    const pendingVerifications = this.db.verifications.filter((v) => v.status === 'pending').length;
    const callsToday = Object.values(this.db.calls).filter((c) => now - c.startedAt < 86400000).length;

    return {
      usersCount: users.length,
      verifiedCount: verified,
      pendingVerifications,
      onlineCount: online,
      messagesCount: this.db.messages.length,
      callsToday,
      mediaCount: this.db.videos.length + this.db.marketAds.filter((a) => a.mediaUrl).length,
      dailyStatus: 'جاهز ونشط',
    };
  }
}

export const storage = new Storage();
