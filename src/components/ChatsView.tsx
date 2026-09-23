import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api.ts';
import { User, ChatMessage, ConversationItem } from '../types.ts';
import { Phone, Video, Send, Image, Plus, Trash2, X, MessageSquare } from 'lucide-react';

interface ChatsViewProps {
  currentUser: User;
  activePeerId?: string;
  onSelectPeer: (peerId: string) => void;
  onStartCall: (targetUser: User, type: 'audio' | 'video') => void;
}

export const ChatsView: React.FC<ChatsViewProps> = ({
  currentUser,
  activePeerId,
  onSelectPeer,
  onStartCall,
}) => {
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [peerUser, setPeerUser] = useState<User | null>(null);
  const [inputText, setInputText] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [quickReplies, setQuickReplies] = useState<Array<{ id: string; label: string; text: string }>>([]);
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [newQuickLabel, setNewQuickLabel] = useState('');
  const [newQuickText, setNewQuickText] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load conversations list
  const loadConversations = async () => {
    try {
      const res = await api.getChats();
      setConversations(res.chats || []);
    } catch (e) {
      console.error('Failed to load conversations:', e);
    }
  };

  // Load active chat messages
  const loadMessages = async () => {
    if (!activePeerId) return;
    try {
      const res = await api.getMessages(activePeerId);
      setMessages(res.messages || []);
      // also fetch peer profile
      const usersRes = await api.getUsers();
      const peer = usersRes.users.find((u) => u.id === activePeerId) || null;
      setPeerUser(peer);
    } catch (e) {
      console.error('Failed to load messages:', e);
    }
  };

  // Load quick replies
  const loadQuickReplies = async () => {
    try {
      const res = await api.getQuickReplies();
      setQuickReplies(res.quickReplies || []);
    } catch (e) {
      console.error('Failed to load quick replies:', e);
    }
  };

  useEffect(() => {
    loadConversations();
    loadQuickReplies();
    const interval = setInterval(loadConversations, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activePeerId) {
      loadMessages();
      const interval = setInterval(loadMessages, 2500);
      return () => clearInterval(interval);
    } else {
      setMessages([]);
      setPeerUser(null);
    }
  }, [activePeerId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent, mediaUrl?: string) => {
    if (e) e.preventDefault();
    if (!activePeerId || (!inputText.trim() && !mediaUrl)) return;

    const textToSend = inputText.trim();
    setInputText('');

    try {
      const res = await api.sendMessage(activePeerId, {
        text: textToSend,
        mediaUrl,
      });
      setMessages((prev) => [...prev, res.message]);
      loadConversations();
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activePeerId) return;
    setUploadingImage(true);
    try {
      const url = await api.uploadFile(file);
      await handleSendMessage(undefined, url);
    } catch (err) {
      console.error('Failed to upload image:', err);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddQuickReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuickLabel.trim() || !newQuickText.trim()) return;
    try {
      const res = await api.addQuickReply({
        label: newQuickLabel.trim(),
        text: newQuickText.trim(),
      });
      setQuickReplies((prev) => [...prev, res.item]);
      setNewQuickLabel('');
      setNewQuickText('');
    } catch (e) {
      console.error('Failed to add quick reply:', e);
    }
  };

  const handleDeleteQuickReply = async (id: string) => {
    try {
      await api.deleteQuickReply(id);
      setQuickReplies((prev) => prev.filter((q) => q.id !== id));
    } catch (e) {
      console.error('Failed to delete quick reply:', e);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col md:flex-row overflow-hidden bg-[#070a14]">
      {/* Conversations List Panel */}
      <div
        className={`w-full md:w-80 lg:w-96 border-l border-slate-800/80 bg-[#090d1a] flex flex-col h-full flex-shrink-0 ${
          activePeerId ? 'hidden md:flex' : 'flex'
        }`}
      >
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-purple-400">الرسائل الخاصة</span>
            <h2 className="text-lg font-black text-white">المحادثات</h2>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
            {conversations.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs space-y-2">
              <MessageSquare className="w-8 h-8 mx-auto text-slate-600 opacity-60" />
              <p>لا توجد محادثات سابقة.</p>
              <p className="text-[11px] text-slate-600">اختر مستخدماً من جهات الاتصال لبدء محادثة مشفرة.</p>
            </div>
          ) : (
            conversations.map((c) => {
              const isSelected = activePeerId === c.peerId;
              return (
                <div
                  key={c.peerId}
                  onClick={() => onSelectPeer(c.peerId)}
                  className={`p-3.5 flex items-center gap-3 cursor-pointer transition-colors ${
                    isSelected ? 'bg-purple-950/40 border-r-2 border-purple-500' : 'hover:bg-slate-800/50'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    {c.peerAvatar ? (
                      <img src={c.peerAvatar} alt="" className="w-11 h-11 rounded-full object-cover border border-slate-700" />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-purple-600 to-cyan-600 flex items-center justify-center text-white font-bold text-sm">
                        {c.peerName.charAt(0)}
                      </div>
                    )}
                    {c.isOnline && (
                      <span className="absolute bottom-0 left-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#090d1a]"></span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-xs font-bold text-white truncate">{c.peerName}</h4>
                      <span className="text-[10px] text-slate-500">
                        {new Date(c.lastMessageTime).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">{c.lastMessage || 'مرفق'}</p>
                  </div>

                  {c.unreadCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-purple-500 text-slate-950 text-[10px] font-black flex items-center justify-center flex-shrink-0">
                      {c.unreadCount}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Active Conversation Panel */}
      <div className={`flex-1 flex flex-col h-full bg-[#070a14] ${!activePeerId ? 'hidden md:flex' : 'flex'}`}>
        {activePeerId && peerUser ? (
          <>
            {/* Chat Top Header */}
            <div className="h-16 px-4 border-b border-slate-800/80 flex items-center justify-between bg-[#090d1a]/80 backdrop-blur-sm flex-shrink-0">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onSelectPeer('')}
                  className="md:hidden text-slate-400 hover:text-white text-lg font-bold px-2 py-1"
                >
                  ‹
                </button>
                <div className="relative">
                  {peerUser.avatar ? (
                    <img src={peerUser.avatar} alt="" className="w-10 h-10 rounded-full object-cover border border-slate-700" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-cyan-600 flex items-center justify-center text-white font-bold text-xs">
                      {peerUser.name?.charAt(0) || 'U'}
                    </div>
                  )}
                  {peerUser.isOnline && (
                    <span className="absolute bottom-0 left-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border border-[#090d1a]"></span>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-1">
                    <span>{peerUser.displayName || peerUser.name}</span>
                    {peerUser.isVerified && <span className="text-cyan-400 text-xs">✓</span>}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {peerUser.isOnline ? 'متصل الآن' : `@${peerUser.username}`}
                  </span>
                </div>
              </div>

              {/* Direct Audio / Video Call triggers */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onStartCall(peerUser, 'audio')}
                  className="p-2.5 rounded-xl bg-slate-900 hover:bg-emerald-950/60 border border-slate-800 hover:border-emerald-800/60 text-emerald-400 transition-colors cursor-pointer"
                  title="مكالمة صوتية"
                  aria-label="مكالمة صوتية"
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onStartCall(peerUser, 'video')}
                  className="p-2.5 rounded-xl bg-slate-900 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-800/60 text-cyan-400 transition-colors cursor-pointer"
                  title="مكالمة فيديو"
                  aria-label="مكالمة فيديو"
                >
                  <Video className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="py-20 text-center text-slate-500 text-xs space-y-1">
                  <p>ابدأ المحادثة الآن بخصوصية وأمان.</p>
                  <p className="text-[11px] text-slate-600">الرسائل والمرفقات مشفرة.</p>
                </div>
              ) : (
                messages.map((m) => {
                  const isMine = m.senderId === currentUser.id;
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col max-w-[80%] sm:max-w-md ${
                        isMine ? 'mr-auto items-end' : 'ml-auto items-start'
                      }`}
                    >
                      <div
                        className={`rounded-2xl p-3 shadow-md text-sm ${
                          isMine
                            ? 'bg-gradient-to-tr from-purple-700 to-indigo-600 text-white rounded-br-none'
                            : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-none'
                        }`}
                      >
                        {m.mediaUrl && (
                          <div className="mb-2 rounded-xl overflow-hidden border border-white/10">
                            <img src={m.mediaUrl} alt="" className="max-h-64 w-full object-cover" />
                          </div>
                        )}
                        {m.text && <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>}
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 px-1">
                        {new Date(m.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies Bar */}
            <div className="px-4 py-2 border-t border-slate-800/60 bg-[#090d1a]/50 flex items-center justify-between gap-2 overflow-x-auto text-xs">
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <span className="text-slate-500 text-[11px] flex-shrink-0">رد سريع:</span>
                {quickReplies.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => setInputText(q.text)}
                    className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-purple-950/60 border border-slate-800 hover:border-purple-800/50 text-slate-300 hover:text-purple-300 text-[11px] flex-shrink-0 transition-colors"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setShowQuickModal(true)}
                className="text-purple-400 hover:text-purple-300 font-semibold text-[11px] flex-shrink-0 px-2 py-0.5"
              >
                إدارة
              </button>
            </div>

            {/* Compose Message Box */}
            <form
              onSubmit={(e) => handleSendMessage(e)}
              className="p-3 border-t border-slate-800/80 bg-[#090d1a] flex items-center gap-2 flex-shrink-0"
            >
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handleImagePick}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors cursor-pointer"
                title="إرفاق صورة"
              >
                <Image className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={uploadingImage ? 'جاري رفع الصورة...' : 'اكتب رسالتك الخاصة هنا...'}
                className="flex-1 px-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
              />

              <button
                type="submit"
                disabled={!inputText.trim() && !uploadingImage}
                className="p-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/30 transition-all disabled:opacity-40 cursor-pointer"
                aria-label="إرسال"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-purple-400 mb-3 shadow-lg">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-300">محادثات SNNS الخاصة</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              اختر محادثة من القائمة الجانبية أو ابدأ محادثة جديدة من دليل جهات الاتصال.
            </p>
          </div>
        )}
      </div>

      {/* Quick Replies Manager Modal */}
      {showQuickModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1020] border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm">إدارة الردود الجاهزة</h3>
              <button
                onClick={() => setShowQuickModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddQuickReply} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">اسم الزر المختصر</label>
                <input
                  type="text"
                  required
                  value={newQuickLabel}
                  onChange={(e) => setNewQuickLabel(e.target.value)}
                  placeholder="مثال: ترحيب"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">نص الرد الكامل</label>
                <textarea
                  required
                  rows={3}
                  value={newQuickText}
                  onChange={(e) => setNewQuickText(e.target.value)}
                  placeholder="السلام عليكم ورحمة الله، أهلاً بك!"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                ></textarea>
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-colors"
              >
                ＋ إضافة رد جاهز
              </button>
            </form>

            <div className="space-y-2 max-h-48 overflow-y-auto pt-2">
              {quickReplies.map((q) => (
                <div key={q.id} className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <strong className="text-white block">{q.label}</strong>
                    <p className="text-slate-400 text-[11px] truncate max-w-xs">{q.text}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteQuickReply(q.id)}
                    className="text-rose-400 hover:text-rose-300 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
