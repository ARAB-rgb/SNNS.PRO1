import React, { useState, useEffect } from 'react';
import { api } from '../api.ts';
import { User } from '../types.ts';
import { Camera, ShieldCheck, UserCheck, Phone, Mail, Building2, Globe, Lock, Check, AlertCircle } from 'lucide-react';

interface ProfileViewProps {
  user: User;
  onUserUpdated: (user: User) => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({ user, onUserUpdated }) => {
  const [displayName, setDisplayName] = useState(user.displayName || user.name);
  const [bio, setBio] = useState(user.bio || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [phoneVisibility, setPhoneVisibility] = useState<'private' | 'contacts' | 'public'>(
    user.phoneVisibility || 'private'
  );
  const [company, setCompany] = useState(user.company || '');
  const [domain, setDomain] = useState(user.domain || '');
  const [accountType, setAccountType] = useState<'person' | 'company'>(user.accountType || 'person');

  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Verification request form states
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [legalName, setLegalName] = useState('');
  const [crNumber, setCrNumber] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [submittingVerify, setSubmittingVerify] = useState(false);
  const [verifySubmitted, setVerifySubmitted] = useState(false);

  // Blocked users
  const [blockedUsers, setBlockedUsers] = useState<User[]>([]);

  useEffect(() => {
    loadBlocked();
  }, []);

  const loadBlocked = async () => {
    try {
      const res = await api.getBlocked();
      setBlockedUsers(res.users || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUnblock = async (targetId: string) => {
    try {
      await api.blockUser(targetId);
      setBlockedUsers((prev) => prev.filter((u) => u.id !== targetId));
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      const res = await api.updateProfile({
        displayName,
        bio,
        phone,
        phoneVisibility,
        company,
        domain,
        accountType,
      });
      onUserUpdated(res.user);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e: any) {
      alert('فشل حفظ التعديلات: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await api.uploadFile(file);
      const res = await api.updateProfile({ avatar: url });
      onUserUpdated(res.user);
    } catch (e: any) {
      alert('فشل رفع الصورة الشخصية: ' + e.message);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const url = await api.uploadFile(file);
      const res = await api.updateProfile({ banner: url });
      onUserUpdated(res.user);
    } catch (e: any) {
      alert('فشل رفع صورة الغلاف: ' + e.message);
    }
  };

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingVerify(true);
    try {
      await api.submitVerification({
        legalName,
        crNumber,
        phone: contactPhone,
        email: contactEmail,
        ownerName,
      });
      setVerifySubmitted(true);
      setTimeout(() => {
        setShowVerifyModal(false);
        setVerifySubmitted(false);
      }, 2500);
    } catch (e: any) {
      alert('فشل تقديم طلب التوثيق: ' + e.message);
    } finally {
      setSubmittingVerify(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Profile Cover & Header Card */}
      <div className="bg-[#0b1020] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl relative">
        {/* Cover Photo */}
        <div className="h-40 sm:h-52 bg-gradient-to-r from-cyan-900/60 via-purple-900/40 to-slate-900 relative">
          {user.banner && <img src={user.banner} alt="" className="w-full h-full object-cover" />}
          <label className="absolute top-3 left-3 p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white cursor-pointer text-xs font-semibold flex items-center gap-1.5 backdrop-blur-sm transition-colors">
            <input type="file" accept="image/*" onChange={handleBannerUpload} className="hidden" />
            <Camera className="w-3.5 h-3.5" />
            <span>تغيير الغلاف</span>
          </label>
        </div>

        {/* Profile Details Header */}
        <div className="p-5 sm:p-6 pt-0 relative flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 sm:-mt-20">
          <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-right">
            <div className="relative group">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt=""
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl object-cover border-4 border-[#0b1020] shadow-2xl"
                />
              ) : (
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-gradient-to-tr from-cyan-600 to-purple-600 flex items-center justify-center text-white text-3xl font-black border-4 border-[#0b1020] shadow-2xl">
                  {user.name?.charAt(0) || 'U'}
                </div>
              )}
              <label className="absolute inset-0 bg-black/50 rounded-3xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                <Camera className="w-6 h-6" />
              </label>
            </div>

            <div className="mb-2">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h2 className="text-xl sm:text-2xl font-black text-white">{user.displayName || user.name}</h2>
                {user.isVerified && (
                  <span title="موثق رسمياً">
                    <ShieldCheck className="w-5 h-5 text-cyan-400" />
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 dir-ltr text-right">@{user.username}</p>
              <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300">
                {user.accountType === 'company' ? 'حساب تجاري معتمد' : 'حساب شخصي'}
              </span>
            </div>
          </div>

          {/* Verification Badge Trigger */}
          <div>
            {!user.isVerified ? (
              <button
                onClick={() => setShowVerifyModal(true)}
                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800/60 text-cyan-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>طلب توثيق الحساب التجاري</span>
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/40 border border-cyan-800/40 text-cyan-400 text-xs font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>حسابك موثق بالشارة الزرقاء</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Information Form */}
      <form onSubmit={handleSaveProfile} className="bg-[#0b1020] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="font-black text-white text-base">تعديل بيانات الحساب</h3>
            <p className="text-xs text-slate-400">تحكم بالبيانات الشخصية وخصوصية رقم الهاتف.</p>
          </div>
          {saveSuccess && (
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
              <Check className="w-4 h-4" />
              <span>تم الحفظ بنجاح</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">اسم العرض</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">نوع الحساب</label>
            <select
              value={accountType}
              onChange={(e: any) => setAccountType(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none"
            >
              <option value="person">شخصي (أفراد)</option>
              <option value="company">تجاري (شركات ومؤسسات)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">النبذة التعريفية (Bio)</label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="اكتب نبذة عنك..."
            className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none"
          ></textarea>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">رقم الهاتف</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05xxxxxxxx"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs dir-ltr text-right"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">خصوصية ظهور رقم الهاتف</label>
            <select
              value={phoneVisibility}
              onChange={(e: any) => setPhoneVisibility(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
            >
              <option value="private">خاص (مخفي تماماً)</option>
              <option value="contacts">جهات الاتصال فقط (من أتابعهم)</option>
              <option value="public">عام (ظاهر للجميع)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">الشركة / الجهة التابع لها</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="مثال: شركة SNNS"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">الدومين / الموقع الإلكتروني</label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="domain.com"
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs dir-ltr text-right"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition-all cursor-pointer"
          >
            {saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
          </button>
        </div>
      </form>

      {/* Blocked Users Section */}
      <div className="bg-[#0b1020] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div>
          <h3 className="font-black text-white text-base">المستخدمون المحظورون</h3>
          <p className="text-xs text-slate-400">قائمة الحسابات التي قمت بحظرها من التواصل معك.</p>
        </div>

        {blockedUsers.length === 0 ? (
          <p className="text-xs text-slate-500 py-3">قائمة الحظر فارغة.</p>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {blockedUsers.map((b) => (
              <div key={b.id} className="py-2.5 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">{b.displayName || b.name}</h4>
                  <span className="text-[11px] text-slate-500">@{b.username}</span>
                </div>
                <button
                  onClick={() => handleUnblock(b.id)}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                >
                  إلغاء الحظر
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verification Request Modal */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1020] border border-cyan-800/80 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-cyan-400">
                <ShieldCheck className="w-5 h-5" />
                <h3 className="font-bold text-white text-sm">طلب التوثيق التجاري الرسمي</h3>
              </div>
              <button onClick={() => setShowVerifyModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            {verifySubmitted ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-full bg-emerald-950 border border-emerald-800 flex items-center justify-center text-emerald-400">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-white text-sm">تم إرسال طلب التوثيق بنجاح</h4>
                <p className="text-xs text-slate-400">ستتم مراجعته من قبل إدارة المنصة في لوحة STS.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitVerification} className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">الاسم القانوني للمنشأة *</label>
                  <input
                    type="text"
                    required
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    placeholder="مؤسسة التقنية للتجارة"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">رقم السجل التجاري (CR) *</label>
                  <input
                    type="text"
                    required
                    value={crNumber}
                    onChange={(e) => setCrNumber(e.target.value)}
                    placeholder="1010xxxxxx"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs dir-ltr text-right"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">رقم الجوال الرسمي *</label>
                    <input
                      type="tel"
                      required
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="05xxxxxxxx"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs dir-ltr text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">البريد التجاري *</label>
                    <input
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="info@corp.sa"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs dir-ltr text-right"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-300 mb-1">اسم المالك أو المفوض</label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="الاسم الثلاثي"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingVerify}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 disabled:opacity-50 mt-2"
                >
                  {submittingVerify ? 'جاري الإرسال...' : 'إرسال طلب التوثيق للإدارة'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
