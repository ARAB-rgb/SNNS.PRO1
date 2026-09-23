import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { storage, User, LiveStream, StreamGuest } from './storage.ts';
import { createDailyRoom } from './daily.ts';

const router = Router();

// Configure file uploads to ./public/uploads
const uploadDir = path.resolve(process.cwd(), 'public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const fileStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.bin';
    const name = 'snns_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8) + ext;
    cb(null, name);
  },
});

const upload = multer({
  storage: fileStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max
});

// Middleware to get authenticated user
export function getAuthUser(req: Request): User | undefined {
  const authHeader = req.headers.authorization;
  if (!authHeader) return undefined;
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const session = storage.getSession(token);
  if (!session) return undefined;
  const user = storage.getUser(session.userId);
  if (user) {
    user.lastSeen = Date.now();
  }
  return user;
}

// ----------------------------------------------------
// Health Check Endpoint
// ----------------------------------------------------
router.get('/health', (_req: Request, res: Response): void => {
  res.json({ status: 'ok', service: 'SNNS API', time: Date.now() });
});

// ----------------------------------------------------
// 1) File Upload Endpoint
// ----------------------------------------------------
router.post('/upload', upload.single('file'), (req: Request, res: Response): void => {
  if (!req.file) {
    res.status(400).json({ error: 'لم يتم اختيار ملف' });
    return;
  }
  const url = `/uploads/${req.file.filename}`;
  res.json({ url, filename: req.file.filename, size: req.file.size });
});

// ----------------------------------------------------
// 2) Authentication Endpoints
// ----------------------------------------------------
router.post('/auth/register', (req: Request, res: Response): void => {
  const { name, username, email, password, displayName } = req.body;
  if (!name || !username || !email || !password) {
    res.status(400).json({ error: 'جميع الحقول الأساسية مطلوبة' });
    return;
  }
  const cleanUsername = String(username).trim().toLowerCase();
  if (cleanUsername.length < 3) {
    res.status(400).json({ error: 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل' });
    return;
  }
  if (storage.getUserByUsername(cleanUsername)) {
    res.status(400).json({ error: 'اسم المستخدم مسجل مسبقاً، يرجى اختيار اسم آخر' });
    return;
  }
  if (storage.getUserByEmail(email)) {
    res.status(400).json({ error: 'البريد الإلكتروني مسجل مسبقاً' });
    return;
  }

  const userId = 'usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);
  const newUser: User = {
    id: userId,
    name: String(name).trim(),
    username: cleanUsername,
    email: String(email).trim().toLowerCase(),
    passwordHash: storage.hashPassword(String(password)),
    displayName: displayName ? String(displayName).trim() : String(name).trim(),
    role: 'user',
    createdAt: Date.now(),
    lastSeen: Date.now(),
    phoneVisibility: 'private',
    accountType: 'person',
  };

  storage.createUser(newUser);
  const token = storage.createSession(userId);

  res.json({
    token,
    user: {
      id: newUser.id,
      name: newUser.name,
      username: newUser.username,
      email: newUser.email,
      displayName: newUser.displayName,
      avatar: newUser.avatar,
      role: newUser.role,
      isVerified: newUser.isVerified,
    },
  });
});

router.post('/auth/login', (req: Request, res: Response): void => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'اسم المستخدم وكلمة المرور مطلوبة' });
    return;
  }
  const clean = String(username).trim();
  const user = storage.getUserByUsername(clean) || storage.getUserByEmail(clean) || storage.getUser(clean);
  if (!user) {
    res.status(401).json({ error: 'بيانات الدخول غير صحيحة' });
    return;
  }

  const hash = storage.hashPassword(String(password));
  if (user.passwordHash !== hash) {
    res.status(401).json({ error: 'كلمة المرور غير صحيحة' });
    return;
  }

  user.lastSeen = Date.now();
  storage.save();
  const token = storage.createSession(user.id);

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      avatar: user.avatar,
      banner: user.banner,
      bio: user.bio,
      phone: user.phone,
      phoneVisibility: user.phoneVisibility,
      company: user.company,
      domain: user.domain,
      accountType: user.accountType,
      role: user.role,
      isVerified: user.isVerified,
    },
  });
});

router.get('/auth/me', (req: Request, res: Response): void => {
  const user = getAuthUser(req);
  if (!user) {
    res.status(401).json({ error: 'غير مسجل' });
    return;
  }
  res.json({
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      displayName: user.displayName,
      avatar: user.avatar,
      banner: user.banner,
      bio: user.bio,
      phone: user.phone,
      phoneVisibility: user.phoneVisibility,
      company: user.company,
      domain: user.domain,
      accountType: user.accountType,
      role: user.role,
      isVerified: user.isVerified,
      followersCount: storage.getFollowersCount(user.id),
      followingCount: storage.getFollowingCount(user.id),
    },
  });
});

router.post('/auth/logout', (req: Request, res: Response): void => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    storage.deleteSession(token);
  }
  res.json({ success: true });
});

// STS Admin Login
router.post('/auth/sts-login', (req: Request, res: Response): void => {
  const { id, pin } = req.body;
  if (!id || !pin) {
    res.status(400).json({ error: 'المعرف ورمز PIN مطلوبان' });
    return;
  }
  const user = storage.getUser(String(id).trim());
  if (!user || user.passwordHash !== storage.hashPassword(String(pin).trim())) {
    res.status(401).json({ error: 'بيانات اعتماد STS غير صحيحة' });
    return;
  }
  const token = storage.createSession(user.id);
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
      isVerified: user.isVerified,
    },
  });
});

// ----------------------------------------------------
// 3) Users / Contacts Endpoints
// ----------------------------------------------------
router.get('/users', (req: Request, res: Response): void => {
  const currentUser = getAuthUser(req);
  const now = Date.now();
  // Filter out internal admin/owner roles from normal public directory
  const users = storage.getAllUsers(['owner', 'admin']).map((u) => {
    const isOnline = now - (u.lastSeen || 0) < 45000;
    const isFollowing = currentUser ? storage.isFollowing(currentUser.id, u.id) : false;
    const isFollower = currentUser ? storage.isFollowing(u.id, currentUser.id) : false;
    return {
      id: u.id,
      name: u.name,
      username: u.username,
      displayName: u.displayName || u.name,
      avatar: u.avatar,
      bio: u.bio,
      company: u.company,
      domain: u.domain,
      isVerified: u.isVerified,
      isOnline,
      isFollowing,
      isFollower,
      followersCount: storage.getFollowersCount(u.id),
      phone: u.phoneVisibility === 'public' || (u.phoneVisibility === 'contacts' && isFollowing) ? u.phone : undefined,
    };
  });
  res.json({ users });
});

router.post('/users/:id/follow', (req: Request, res: Response): void => {
  const currentUser = getAuthUser(req);
  if (!currentUser) {
    res.status(401).json({ error: 'تسجيل الدخول مطلوب' });
    return;
  }
  const targetId = req.params.id;
  if (targetId === currentUser.id) {
    res.status(400).json({ error: 'لا يمكنك متابعة نفسك' });
    return;
  }
  const isNowFollowing = storage.toggleFollow(currentUser.id, targetId);
  if (isNowFollowing) {
    storage.addNotification({
      id: 'notif_' + Date.now(),
      userId: targetId,
      type: 'follow',
      title: 'متابع جديد',
      body: `بدأ ${currentUser.displayName || currentUser.name} بمتابعتك`,
      read: false,
      createdAt: Date.now(),
    });
  }
  res.json({
    following: isNowFollowing,
    followersCount: storage.getFollowersCount(targetId),
  });
});

router.post('/users/:id/block', (req: Request, res: Response): void => {
  const currentUser = getAuthUser(req);
  if (!currentUser) {
    res.status(401).json({ error: 'تسجيل الدخول مطلوب' });
    return;
  }
  const targetId = req.params.id;
  const isBlocked = storage.toggleBlock(currentUser.id, targetId);
  res.json({ blocked: isBlocked });
});

router.get('/blocked', (req: Request, res: Response): void => {
  const currentUser = getAuthUser(req);
  if (!currentUser) {
    res.status(401).json({ error: 'تسجيل الدخول مطلوب' });
    return;
  }
  const blockedIds = storage.getBlockedUserIds(currentUser.id);
  const users = blockedIds.map((id) => storage.getUser(id)).filter(Boolean);
  res.json({ users });
});

// Real location radar (Haversine calculation)
router.post('/users/location', (req: Request, res: Response): void => {
  const currentUser = getAuthUser(req);
  if (!currentUser) {
    res.status(401).json({ error: 'تسجيل الدخول مطلوب' });
    return;
  }
  const { lat, lng, shareLocation } = req.body;
  storage.updateUser(currentUser.id, {
    lat: typeof lat === 'number' ? lat : undefined,
    lng: typeof lng === 'number' ? lng : undefined,
    shareLocation: !!shareLocation,
  });
  res.json({ success: true });
});

function calculateHaversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

router.get('/nearby', (req: Request, res: Response): void => {
  const currentUser = getAuthUser(req);
  const maxRadiusMeters = Number(req.query.radius) || 20000; // default 20km
  if (!currentUser || !currentUser.shareLocation || typeof currentUser.lat !== 'number' || typeof currentUser.lng !== 'number') {
    res.json({ nearby: [] });
    return;
  }

  const allUsers = storage.getAllUsers(['owner', 'admin']);
  const nearby = allUsers
    .filter((u) => u.id !== currentUser.id && u.shareLocation && typeof u.lat === 'number' && typeof u.lng === 'number')
    .map((u) => {
      const dist = calculateHaversineDistanceMeters(currentUser.lat!, currentUser.lng!, u.lat!, u.lng!);
      return {
        id: u.id,
        name: u.name,
        username: u.username,
        displayName: u.displayName || u.name,
        avatar: u.avatar,
        distanceMeters: Math.round(dist),
        distanceKm: (dist / 1000).toFixed(1),
        isOnline: Date.now() - (u.lastSeen || 0) < 60000,
      };
    })
    .filter((item) => item.distanceMeters <= maxRadiusMeters)
    .sort((a, b) => a.distanceMeters - b.distanceMeters);

  res.json({ nearby });
});

// ----------------------------------------------------
// 4) Messages & Chats Endpoints
// ----------------------------------------------------
router.get('/chats', (req: Request, res: Response): void => {
  const currentUser = getAuthUser(req);
  if (!currentUser) {
    res.status(401).json({ error: 'تسجيل الدخول مطلوب' });
    return;
  }
  const chatMap = storage.getChatList(currentUser.id);
  const result = Object.entries(chatMap).map(([peerId, item]) => {
    const peer = storage.getUser(peerId);
    return {
      peerId,
      peerName: peer?.displayName || peer?.name || 'مستخدم',
      peerUsername: peer?.username || '',
      peerAvatar: peer?.avatar,
      isOnline: Date.now() - (peer?.lastSeen || 0) < 60000,
      lastMessage: item.lastMessage.text,
      lastMessageTime: item.lastMessage.createdAt,
      unreadCount: item.unread,
    };
  }).sort((a, b) => b.lastMessageTime - a.lastMessageTime);

  res.json({ chats: result });
});

router.get('/messages/:peerId', (req: Request, res: Response): void => {
  const currentUser = getAuthUser(req);
  if (!currentUser) {
    res.status(401).json({ error: 'تسجيل الدخول مطلوب' });
    return;
  }
  const peerId = req.params.peerId;
  const messages = storage.getConversation(currentUser.id, peerId);
  storage.markMessagesRead(peerId, currentUser.id);
  res.json({ messages });
});

router.post('/messages/:peerId', (req: Request, res: Response): void => {
  const currentUser = getAuthUser(req);
  if (!currentUser) {
    res.status(401).json({ error: 'تسجيل الدخول مطلوب' });
    return;
  }
  const peerId = req.params.peerId;
  const { text, mediaUrl } = req.body;
  if (!text && !mediaUrl) {
    res.status(400).json({ error: 'محتوى الرسالة مطلوب' });
    return;
  }

  const msg = storage.addMessage({
    id: 'msg_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
    senderId: currentUser.id,
    receiverId: peerId,
    text: text ? String(text).trim() : '',
    mediaUrl,
    createdAt: Date.now(),
    read: false,
  });

  // Notification to receiver
  storage.addNotification({
    id: 'notif_' + Date.now(),
    userId: peerId,
    type: 'message',
    title: currentUser.displayName || currentUser.name,
    body: text || 'أرسل لك مرفقاً',
    data: { peerId: currentUser.id },
    read: false,
    createdAt: Date.now(),
  });

  res.json({ message: msg });
});

router.get('/quick-replies', (req: Request, res: Response): void => {
  const currentUser = getAuthUser(req);
  if (!currentUser) {
    res.status(401).json({ error: 'تسجيل الدخول مطلوب' });
    return;
  }
  res.json({ quickReplies: storage.getQuickReplies(currentUser.id) });
});

router.post('/quick-replies', (req: Request, res: Response): void => {
  const currentUser = getAuthUser(req);
  if (!currentUser) {
    res.status(401).json({ error: 'تسجيل الدخول مطلوب' });
    return;
  }
  const { label, text } = req.body;
  if (!label || !text) {
    res.status(400).json({ error: 'الاسم والمحتوى مطلوبان' });
    return;
  }
  const item = storage.addQuickReply(currentUser.id, String(label).trim(), String(text).trim());
  res.json({ item });
});

router.delete('/quick-replies/:id', (req: Request, res: Response): void => {
  const currentUser = getAuthUser(req);
  if (!currentUser) {
    res.status(401).json({ error: 'تسجيل الدخول مطلوب' });
    return;
  }
  storage.removeQuickReply(currentUser.id, req.params.id);
  res.json({ success: true });
});

// ----------------------------------------------------
// 5) Calls & Daily.co Voice / Video Integration
// ----------------------------------------------------
router.post('/calls/initiate', async (req: Request, res: Response): Promise<void> => {
  const currentUser = getAuthUser(req);
  if (!currentUser) {
    res.status(401).json({ error: 'تسجيل الدخول مطلوب' });
    return;
  }
  const { receiverId, callType } = req.body;
  const receiver = storage.getUser(receiverId);
  if (!receiver) {
    res.status(404).json({ error: 'المستخدم غير موجود' });
    return;
  }

  // Generate unique dedicated Daily room
  const room = await createDailyRoom(`call_${callType}`, currentUser.displayName || currentUser.name);
  const callId = 'call_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);

  const newCall = storage.createCall({
    id: callId,
    callerId: currentUser.id,
    callerName: currentUser.displayName || currentUser.name,
    callerAvatar: currentUser.avatar,
    receiverId: receiver.id,
    receiverName: receiver.displayName || receiver.name,
    receiverAvatar: receiver.avatar,
    callType: callType === 'audio' ? 'audio' : 'video',
    roomUrl: room.roomUrl,
    status: 'ringing',
    startedAt: Date.now(),
  });

  res.json({ call: newCall });
});

router.get('/calls/active', (req: Request, res: Response): void => {
  const currentUser = getAuthUser(req);
  if (!currentUser) {
    res.status(401).json({ error: 'تسجيل الدخول مطلوب' });
    return;
  }
  const activeCall = storage.getActiveCallForUser(currentUser.id);
  res.json({ call: activeCall || null });
});

router.post('/calls/:id/respond', (req: Request, res: Response): void => {
  const currentUser = getAuthUser(req);
  if (!currentUser) {
    res.status(401).json({ error: 'تسجيل الدخول مطلوب' });
    return;
  }
  const { accept } = req.body;
  const call = storage.getCall(req.params.id);
  if (!call) {
    res.status(404).json({ error: 'المكالمة غير موجودة' });
    return;
  }

  if (accept) {
    const updated = storage.updateCall(call.id, { status: 'active' });
    res.json({ call: updated });
  } else {
    const updated = storage.updateCall(call.id, { status: 'rejected', endedAt: Date.now() });
    res.json({ call: updated });
  }
});

router.post('/calls/:id/end', (req: Request, res: Response): void => {
  const currentUser = getAuthUser(req);
  if (!currentUser) {
    res.status(401).json({ error: 'تسجيل الدخول مطلوب' });
    return;
  }
  const call = storage.getCall(req.params.id);
  if (!call) {
    res.status(404).json({ error: 'المكالمة غير موجودة' });
    return;
  }
  const endedAt = Date.now();
  const duration = Math.round((endedAt - call.startedAt) / 1000);
  const updated = storage.updateCall(call.id, {
    status: 'ended',
    endedAt,
    duration,
  });
  res.json({ call: updated });
});

router.get('/calls/history', (req: Request, res: Response): void => {
  const currentUser = getAuthUser(req);
  if (!currentUser) {
    res.status(401).json({ error: 'تسجيل الدخول مطلوب' });
    return;
  }
  res.json({ history: storage.getCallHistory(currentUser.id) });
});

// ----------------------------------------------------
// 6) SNNS LIVE Studio & Live Broadcasting
// ----------------------------------------------------
router.post('/live/create', async (req: Request, res: Response): Promise<void> => {
  const currentUser = getAuthUser(req);
  if (!currentUser) {
    res.status(401).json({ error: 'تسجيل الدخول مطلوب لبدء البث' });
    return;
  }
  const { title, description, category, coverUrl } = req.body;
  if (!title || !String(title).trim()) {
    res.status(400).json({ error: 'عنوان البث مطلوب' });
    return;
  }

  // Create dedicated unique Daily room
  const dailyResult = await createDailyRoom('live', currentUser.displayName || currentUser.name);
  const streamId = 'live_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6);

  const stream: LiveStream = {
    id: streamId,
    hostId: currentUser.id,
    hostName: currentUser.displayName || currentUser.name,
    hostAvatar: currentUser.avatar,
    title: String(title).trim(),
    description: description ? String(description).trim() : '',
    category: category || 'talk',
    roomName: dailyResult.roomName,
    roomUrl: dailyResult.roomUrl,
    hostToken: dailyResult.hostToken,
    coverUrl,
    status: 'live',
    createdAt: Date.now(),
    startedAt: Date.now(),
    viewers: {},
    guests: [],
    activeLayout: 'solo',
  };

  storage.createStream(stream);

  res.json({
    stream,
    guestInviteUrl: `${req.protocol}://${req.get('host')}/?page=live&streamId=${streamId}&join=guest`,
    viewerShareUrl: `${req.protocol}://${req.get('host')}/?page=live&streamId=${streamId}`,
  });
});

router.get('/live/list', (_req: Request, res: Response): void => {
  const list = storage.getLiveStreams().map((s) => ({
    id: s.id,
    hostId: s.hostId,
    hostName: s.hostName,
    hostAvatar: s.hostAvatar,
    title: s.title,
    description: s.description,
    category: s.category,
    coverUrl: s.coverUrl,
    startedAt: s.startedAt,
    viewerCount: Object.keys(s.viewers || {}).length,
    guestCount: (s.guests || []).filter((g) => g.status === 'stage').length,
    status: s.status,
  }));
  res.json({ streams: list });
});

router.get('/live/:id', (req: Request, res: Response): void => {
  const stream = storage.getStream(req.params.id);
  if (!stream) {
    res.status(404).json({ error: 'البث غير موجود' });
    return;
  }
  const viewerCount = Object.keys(stream.viewers || {}).length;
  const guestCount = (stream.guests || []).filter((g) => g.status === 'stage').length;
  res.json({
    stream: {
      ...stream,
      viewerCount,
      guestCount,
    },
  });
});

// Viewer heartbeat to keep real viewer count accurate
router.post('/live/:id/heartbeat', (req: Request, res: Response): void => {
  const currentUser = getAuthUser(req);
  const stream = storage.getStream(req.params.id);
  if (!stream || stream.status !== 'live') {
    res.json({ active: false, viewerCount: 0, guests: [] });
    return;
  }

  const viewerId = currentUser?.id || req.body.viewerId || 'anon_' + req.ip;
  const viewerName = currentUser?.displayName || currentUser?.name || 'مشاهد';
  const viewerAvatar = currentUser?.avatar;

  const count = storage.updateViewerHeartbeat(stream.id, {
    id: viewerId,
    name: viewerName,
    avatar: viewerAvatar,
  });

  res.json({
    active: true,
    viewerCount: count,
    guests: stream.guests || [],
    layout: stream.activeLayout || 'solo',
  });
});

router.post('/live/:id/leave', (req: Request, res: Response): void => {
  const currentUser = getAuthUser(req);
  const viewerId = currentUser?.id || req.body.viewerId;
  if (viewerId) {
    storage.removeViewer(req.params.id, viewerId);
  }
  res.json({ success: true });
});

router.post('/live/:id/end', (req: Request, res: Response): void => {
  const currentUser = getAuthUser(req);
  if (!currentUser) {
    res.status(401).json({ error: 'تسجيل الدخول مطلوب' });
    return;
  }
  const stream = storage.getStream(req.params.id);
  if (!stream) {
    res.status(404).json({ error: 'البث غير موجود' });
    return;
  }
  if (stream.hostId !== currentUser.id && currentUser.role !== 'owner' && currentUser.role !== 'admin') {
    res.status(403).json({ error: 'فقط المذيع يستطيع إنهاء البث' });
    return;
  }

  storage.updateStream(stream.id, {
    status: 'ended',
    endedAt: Date.now(),
  });

  res.json({ success: true });
});

// Layout switcher (solo, side-by-side, grid, pip)
router.post('/live/:id/layout', (req: Request, res: Response): void => {
  const currentUser = getAuthUser(req);
  if (!currentUser) {
    res.status(401).json({ error: 'تسجيل الدخول مطلوب' });
    return;
  }
  const stream = storage.getStream(req.params.id);
  if (!stream || stream.hostId !== currentUser.id) {
    res.status(403).json({ error: 'غير مصرح' });
    return;
  }
  const { layout } = req.body;
  if (['solo', 'side-by-side', 'grid', 'pip'].includes(layout)) {
    storage.updateStream(stream.id, { activeLayout: layout });
  }
  res.json({ layout: stream.activeLayout });
});

// Live Chat
router.get('/live/:id/chat', (req: Request, res: Response): void => {
  res.json({ messages: storage.getStreamChat(req.params.id) });
});

router.post('/live/:id/chat', (req: Request, res: Response): void => {
  const currentUser = getAuthUser(req);
  const { text, guestName } = req.body;
  if (!text || !String(text).trim()) {
    res.status(400).json({ error: 'نص الرسالة فارغ' });
    return;
  }

  const senderId = currentUser?.id || 'guest_' + Date.now();
  const senderName = currentUser?.displayName || currentUser?.name || guestName || 'مشاهد';
  const senderAvatar = currentUser?.avatar;

  const msg = storage.addStreamChat({
    id: 'lchat_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    streamId: req.params.id,
    senderId,
    senderName,
    senderAvatar,
    text: String(text).trim(),
    createdAt: Date.now(),
  });

  res.json({ message: msg });
});

// Live Reactions
router.post('/live/:id/reaction', (req: Request, res: Response): void => {
  const { type } = req.body;
  const reaction = storage.addStreamReaction(req.params.id, type || 'heart');
  res.json({ reaction });
});

router.get('/live/:id/reactions', (req: Request, res: Response): void => {
  const since = Number(req.query.since) || Date.now() - 5000;
  res.json({ reactions: storage.getStreamReactions(req.params.id, since) });
});

// Backstage & Guest Management
router.post('/live/:id/backstage/join', (req: Request, res: Response): void => {
  const currentUser = getAuthUser(req);
  const { name, camOn, micOn } = req.body;
  const stream = storage.getStream(req.params.id);
  if (!stream) {
    res.status(404).json({ error: 'البث غير موجود' });
    return;
  }

  const guestId = currentUser?.id || 'gst_' + Date.now().toString(36);
  const guestName = currentUser?.displayName || currentUser?.name || name || 'ضيف';

  if (!stream.guests) stream.guests = [];
  const existingIdx = stream.guests.findIndex((g) => g.id === guestId);
  const guestItem: StreamGuest = {
    id: guestId,
    userId: currentUser?.id,
    name: guestName,
    avatar: currentUser?.avatar,
    status: 'backstage',
    isMuted: false,
    camOn: camOn !== false,
    micOn: micOn !== false,
    joinedAt: Date.now(),
  };

  if (existingIdx >= 0) {
    stream.guests[existingIdx] = guestItem;
  } else {
    stream.guests.push(guestItem);
  }
  storage.save();

  res.json({ guest: guestItem, roomUrl: stream.roomUrl });
});

router.post('/live/:id/backstage/admit', (req: Request, res: Response): void => {
  const currentUser = getAuthUser(req);
  if (!currentUser) {
    res.status(401).json({ error: 'تسجيل الدخول مطلوب' });
    return;
  }
  const stream = storage.getStream(req.params.id);
  if (!stream || stream.hostId !== currentUser.id) {
    res.status(403).json({ error: 'صلاحيات المذيع مطلوبة' });
    return;
  }

  const { guestId } = req.body;
  const guest = stream.guests?.find((g) => g.id === guestId);
  if (guest) {
    guest.status = 'stage';
    // If layout is solo, auto-switch to side-by-side
    if (stream.activeLayout === 'solo') {
      stream.activeLayout = 'side-by-side';
    }
    storage.save();
  }
  res.json({ success: true, guests: stream.guests, layout: stream.activeLayout });
});

router.post('/live/:id/backstage/reject', (req: Request, res: Response): void => {
  const currentUser = getAuthUser(req);
  if (!currentUser) {
    res.status(401).json({ error: 'تسجيل الدخول مطلوب' });
    return;
  }
  const stream = storage.getStream(req.params.id);
  if (!stream || stream.hostId !== currentUser.id) {
    res.status(403).json({ error: 'صلاحيات المذيع مطلوبة' });
    return;
  }

  const { guestId } = req.body;
  if (stream.guests) {
    stream.guests = stream.guests.filter((g) => g.id !== guestId);
    storage.save();
  }
  res.json({ success: true, guests: stream.guests });
});

router.post('/live/:id/guest/mute', (req: Request, res: Response): void => {
  const currentUser = getAuthUser(req);
  if (!currentUser) {
    res.status(401).json({ error: 'تسجيل الدخول مطلوب' });
    return;
  }
  const stream = storage.getStream(req.params.id);
  if (!stream || stream.hostId !== currentUser.id) {
    res.status(403).json({ error: 'صلاحيات المذيع مطلوبة' });
    return;
  }

  const { guestId, mute } = req.body;
  const guest = stream.guests?.find((g) => g.id === guestId);
  if (guest) {
    guest.isMuted = !!mute;
    storage.save();
  }
  res.json({ success: true, guest });
});

router.post('/live/:id/guest/remove', (req: Request, res: Response): void => {
  const currentUser = getAuthUser(req);
  if (!currentUser) {
    res.status(401).json({ error: 'تسجيل الدخول مطلوب' });
    return;
  }
  const stream = storage.getStream(req.params.id);
  if (!stream || stream.hostId !== currentUser.id) {
    res.status(403).json({ error: 'صلاحيات المذيع مطلوبة' });
    return;
  }

  const { guestId } = req.body;
  if (stream.guests) {
    stream.guests = stream.guests.filter((g) => g.id !== guestId);
    if (stream.guests.filter((g) => g.status === 'stage').length === 0) {
      stream.activeLayout = 'solo';
    }
    storage.save();
  }
  res.json({ success: true, guests: stream.guests, layout: stream.activeLayout });
});

// ----------------------------------------------------
// 7) Moments / Videos
// ----------------------------------------------------
router.get('/videos', (_req: Request, res: Response): void => {
  const videos = storage.getVideos();
  res.json({ videos });
});

router.post('/videos', (req: Request, res: Response): void => {
  const currentUser = getAuthUser(req);
  if (!currentUser) {
    res.status(401).json({ error: 'تسجيل الدخول مطلوب' });
    return;
  }
  const { videoUrl, caption, privacy, allowComments, allowDownload } = req.body;
  if (!videoUrl) {
    res.status(400).json({ error: 'رابط الفيديو مطلوب' });
    return;
  }

  const video = storage.addVideo({
    id: 'vid_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
    authorId: currentUser.id,
    authorName: currentUser.displayName || currentUser.name,
    authorAvatar: currentUser.avatar,
    videoUrl,
    caption: caption ? String(caption).trim() : '',
    privacy: privacy || 'public',
    allowComments: allowComments !== false,
    allowDownload: !!allowDownload,
    likes: [],
    createdAt: Date.now(),
  });

  res.json({ video });
});

router.post('/videos/:id/like', (req: Request, res: Response): void => {
  const currentUser = getAuthUser(req);
  if (!currentUser) {
    res.status(401).json({ error: 'تسجيل الدخول مطلوب' });
    return;
  }
  const isLiked = storage.toggleVideoLike(req.params.id, currentUser.id);
  const video = storage.getVideo(req.params.id);
  res.json({ liked: isLiked, count: video?.likes.length || 0 });
});

router.get('/videos/:id/comments', (req: Request, res: Response): void => {
  res.json({ comments: storage.getVideoComments(req.params.id) });
});

router.post('/videos/:id/comments', (req: Request, res: Response): void => {
  const currentUser = getAuthUser(req);
  if (!currentUser) {
    res.status(401).json({ error: 'تسجيل الدخول مطلوب' });
    return;
  }
  const { text } = req.body;
  if (!text || !String(text).trim()) {
    res.status(400).json({ error: 'نص التعليق مطلوب' });
    return;
  }

  const comment = storage.addVideoComment({
    id: 'vcom_' + Date.now(),
    videoId: req.params.id,
    authorId: currentUser.id,
    authorName: currentUser.displayName || currentUser.name,
    authorAvatar: currentUser.avatar,
    text: String(text).trim(),
    createdAt: Date.now(),
  });

  res.json({ comment });
});

// ----------------------------------------------------
// 8) Marketplace / Ads
// ----------------------------------------------------
router.get('/market', (req: Request, res: Response): void => {
  const { category, search } = req.query;
  let ads = storage.getMarketAds();

  if (category) {
    ads = ads.filter((a) => a.category === category);
  }
  if (search) {
    const q = String(search).toLowerCase();
    ads = ads.filter((a) => a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q) || a.location.toLowerCase().includes(q));
  }

  res.json({ ads });
});

router.post('/market', (req: Request, res: Response): void => {
  const currentUser = getAuthUser(req);
  if (!currentUser) {
    res.status(401).json({ error: 'تسجيل الدخول مطلوب' });
    return;
  }
  const { title, category, price, location, description, mediaUrl, mediaType, dynamicFields } = req.body;
  if (!title || !price) {
    res.status(400).json({ error: 'العنوان والسعر مطلوبان' });
    return;
  }

  const ad = storage.addMarketAd({
    id: 'ad_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
    authorId: currentUser.id,
    authorName: currentUser.displayName || currentUser.name,
    authorPhone: currentUser.phone,
    title: String(title).trim(),
    category: category || 'other',
    price: String(price).trim(),
    location: location ? String(location).trim() : 'غير محدد',
    description: description ? String(description).trim() : '',
    mediaUrl,
    mediaType: mediaType || 'image',
    dynamicFields,
    createdAt: Date.now(),
  });

  res.json({ ad });
});

router.delete('/market/:id', (req: Request, res: Response): void => {
  const currentUser = getAuthUser(req);
  if (!currentUser) {
    res.status(401).json({ error: 'تسجيل الدخول مطلوب' });
    return;
  }
  const ok = storage.deleteMarketAd(req.params.id, currentUser.id);
  res.json({ success: ok });
});

// ----------------------------------------------------
// 9) Companies & Groups
// ----------------------------------------------------
router.get('/companies', (_req: Request, res: Response): void => {
  res.json({ companies: storage.getCompanies() });
});

router.post('/companies', (req: Request, res: Response): void => {
  const currentUser = getAuthUser(req);
  if (!currentUser) {
    res.status(401).json({ error: 'تسجيل الدخول مطلوب' });
    return;
  }
  const { name, slug, domain, desc, logo, cover } = req.body;
  if (!name || !slug) {
    res.status(400).json({ error: 'اسم الشركة والمعرف مطلوبان' });
    return;
  }

  const company = storage.addCompany({
    id: 'comp_' + Date.now().toString(36),
    ownerId: currentUser.id,
    name: String(name).trim(),
    slug: String(slug).trim().toLowerCase(),
    domain: domain ? String(domain).trim() : undefined,
    desc: desc ? String(desc).trim() : undefined,
    logo,
    cover,
    verified: false,
    members: [{ userId: currentUser.id, role: 'owner' }],
    createdAt: Date.now(),
  });

  res.json({ company });
});

router.get('/groups', (_req: Request, res: Response): void => {
  res.json({ groups: storage.getGroups() });
});

router.post('/groups', (req: Request, res: Response): void => {
  const currentUser = getAuthUser(req);
  if (!currentUser) {
    res.status(401).json({ error: 'تسجيل الدخول مطلوب' });
    return;
  }
  const { name, slug, visibility, desc } = req.body;
  if (!name || !slug) {
    res.status(400).json({ error: 'اسم القروب والمعرف مطلوبان' });
    return;
  }

  const group = storage.addGroup({
    id: 'grp_' + Date.now().toString(36),
    ownerId: currentUser.id,
    name: String(name).trim(),
    slug: String(slug).trim().toLowerCase(),
    visibility: visibility === 'private' ? 'private' : 'public',
    desc: desc ? String(desc).trim() : undefined,
    members: [currentUser.id],
    createdAt: Date.now(),
  });

  res.json({ group });
});

router.get('/groups/:id/messages', (req: Request, res: Response): void => {
  res.json({ messages: storage.getGroupMessages(req.params.id) });
});

router.post('/groups/:id/messages', (req: Request, res: Response): void => {
  const currentUser = getAuthUser(req);
  if (!currentUser) {
    res.status(401).json({ error: 'تسجيل الدخول مطلوب' });
    return;
  }
  const { text } = req.body;
  if (!text) {
    res.status(400).json({ error: 'نص الرسالة فارغ' });
    return;
  }

  const msg = storage.addGroupMessage({
    id: 'gmsg_' + Date.now(),
    groupId: req.params.id,
    senderId: currentUser.id,
    senderName: currentUser.displayName || currentUser.name,
    senderAvatar: currentUser.avatar,
    text: String(text).trim(),
    createdAt: Date.now(),
  });

  res.json({ message: msg });
});

// ----------------------------------------------------
// 10) Profile & Verification & STS Admin
// ----------------------------------------------------
router.put('/profile', (req: Request, res: Response): void => {
  const currentUser = getAuthUser(req);
  if (!currentUser) {
    res.status(401).json({ error: 'تسجيل الدخول مطلوب' });
    return;
  }
  const { name, displayName, bio, phone, phoneVisibility, company, domain, avatar, banner, accountType } = req.body;
  const updated = storage.updateUser(currentUser.id, {
    name: name ? String(name).trim() : currentUser.name,
    displayName: displayName ? String(displayName).trim() : currentUser.displayName,
    bio: bio !== undefined ? String(bio).trim() : currentUser.bio,
    phone: phone !== undefined ? String(phone).trim() : currentUser.phone,
    phoneVisibility: phoneVisibility || currentUser.phoneVisibility,
    company: company !== undefined ? String(company).trim() : currentUser.company,
    domain: domain !== undefined ? String(domain).trim() : currentUser.domain,
    avatar: avatar !== undefined ? avatar : currentUser.avatar,
    banner: banner !== undefined ? banner : currentUser.banner,
    accountType: accountType || currentUser.accountType,
  });

  res.json({ user: updated });
});

router.post('/profile/verification', (req: Request, res: Response): void => {
  const currentUser = getAuthUser(req);
  if (!currentUser) {
    res.status(401).json({ error: 'تسجيل الدخول مطلوب' });
    return;
  }
  const { legalName, crNumber, phone, email, ownerName, crDocumentUrl, ownerIdUrl } = req.body;
  if (!legalName || !crNumber || !phone || !email) {
    res.status(400).json({ error: 'بيانات التوثيق التجاري الأساسية مطلوبة' });
    return;
  }

  const reqItem = storage.addVerification({
    id: 'ver_' + Date.now().toString(36),
    userId: currentUser.id,
    userName: currentUser.displayName || currentUser.name,
    legalName: String(legalName).trim(),
    crNumber: String(crNumber).trim(),
    phone: String(phone).trim(),
    email: String(email).trim(),
    ownerName: String(ownerName || '').trim(),
    crDocumentUrl,
    ownerIdUrl,
    status: 'pending',
    createdAt: Date.now(),
  });

  res.json({ verification: reqItem });
});

router.get('/notifications', (req: Request, res: Response): void => {
  const currentUser = getAuthUser(req);
  if (!currentUser) {
    res.status(401).json({ error: 'تسجيل الدخول مطلوب' });
    return;
  }
  res.json({ notifications: storage.getNotifications(currentUser.id) });
});

router.post('/notifications/read', (req: Request, res: Response): void => {
  const currentUser = getAuthUser(req);
  if (!currentUser) {
    res.status(401).json({ error: 'تسجيل الدخول مطلوب' });
    return;
  }
  storage.markNotificationsRead(currentUser.id);
  res.json({ success: true });
});

// STS Admin Dashboard routes
router.get('/admin/stats', (req: Request, res: Response): void => {
  const currentUser = getAuthUser(req);
  if (!currentUser || (currentUser.role !== 'owner' && currentUser.role !== 'admin')) {
    res.status(403).json({ error: 'صلاحيات الإدارة مطلوبة' });
    return;
  }
  res.json(storage.getStats());
});

router.get('/admin/verifications', (req: Request, res: Response): void => {
  const currentUser = getAuthUser(req);
  if (!currentUser || (currentUser.role !== 'owner' && currentUser.role !== 'admin')) {
    res.status(403).json({ error: 'صلاحيات الإدارة مطلوبة' });
    return;
  }
  res.json({ verifications: storage.getVerifications() });
});

router.post('/admin/verifications/:id', (req: Request, res: Response): void => {
  const currentUser = getAuthUser(req);
  if (!currentUser || (currentUser.role !== 'owner' && currentUser.role !== 'admin')) {
    res.status(403).json({ error: 'صلاحيات الإدارة مطلوبة' });
    return;
  }
  const { status, note } = req.body;
  const updated = storage.updateVerification(req.params.id, { status, note });
  res.json({ verification: updated });
});

router.get('/admin/users', (req: Request, res: Response): void => {
  const currentUser = getAuthUser(req);
  if (!currentUser || (currentUser.role !== 'owner' && currentUser.role !== 'admin')) {
    res.status(403).json({ error: 'صلاحيات الإدارة مطلوبة' });
    return;
  }
  res.json({ users: storage.getAllUsersAdmin() });
});

export default router;
