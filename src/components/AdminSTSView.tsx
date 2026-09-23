import React, { useState, useEffect } from 'react';
import { api } from '../api.ts';
import { User, VerificationRequest } from '../types.ts';
import { ShieldCheck, Users, Radio, MessageSquare, Phone, AlertCircle, Check, X, ShieldAlert } from 'lucide-react';

interface AdminSTSViewProps {
  currentUser: User;
}

export const AdminSTSView: React.FC<AdminSTSViewProps> = ({ currentUser }) => {
  const [stats, setStats] = useState<any>(null);
  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'stats' | 'verifications' | 'users'>('stats');
  const [loading, setLoading] = useState(true);

  const loadAdminData = async () => {
    try {
      const [statsRes, verRes, usersRes] = await Promise.all([
        api.getAdminStats(),
        api.getVerifications(),
        api.getAdminUsers(),
      ]);
      setStats(statsRes);
      setVerifications(verRes.verifications || []);
      setAdminUsers(usersRes.users || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleUpdateVerification = async (id: string, status: string) => {
    try {
      await api.updateVerification(id, { status });
      setVerifications((prev) =>
        prev.map((v) => (v.id === id ? { ...v, status: status as any } : v))
      );
      loadAdminData();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400">
            <ShieldAlert className="w-5 h-5" />
            <span className="text-xs font-bold tracking-widest uppercase">STS Management System</span>
          </div>
          <h2 className="text-2xl font-black text-white mt-1">لوحة الإدارة المركزية STS</h2>
          <p className="text-xs text-slate-400 mt-1">
            صلاحيات التحكم للمالك والإدارة • إدارة التوثيق الرسمي ومراقبة مؤشرات منصة SNNS.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-2xl">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'stats' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            المؤشرات
          </button>
          <button
            onClick={() => setActiveTab('verifications')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'verifications' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <span>طلبات التوثيق</span>
            {verifications.filter((v) => v.status === 'pending').length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-black">
                {verifications.filter((v) => v.status === 'pending').length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'users' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            المستخدمون
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-500 text-sm">جاري تحميل بيانات الإدارة...</div>
      ) : activeTab === 'stats' && stats ? (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <div className="bg-[#0b1020] border border-slate-800 rounded-2xl p-4 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                <span>إجمالي المستخدمين</span>
                <Users className="w-4 h-4 text-cyan-400" />
              </div>
              <span className="text-2xl font-black text-white">{stats.totalUsers}</span>
            </div>

            <div className="bg-[#0b1020] border border-slate-800 rounded-2xl p-4 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                <span>الحسابات الموثقة</span>
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
              </div>
              <span className="text-2xl font-black text-cyan-400">{stats.verifiedUsers}</span>
            </div>

            <div className="bg-[#0b1020] border border-slate-800 rounded-2xl p-4 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                <span>بثوث SNNS LIVE</span>
                <Radio className="w-4 h-4 text-rose-500" />
              </div>
              <span className="text-2xl font-black text-rose-400">{stats.liveStreams}</span>
            </div>

            <div className="bg-[#0b1020] border border-slate-800 rounded-2xl p-4 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                <span>إجمالي الرسائل</span>
                <MessageSquare className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-2xl font-black text-purple-400">{stats.totalMessages}</span>
            </div>

            <div className="bg-[#0b1020] border border-slate-800 rounded-2xl p-4 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                <span>سجل المكالمات</span>
                <Phone className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-2xl font-black text-emerald-400">{stats.totalCalls}</span>
            </div>

            <div className="bg-[#0b1020] border border-slate-800 rounded-2xl p-4 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                <span>محرك Daily WebRTC</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              </div>
              <span className="text-xs font-bold text-emerald-400 block mt-2">جاهز ونشط (100% Ready)</span>
            </div>
          </div>
        </div>
      ) : activeTab === 'verifications' ? (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-300">طلبات التوثيق التجاري الواردة</h3>
          {verifications.length === 0 ? (
            <div className="p-12 text-center rounded-3xl border border-slate-800 bg-[#090d1a]/50 text-slate-500 text-xs">
              لا توجد طلبات توثيق حالياً.
            </div>
          ) : (
            <div className="bg-[#0b1020] border border-slate-800 rounded-3xl divide-y divide-slate-800/60 overflow-hidden shadow-xl">
              {verifications.map((v) => (
                <div key={v.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <strong className="text-white text-sm">{v.legalName}</strong>
                      <span className="text-xs text-slate-400">({v.userName})</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          v.status === 'approved'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : v.status === 'rejected'
                            ? 'bg-rose-950 text-rose-400 border border-rose-800'
                            : 'bg-amber-950 text-amber-400 border border-amber-800'
                        }`}
                      >
                        {v.status === 'approved' ? 'معتمد' : v.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      السجل التجاري: <span className="text-slate-200 dir-ltr">{v.crNumber}</span> • هاتف: {v.phone} • بريد: {v.email}
                    </p>
                  </div>

                  {v.status === 'pending' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateVerification(v.id, 'approved')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>اعتماد ومنح التوثيق</span>
                      </button>
                      <button
                        onClick={() => handleUpdateVerification(v.id, 'rejected')}
                        className="px-3 py-1.5 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-300 font-bold text-xs border border-rose-800 flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>رفض</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-300">سجل المستخدمين المسجلين</h3>
          <div className="bg-[#0b1020] border border-slate-800 rounded-3xl overflow-x-auto shadow-xl">
            <table className="w-full text-right text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3">الاسم والمعرف</th>
                  <th className="p-3">البريد</th>
                  <th className="p-3">الرتبة</th>
                  <th className="p-3">التوثيق</th>
                  <th className="p-3">تاريخ التسجيل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {adminUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/40">
                    <td className="p-3">
                      <strong className="text-white block">{u.displayName || u.name}</strong>
                      <span className="text-[11px] text-slate-500 dir-ltr text-right block">@{u.username}</span>
                    </td>
                    <td className="p-3 dir-ltr text-right">{u.email}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-semibold text-[11px]">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3">
                      {u.isVerified ? (
                        <span className="text-cyan-400 font-bold">✓ موثق</span>
                      ) : (
                        <span className="text-slate-500">غير موثق</span>
                      )}
                    </td>
                    <td className="p-3 text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString('ar-SA')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
