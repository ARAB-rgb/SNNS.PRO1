import React, { useState, useEffect } from 'react';
import { api } from '../api.ts';
import { Group, GroupMessage, User } from '../types.ts';
import { Users2, Plus, X, Lock, Globe, Send, MessageSquare } from 'lucide-react';

interface GroupsViewProps {
  currentUser: User;
}

export const GroupsView: React.FC<GroupsViewProps> = ({ currentUser }) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [groupMessages, setGroupMessages] = useState<GroupMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');

  // Create modal states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [desc, setDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadGroups = async () => {
    try {
      const res = await api.getGroups();
      setGroups(res.groups || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroupMessages = async (groupId: string) => {
    try {
      const res = await api.getGroupMessages(groupId);
      setGroupMessages(res.messages || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!activeGroup) return;
    loadGroupMessages(activeGroup.id);
    const interval = setInterval(() => loadGroupMessages(activeGroup.id), 3000);
    return () => clearInterval(interval);
  }, [activeGroup?.id]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.createGroup({ name, slug, visibility, desc });
      setGroups((prev) => [...prev, res.group]);
      setShowModal(false);
      setName('');
      setSlug('');
      setDesc('');
    } catch (e: any) {
      alert('فشل إنشاء القروب: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroup || !messageInput.trim()) return;
    const text = messageInput.trim();
    setMessageInput('');
    try {
      const res = await api.sendGroupMessage(activeGroup.id, text);
      setGroupMessages((prev) => [...prev, res.message]);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-violet-400">المجتمعات والقروبات</span>
          <h2 className="text-2xl font-black text-white mt-0.5">القروبات الجماعية</h2>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-violet-600/30 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>إنشاء قروب جديد</span>
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-500 text-sm">جاري التحميل...</div>
      ) : groups.length === 0 ? (
        <div className="py-24 text-center rounded-3xl border border-slate-800 bg-[#090d1a]/50 p-8 space-y-2">
          <Users2 className="w-12 h-12 mx-auto text-slate-600" />
          <h3 className="text-base font-bold text-slate-300">لا توجد قروبات منشأة بعد</h3>
          <p className="text-xs text-slate-500">أنشئ قروباً جديداً وادعُ أصدقاءك للنقاش الجماعي.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {groups.map((g) => (
            <div
              key={g.id}
              onClick={() => setActiveGroup(g)}
              className="bg-[#0b1020] border border-slate-800 hover:border-violet-800/60 rounded-3xl p-5 shadow-xl cursor-pointer transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-md">
                    {g.name.charAt(0)}
                  </div>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 flex items-center gap-1">
                    {g.visibility === 'private' ? <Lock className="w-3 h-3 text-amber-400" /> : <Globe className="w-3 h-3 text-cyan-400" />}
                    <span>{g.visibility === 'private' ? 'خاص' : 'عام'}</span>
                  </span>
                </div>

                <h4 className="font-bold text-white text-sm">{g.name}</h4>
                <span className="text-xs text-slate-400 dir-ltr text-right block mt-0.5">@{g.slug}</span>
                {g.desc && <p className="text-xs text-slate-300 line-clamp-2 mt-2">{g.desc}</p>}
              </div>

              <div className="pt-3 mt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>{g.members?.length || 1} عضو</span>
                <span className="text-violet-400 font-bold flex items-center gap-1">
                  <span>فتح المحادثة</span>
                  <MessageSquare className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active Group Chat Drawer / Modal */}
      {activeGroup && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1020] border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl flex flex-col h-[75vh]">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">{activeGroup.name}</h3>
                <span className="text-xs text-slate-400">{activeGroup.members?.length || 1} أعضاء</span>
              </div>
              <button onClick={() => setActiveGroup(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {groupMessages.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-10">لا توجد رسائل سابقة في هذا القروب.</p>
              ) : (
                groupMessages.map((m) => {
                  const isMe = m.senderId === currentUser.id;
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col max-w-[80%] ${isMe ? 'mr-auto items-end' : 'ml-auto items-start'}`}
                    >
                      <span className="text-[10px] text-slate-400 px-1">{m.senderName}</span>
                      <div
                        className={`rounded-2xl p-2.5 text-xs shadow-md ${
                          isMe ? 'bg-violet-600 text-white' : 'bg-slate-900 border border-slate-800 text-slate-100'
                        }`}
                      >
                        {m.text}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 flex items-center gap-2">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="اكتب في القروب..."
                className="flex-1 px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-violet-500"
              />
              <button
                type="submit"
                disabled={!messageInput.trim()}
                className="p-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl disabled:opacity-40"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1020] border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm">إنشاء قروب جديد</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGroup} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">اسم القروب *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: رواد الأعمال في الرياض"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">المعرف المختصر *</label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="riyadh_biz"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs dir-ltr text-right"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">نوع القروب</label>
                <select
                  value={visibility}
                  onChange={(e: any) => setVisibility(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                >
                  <option value="public">عام (يمكن لأي شخص الانضمام)</option>
                  <option value="private">خاص (دعوات فقط)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">الوصف</label>
                <textarea
                  rows={2}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="وصف موضوع القروب وقواعده..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !name || !slug}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold text-xs shadow-lg shadow-violet-600/30 disabled:opacity-50"
              >
                {isSubmitting ? 'جاري الإنشاء...' : 'إنشاء القروب'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
