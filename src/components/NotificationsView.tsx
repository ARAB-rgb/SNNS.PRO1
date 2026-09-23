import React, { useState, useEffect } from 'react';
import { api } from '../api.ts';
import { NotificationItem } from '../types.ts';
import { Bell, CheckCheck, UserPlus, MessageSquare, Phone } from 'lucide-react';

interface NotificationsViewProps {
  onOpenChat: (peerId: string) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({ onOpenChat }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      const res = await api.getNotifications();
      setNotifications(res.notifications || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.markNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-orange-400">التنبيهات والأحداث</span>
          <h2 className="text-2xl font-black text-white mt-0.5">الإشعارات</h2>
        </div>

        {notifications.some((n) => !n.read) && (
          <button
            onClick={handleMarkAllRead}
            className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <CheckCheck className="w-4 h-4 text-orange-400" />
            <span>تحديد الكل كمقروء</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-500 text-sm">جاري التحميل...</div>
      ) : notifications.length === 0 ? (
        <div className="py-24 text-center rounded-3xl border border-slate-800 bg-[#090d1a]/50 p-8 space-y-2">
          <Bell className="w-12 h-12 mx-auto text-slate-600" />
          <h3 className="text-base font-bold text-slate-300">لا توجد إشعارات جديدة</h3>
          <p className="text-xs text-slate-500">ستصلك إشعارات عند تلقي رسائل أو متابعات جديدة.</p>
        </div>
      ) : (
        <div className="bg-[#0b1020] border border-slate-800 rounded-3xl divide-y divide-slate-800/60 overflow-hidden shadow-xl">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                if (n.data?.peerId) onOpenChat(n.data.peerId);
              }}
              className={`p-4 flex items-center justify-between gap-3 transition-colors ${
                !n.read ? 'bg-orange-950/20' : 'hover:bg-slate-900/40'
              } ${n.data?.peerId ? 'cursor-pointer' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                  {n.type === 'follow' ? (
                    <UserPlus className="w-5 h-5 text-cyan-400" />
                  ) : n.type === 'message' ? (
                    <MessageSquare className="w-5 h-5 text-purple-400" />
                  ) : (
                    <Phone className="w-5 h-5 text-emerald-400" />
                  )}
                </div>

                <div>
                  <h4 className="font-bold text-white text-xs">{n.title}</h4>
                  <p className="text-xs text-slate-300 mt-0.5">{n.body}</p>
                  <span className="text-[10px] text-slate-500 block mt-1">
                    {new Date(n.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {!n.read && <span className="w-2.5 h-2.5 rounded-full bg-orange-500 flex-shrink-0"></span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
