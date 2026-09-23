import React, { useState, useEffect } from 'react';
import { api } from '../api.ts';
import { Company, User } from '../types.ts';
import { Building2, Plus, X, Globe, ShieldCheck } from 'lucide-react';

interface CompaniesViewProps {
  currentUser: User;
}

export const CompaniesView: React.FC<CompaniesViewProps> = ({ currentUser }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [domain, setDomain] = useState('');
  const [desc, setDesc] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadCompanies = async () => {
    try {
      const res = await api.getCompanies();
      setCompanies(res.companies || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCompanies();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await api.createCompany({ name, slug, domain, desc });
      setCompanies((prev) => [...prev, res.company]);
      setShowModal(false);
      setName('');
      setSlug('');
      setDomain('');
      setDesc('');
    } catch (e: any) {
      alert('فشل إنشاء الشركة: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-blue-400">قطاع الأعمال</span>
          <h2 className="text-2xl font-black text-white mt-0.5">دليل الشركات والمؤسسات</h2>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-blue-600/30 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>تسجيل شركة</span>
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-500 text-sm">جاري التحميل...</div>
      ) : companies.length === 0 ? (
        <div className="py-24 text-center rounded-3xl border border-slate-800 bg-[#090d1a]/50 p-8 space-y-2">
          <Building2 className="w-12 h-12 mx-auto text-slate-600" />
          <h3 className="text-base font-bold text-slate-300">لا توجد شركات مسجلة بعد</h3>
          <p className="text-xs text-slate-500">سجّل شركتك أو مؤسستك لتظهر في دليل الشركات الموثق.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {companies.map((c) => (
            <div
              key={c.id}
              className="bg-[#0b1020] border border-slate-800 hover:border-blue-800/60 rounded-3xl p-5 shadow-xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md">
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm flex items-center gap-1">
                      <span>{c.name}</span>
                      {c.verified && <ShieldCheck className="w-4 h-4 text-blue-400" />}
                    </h4>
                    <span className="text-xs text-slate-400 dir-ltr text-right block">@{c.slug}</span>
                  </div>
                </div>
                {c.desc && <p className="text-xs text-slate-300 line-clamp-2">{c.desc}</p>}
                {c.domain && (
                  <div className="flex items-center gap-1.5 text-xs text-blue-400 mt-3 font-semibold dir-ltr text-right">
                    <Globe className="w-3.5 h-3.5" />
                    <span>{c.domain}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span>{c.members?.length || 1} أعضاء</span>
                <span className="text-blue-400 font-semibold">ملف معتمد</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1020] border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm">تسجيل شركة جديدة</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">اسم الشركة أو المؤسسة *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="شركة التقنية المتقدمة"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">المعرف المختصر (Slug) *</label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  placeholder="tech_corp"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs dir-ltr text-right"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">الموقع الإلكتروني / الدومين</label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="tech.sa"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs dir-ltr text-right"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">نبذة عن نشاط الشركة</label>
                <textarea
                  rows={3}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="أعمالنا وخدماتنا..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !name || !slug}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs shadow-lg shadow-blue-600/30 disabled:opacity-50"
              >
                {isSubmitting ? 'جاري التسجيل...' : 'تسجيل الشركة'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
