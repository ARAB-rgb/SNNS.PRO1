// Client API helper for SNNS

const BASE_URL = '/api';

export function getToken(): string | null {
  return localStorage.getItem('snns_token');
}

export function setToken(token: string | null) {
  if (token) {
    localStorage.setItem('snns_token', token);
  } else {
    localStorage.removeItem('snns_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    let errMessage = 'حدث خطأ في الاتصال';
    try {
      const data = await res.json();
      if (data.error) errMessage = data.error;
    } catch {
      errMessage = await res.text() || res.statusText;
    }
    throw new Error(errMessage);
  }

  return res.json() as Promise<T>;
}

export const api = {
  // Auth
  register: (body: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  stsLogin: (body: { id: string; pin: string }) => request<any>('/auth/sts-login', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request<{ user: any }>('/auth/me'),
  logout: () => request<any>('/auth/logout', { method: 'POST' }),

  // Users & Contacts
  getUsers: () => request<{ users: any[] }>('/users'),
  followUser: (id: string) => request<any>(`/users/${id}/follow`, { method: 'POST' }),
  blockUser: (id: string) => request<any>(`/users/${id}/block`, { method: 'POST' }),
  getBlocked: () => request<{ users: any[] }>('/blocked'),
  updateLocation: (body: { lat?: number; lng?: number; shareLocation: boolean }) =>
    request<any>('/users/location', { method: 'POST', body: JSON.stringify(body) }),
  getNearby: (radius: number) => request<{ nearby: any[] }>(`/nearby?radius=${radius}`),

  // Chats
  getChats: () => request<{ chats: any[] }>('/chats'),
  getMessages: (peerId: string) => request<{ messages: any[] }>(`/messages/${peerId}`),
  sendMessage: (peerId: string, body: { text?: string; mediaUrl?: string }) =>
    request<any>(`/messages/${peerId}`, { method: 'POST', body: JSON.stringify(body) }),
  getQuickReplies: () => request<{ quickReplies: any[] }>('/quick-replies'),
  addQuickReply: (body: { label: string; text: string }) =>
    request<any>('/quick-replies', { method: 'POST', body: JSON.stringify(body) }),
  deleteQuickReply: (id: string) => request<any>(`/quick-replies/${id}`, { method: 'DELETE' }),

  // Calls & Daily
  initiateCall: (receiverId: string, callType: 'audio' | 'video') =>
    request<any>('/calls/initiate', { method: 'POST', body: JSON.stringify({ receiverId, callType }) }),
  getActiveCall: () => request<{ call: any | null }>('/calls/active'),
  respondCall: (callId: string, accept: boolean) =>
    request<any>(`/calls/${callId}/respond`, { method: 'POST', body: JSON.stringify({ accept }) }),
  endCall: (callId: string) => request<any>(`/calls/${callId}/end`, { method: 'POST' }),
  getCallHistory: () => request<{ history: any[] }>('/calls/history'),

  // SNNS LIVE Studio & Streams
  createStream: (body: { title: string; description?: string; category?: string; coverUrl?: string }) =>
    request<any>('/live/create', { method: 'POST', body: JSON.stringify(body) }),
  getStreams: () => request<{ streams: any[] }>('/live/list'),
  getStream: (id: string) => request<{ stream: any }>(`/live/${id}`),
  heartbeatStream: (id: string, body?: { viewerId?: string }) =>
    request<any>(`/live/${id}/heartbeat`, { method: 'POST', body: JSON.stringify(body || {}) }),
  leaveStream: (id: string, body?: { viewerId?: string }) =>
    request<any>(`/live/${id}/leave`, { method: 'POST', body: JSON.stringify(body || {}) }),
  endStream: (id: string) => request<any>(`/live/${id}/end`, { method: 'POST' }),
  setStreamLayout: (id: string, layout: string) =>
    request<any>(`/live/${id}/layout`, { method: 'POST', body: JSON.stringify({ layout }) }),
  getStreamChat: (id: string) => request<{ messages: any[] }>(`/live/${id}/chat`),
  sendStreamChat: (id: string, body: { text: string; guestName?: string }) =>
    request<any>(`/live/${id}/chat`, { method: 'POST', body: JSON.stringify(body) }),
  sendStreamReaction: (id: string, type: string) =>
    request<any>(`/live/${id}/reaction`, { method: 'POST', body: JSON.stringify({ type }) }),
  getStreamReactions: (id: string, since: number) =>
    request<{ reactions: any[] }>(`/live/${id}/reactions?since=${since}`),
  joinBackstage: (id: string, body: { name?: string; camOn?: boolean; micOn?: boolean }) =>
    request<any>(`/live/${id}/backstage/join`, { method: 'POST', body: JSON.stringify(body) }),
  admitGuest: (id: string, guestId: string) =>
    request<any>(`/live/${id}/backstage/admit`, { method: 'POST', body: JSON.stringify({ guestId }) }),
  rejectGuest: (id: string, guestId: string) =>
    request<any>(`/live/${id}/backstage/reject`, { method: 'POST', body: JSON.stringify({ guestId }) }),
  muteGuest: (id: string, guestId: string, mute: boolean) =>
    request<any>(`/live/${id}/guest/mute`, { method: 'POST', body: JSON.stringify({ guestId, mute }) }),
  removeGuest: (id: string, guestId: string) =>
    request<any>(`/live/${id}/guest/remove`, { method: 'POST', body: JSON.stringify({ guestId }) }),

  // Moments / Videos
  getVideos: () => request<{ videos: any[] }>('/videos'),
  uploadVideo: (body: any) => request<any>('/videos', { method: 'POST', body: JSON.stringify(body) }),
  likeVideo: (id: string) => request<any>(`/videos/${id}/like`, { method: 'POST' }),
  getVideoComments: (id: string) => request<{ comments: any[] }>(`/videos/${id}/comments`),
  addVideoComment: (id: string, text: string) =>
    request<any>(`/videos/${id}/comments`, { method: 'POST', body: JSON.stringify({ text }) }),

  // Marketplace
  getAds: (params: { category?: string; search?: string } = {}) => {
    const q = new URLSearchParams();
    if (params.category) q.set('category', params.category);
    if (params.search) q.set('search', params.search);
    return request<{ ads: any[] }>(`/market?${q.toString()}`);
  },
  createAd: (body: any) => request<any>('/market', { method: 'POST', body: JSON.stringify(body) }),
  deleteAd: (id: string) => request<any>(`/market/${id}`, { method: 'DELETE' }),

  // Companies & Groups
  getCompanies: () => request<{ companies: any[] }>('/companies'),
  createCompany: (body: any) => request<any>('/companies', { method: 'POST', body: JSON.stringify(body) }),
  getGroups: () => request<{ groups: any[] }>('/groups'),
  createGroup: (body: any) => request<any>('/groups', { method: 'POST', body: JSON.stringify(body) }),
  getGroupMessages: (groupId: string) => request<{ messages: any[] }>(`/groups/${groupId}/messages`),
  sendGroupMessage: (groupId: string, text: string) =>
    request<any>(`/groups/${groupId}/messages`, { method: 'POST', body: JSON.stringify({ text }) }),

  // Profile & Verification
  updateProfile: (body: any) => request<any>('/profile', { method: 'PUT', body: JSON.stringify(body) }),
  submitVerification: (body: any) => request<any>('/profile/verification', { method: 'POST', body: JSON.stringify(body) }),
  getNotifications: () => request<{ notifications: any[] }>('/notifications'),
  markNotificationsRead: () => request<any>('/notifications/read', { method: 'POST' }),

  // STS Admin
  getAdminStats: () => request<any>('/admin/stats'),
  getVerifications: () => request<{ verifications: any[] }>('/admin/verifications'),
  updateVerification: (id: string, body: { status: string; note?: string }) =>
    request<any>(`/admin/verifications/${id}`, { method: 'POST', body: JSON.stringify(body) }),
  getAdminUsers: () => request<{ users: any[] }>('/admin/users'),

  // File Upload
  uploadFile: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${BASE_URL}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      throw new Error('فشل رفع الملف');
    }
    const data = await res.json();
    return data.url;
  },
};
