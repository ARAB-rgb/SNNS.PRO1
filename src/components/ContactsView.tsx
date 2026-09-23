import React, { useState, useEffect } from 'react';
import { api } from '../api.ts';
import { User, LiveStream } from '../types.ts';
import { Search, Phone, Video, MessageSquare, Radio, UserPlus, UserCheck, ExternalLink } from 'lucide-react';

interface ContactsViewProps {
  currentUser: User;
  onStartCall: (targetUser: User, type: 'audio' | 'video') => void;
  onOpenChat: (peerId: string) => void;
  onOpenLive: (streamId?: string) => void;
}

export const ContactsView: React.FC<ContactsViewProps> = ({
  currentUser,
  onStartCall,
  onOpenChat,
  onOpenLive,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [filter, setFilter] = useState<'all' | 'following' | 'followers'>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [usersRes, streamsRes] = await Promise.all([
        api.getUsers(),
        api.getStreams(),
      ]);
      // Exclude oneself
      setUsers(usersRes.users.filter((u) => u.id !== currentUser.id));
      setLiveStreams(streamsRes.streams || []);
    } catch (e) {
      console.error('Failed to load contacts or streams:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [currentUser.id]);

  const handleToggleFollow = async (userId: string) => {
    try {
      const res = await api.followUser(userId);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isFollowing: res.following } : u))
      );
    } catch (e) {
      console.error('Follow toggle failed:', e);
    }
  };

  const filteredUsers = users.filter((u) => {
    if (filter === 'following' && !u.isFollowing) return false;
    if (filter === 'followers' && !u.isFollower) return false;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      const matchName = (u.name || '').toLowerCase().includes(q);
      const matchUsername = (u.username || '').toLowerCase().includes(q);
      const matchCompany = (u.company || '').toLowerCase().includes(q);
      const matchDomain = (u.domain || '').toLowerCase().includes(q);
      return matchName || matchUsername || matchCompany || matchDomain;
    }
    return true;
  });

  const onlineCount = users.filter((u) => u.isOnline).length;
  const followingCount = users.filter((u) => u.isFollowing).length;
  const followersCount = users.filter((u) => u.isFollower).length;

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-cyan-400 tracking-wider">دليل الاتصال والتواصل</span>
          <h2 className="text-2xl font-black text-white mt-0.5">جهات الاتصال</h2>
          <p className="text-xs text-slate-400 mt-1">تواصل مباشرة بمكالمة صوتية أو مرئية، أو راسل أصدقائك بخصوصية تامة.</p>
        </div>

        <button
          onClick={() => onOpenLive()}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs sm:text-sm shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
        >
          <Radio className="w-4 h-4 animate-pulse" />
          <span>بدء بث مباشر LIVE</span>
        </button>
      </div>

      {/* Live Now Ticker / Banner if real streams are active */}
      {liveStreams.length > 0 && (
        <section className="bg-gradient-to-r from-rose-950/40 via-purple-950/30 to-slate-900 border border-rose-800/40 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
              <h3 className="text-sm font-bold text-rose-300">مباشر الآن على SNNS</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-950 text-rose-400 border border-rose-800/50 font-semibold">
                {liveStreams.length} بث نشط
              </span>
            </div>
            <button
              onClick={() => onOpenLive()}
              className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
            >
              <span>عرض استوديو البث</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {liveStreams.map((s) => (
              <div
                key={s.id}
                onClick={() => onOpenLive(s.id)}
                className="group relative bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-rose-700/60 rounded-xl p-3 cursor-pointer transition-all flex items-center justify-between gap-3 shadow-md"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="relative flex-shrink-0">
                    {s.hostAvatar ? (
                      <img src={s.hostAvatar} alt="" className="w-10 h-10 rounded-full object-cover border border-rose-500/60" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-rose-600 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                        {s.hostName?.charAt(0) || 'L'}
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded text-[9px] font-black bg-rose-600 text-white">
                      LIVE
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate group-hover:text-rose-400 transition-colors">
                      {s.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 truncate">{s.hostName}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end flex-shrink-0">
                  <span className="text-[11px] font-bold text-rose-400">
                    {s.viewerCount} مشاهد
                  </span>
                  <span className="text-[10px] text-slate-500">انضم</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم، المعرف، الشركة أو الدومين..."
            className="w-full pl-4 pr-10 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-500 transition-colors placeholder:text-slate-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/80 border border-slate-800 rounded-xl">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              filter === 'all'
                ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/60 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>الكل</span>
            <span className="text-[10px] opacity-70">({users.length})</span>
          </button>
          <button
            onClick={() => setFilter('following')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              filter === 'following'
                ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/60 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>أتابعهم</span>
            <span className="text-[10px] opacity-70">({followingCount})</span>
          </button>
          <button
            onClick={() => setFilter('followers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 ${
              filter === 'followers'
                ? 'bg-cyan-950 text-cyan-400 border border-cyan-800/60 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>يتابعونني</span>
            <span className="text-[10px] opacity-70">({followersCount})</span>
          </button>
        </div>
      </div>

      {/* Online count badge */}
      <div className="text-xs text-slate-400 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
        <span>{onlineCount} مستخدم متصل الآن</span>
      </div>

      {/* Users Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 text-sm">جاري تحميل جهات الاتصال...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="py-20 text-center rounded-2xl border border-slate-800/60 bg-slate-900/30 p-8 space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800/60 flex items-center justify-center text-slate-500 text-xl font-bold">
            ◉
          </div>
          <h3 className="text-base font-bold text-slate-300">لا يوجد مستخدمون في هذه القائمة</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {search
              ? 'لم يتم العثور على نتائج تطابق بحثك.'
              : 'عند تسجيل مستخدمين آخرين في المنصة سيظهرون هنا تلقائياً دون أي بيانات وهمية.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map((target) => (
            <div
              key={target.id}
              className="bg-[#0b1020]/80 border border-slate-800/90 hover:border-cyan-800/60 rounded-2xl p-4 transition-all duration-200 shadow-lg flex flex-col justify-between"
            >
              {/* Profile Top */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative flex-shrink-0">
                      {target.avatar ? (
                        <img src={target.avatar} alt="" className="w-12 h-12 rounded-full object-cover border border-slate-700" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                          {target.name?.charAt(0) || 'U'}
                        </div>
                      )}
                      {target.isOnline && (
                        <span className="absolute bottom-0 left-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0b1020]"></span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-bold text-white text-sm truncate">{target.displayName || target.name}</h4>
                        {target.isVerified && (
                          <span className="text-cyan-400 text-xs flex-shrink-0" title="موثق">✓</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 dir-ltr text-right truncate">@{target.username}</p>
                    </div>
                  </div>

                  {/* Follow / Unfollow */}
                  <button
                    onClick={() => handleToggleFollow(target.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                      target.isFollowing
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 hover:bg-cyan-900/60'
                    }`}
                  >
                    {target.isFollowing ? (
                      <>
                        <UserCheck className="w-3 h-3" />
                        <span>أتابعه</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3 h-3" />
                        <span>متابعة</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Company / Domain / Bio */}
                {(target.company || target.domain || target.bio) && (
                  <div className="mb-4 text-xs text-slate-400 space-y-1">
                    {target.bio && <p className="line-clamp-2 text-slate-300">{target.bio}</p>}
                    <div className="flex items-center gap-2 text-[11px] text-cyan-400/80 flex-wrap">
                      {target.company && <span>🏢 {target.company}</span>}
                      {target.domain && <span className="dir-ltr">🌐 {target.domain}</span>}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons: Audio, Video, Chat */}
              <div className="pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2">
                <button
                  onClick={() => onStartCall(target, 'audio')}
                  className="py-2 rounded-xl bg-slate-900 hover:bg-emerald-950/50 border border-slate-800 hover:border-emerald-800/60 text-slate-300 hover:text-emerald-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="مكالمة صوتية"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>صوت</span>
                </button>

                <button
                  onClick={() => onStartCall(target, 'video')}
                  className="py-2 rounded-xl bg-slate-900 hover:bg-cyan-950/50 border border-slate-800 hover:border-cyan-800/60 text-slate-300 hover:text-cyan-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="مكالمة فيديو"
                >
                  <Video className="w-3.5 h-3.5 text-cyan-400" />
                  <span>فيديو</span>
                </button>

                <button
                  onClick={() => onOpenChat(target.id)}
                  className="py-2 rounded-xl bg-slate-900 hover:bg-purple-950/50 border border-slate-800 hover:border-purple-800/60 text-slate-300 hover:text-purple-400 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  title="محادثة خاصة"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                  <span>رسالة</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
