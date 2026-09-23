import React, { useState } from 'react';
import { api, setToken } from '../api.ts';
import { User } from '../types.ts';
import { Lock, User as UserIcon, Mail, Sparkles, Shield, AlertCircle } from 'lucide-react';

interface AuthViewProps {
  onSuccess: (user: User) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register' | 'sts'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');

  // STS Admin states
  const [stsId, setStsId] = useState('');
  const [stsPin, setStsPin] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.login({ username, password });
      setToken(res.token);
      onSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'فشل تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    setLoading(true);
    try {
      const res = await api.register({
        name,
        username,
        email,
        password,
        displayName: displayName || name,
      });
      setToken(res.token);
      onSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'فشل إنشاء الحساب');
    } finally {
      setLoading(false);
    }
  };

  const handleStsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await api.stsLogin({ id: stsId, pin: stsPin });
      setToken(res.token);
      onSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'بيانات اعتماد STS غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#070a14] relative overflow-hidden selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 via-purple-600 to-blue-600 p-[2px] shadow-2xl shadow-cyan-500/30 mb-4 animate-in zoom-in-90 duration-300">
            <div className="w-full h-full bg-[#070a14] rounded-[14px] flex items-center justify-center">
              <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-rose-400 text-3xl">
                S
              </span>
            </div>
          </div>
          <h1 className="text-3xl font-black tracking-wide text-white mb-2">SNNS</h1>
          <p className="text-sm text-slate-400">تواصل اجتماعي خاص • مكالمات • فيديو • واستوديو بث مباشر</p>
        </div>

        {/* Card */}
        <div className="bg-[#0b1020]/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60">
          {/* Tabs */}
          {mode !== 'sts' ? (
            <div className="flex rounded-xl bg-slate-900/90 p-1 mb-6 border border-slate-800">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(null); }}
                className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                  mode === 'login'
                    ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                تسجيل الدخول
              </button>
              <button
                type="button"
                onClick={() => { setMode('register'); setError(null); }}
                className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                  mode === 'register'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                حساب جديد
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-indigo-400">
                <Shield className="w-5 h-5" />
                <span className="font-bold text-sm">لوحة الإدارة STS</span>
              </div>
              <button
                type="button"
                onClick={() => { setMode('login'); setError(null); }}
                className="text-xs text-slate-400 hover:text-white"
              >
                ← العودة للحسابات
              </button>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">اسم المستخدم أو البريد</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="username أو email@example.com"
                    className="w-full pl-3 pr-10 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                  <UserIcon className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">كلمة المرور</label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-3 pr-10 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                  <Lock className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
              </button>
            </form>
          )}

          {/* Register Form */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">الاسم الكامل</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="محمد العتيبي"
                  className="w-full px-3.5 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">اسم المستخدم الفريد</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="user_123"
                    className="w-full px-3.5 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 transition-colors dir-ltr text-right"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">يجب أن يكون فريداً داخل SNNS بالأحرف الإنجليزية والأرقام</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">البريد الإلكتروني</label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-3.5 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 transition-colors dir-ltr text-right"
                  />
                  <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">اسم العرض (اختياري)</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="الاسم الذي يظهر للآخرين"
                  className="w-full px-3.5 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">كلمة المرور</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6 أحرف أو أكثر"
                  className="w-full px-3.5 py-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-sm shadow-lg shadow-purple-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
              </button>
            </form>
          )}

          {/* STS Admin Access */}
          {mode === 'sts' && (
            <form onSubmit={handleStsLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">معرف الإدارة (ID)</label>
                <input
                  type="text"
                  required
                  value={stsId}
                  onChange={(e) => setStsId(e.target.value)}
                  placeholder="1007363904"
                  className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-indigo-800/80 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">رمز الدخول السري (PIN)</label>
                <input
                  type="password"
                  required
                  value={stsPin}
                  onChange={(e) => setStsPin(e.target.value)}
                  placeholder="••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-900/90 border border-indigo-800/80 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 text-center text-lg tracking-widest"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                {loading ? 'جاري التحقق...' : 'دخول لوحة STS'}
              </button>
            </form>
          )}

          {/* STS Quick link footer */}
          {mode !== 'sts' && (
            <div className="mt-6 pt-4 border-t border-slate-800/70 flex items-center justify-between text-xs text-slate-500">
              <span>خاص بطاقم الإدارة:</span>
              <button
                type="button"
                onClick={() => { setMode('sts'); setError(null); }}
                className="text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-1"
              >
                <Shield className="w-3 h-3" />
                <span>دخول STS Admin</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
