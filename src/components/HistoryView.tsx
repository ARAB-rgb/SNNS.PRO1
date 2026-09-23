import React, { useState, useEffect } from 'react';
import { api } from '../api.ts';
import { CallRecord, User } from '../types.ts';
import { Phone, PhoneIncoming, PhoneOutgoing, Video, Clock } from 'lucide-react';

interface HistoryViewProps {
  currentUser: User;
  onStartCall: (targetUser: User, type: 'audio' | 'video') => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ currentUser, onStartCall }) => {
  const [history, setHistory] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const loadHistory = async () => {
    try {
      const res = await api.getCallHistory();
      setHistory(res.history || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <span className="text-xs font-bold text-emerald-400">سجل الاتصالات</span>
        <h2 className="text-2xl font-black text-white mt-0.5">المكالمات الصادرة والواردة</h2>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-500 text-sm">جاري تحميل سجل المكالمات...</div>
      ) : history.length === 0 ? (
        <div className="py-24 text-center rounded-3xl border border-slate-800 bg-[#090d1a]/50 p-8 space-y-2">
          <Clock className="w-12 h-12 mx-auto text-slate-600" />
          <h3 className="text-base font-bold text-slate-300">لا توجد مكالمات سابقة</h3>
          <p className="text-xs text-slate-500">ستظهر هنا تفاصيل المكالمات الصوتية والمرئية التي تجريها.</p>
        </div>
      ) : (
        <div className="bg-[#0b1020] border border-slate-800 rounded-3xl divide-y divide-slate-800/60 overflow-hidden shadow-xl">
          {history.map((item) => {
            const isCaller = item.callerId === currentUser.id;
            const peerName = isCaller ? item.receiverName : item.callerName;
            const peerAvatar = isCaller ? item.receiverAvatar : item.callerAvatar;
            const peerId = isCaller ? item.receiverId : item.callerId;

            return (
              <div key={item.id} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-900/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {peerAvatar ? (
                      <img src={peerAvatar} alt="" className="w-11 h-11 rounded-full object-cover border border-slate-700" />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-emerald-600 to-cyan-600 flex items-center justify-center text-white font-bold text-sm">
                        {peerName.charAt(0)}
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-slate-900 border border-slate-800">
                      {isCaller ? (
                        <PhoneOutgoing className="w-3 h-3 text-cyan-400" />
                      ) : (
                        <PhoneIncoming className="w-3 h-3 text-emerald-400" />
                      )}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-sm">{peerName}</h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400">
                      <span>{item.callType === 'video' ? 'مكالمة مرئية' : 'مكالمة صوتية'}</span>
                      <span>•</span>
                      <span>{new Date(item.startedAt).toLocaleString('ar-SA')}</span>
                      {item.duration !== undefined && (
                        <>
                          <span>•</span>
                          <span>المدة: {item.duration} ثانية</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onStartCall({ id: peerId, name: peerName, username: '', email: '' }, item.callType)}
                    className="p-2.5 rounded-xl bg-slate-900 hover:bg-emerald-950/60 border border-slate-800 hover:border-emerald-800/60 text-emerald-400 transition-colors"
                    title="إعادة الاتصال"
                  >
                    {item.callType === 'video' ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
