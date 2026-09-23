import React, { useState, useEffect } from 'react';
import { api } from '../api.ts';
import { MarketAd, User } from '../types.ts';
import { ShoppingBag, Search, Plus, Phone, MessageSquare, Trash2, X, MapPin, Tag } from 'lucide-react';

interface MarketViewProps {
  currentUser: User;
  onOpenChat: (peerId: string) => void;
  onStartCall: (targetUser: User, type: 'audio' | 'video') => void;
}

export const MarketView: React.FC<MarketViewProps> = ({
  currentUser,
  onOpenChat,
  onStartCall,
}) => {
  const [ads, setAds] = useState<MarketAd[]>([]);
  const [category, setCategory] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);

  // New Ad Form
  const [title, setTitle] = useState('');
  const [adCategory, setAdCategory] = useState('cars');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadAds = async () => {
    try {
      const res = await api.getAds({
        category: category !== 'all' ? category : undefined,
        search: search.trim() || undefined,
      });
      setAds(res.ads || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAds();
  }, [category, search]);

  const handleDelete = async (adId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return;
    try {
      await api.deleteAd(adId);
      setAds((prev) => prev.filter((a) => a.id !== adId));
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let mediaUrl: string | undefined;
      if (mediaFile) {
        mediaUrl = await api.uploadFile(mediaFile);
      }
      const res = await api.createAd({
        title,
        category: adCategory,
        price,
        location,
        description,
        mediaUrl,
        mediaType: 'image',
      });
      setAds((prev) => [res.ad, ...prev]);
      setShowNewModal(false);
      setTitle('');
      setPrice('');
      setLocation('');
      setDescription('');
      setMediaFile(null);
    } catch (e: any) {
      alert('فشل إضافة الإعلان: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = [
    { id: 'all', label: 'الكل' },
    { id: 'cars', label: 'سيارات' },
    { id: 'realestate', label: 'عقار' },
    { id: 'electronics', label: 'إلكترونيات' },
    { id: 'services', label: 'خدمات' },
    { id: 'jobs', label: 'وظائف' },
    { id: 'other', label: 'أخرى' },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-amber-400">سوق SNNS التجاري</span>
          <h2 className="text-2xl font-black text-white mt-0.5">الإعلانات والمقتنيات</h2>
          <p className="text-xs text-slate-400 mt-1">تواصل مباشرة مع أصحاب السلع والمعلنين دون وسيط.</p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-amber-600/30 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>أضف إعلاناً جديداً</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-900/80 border border-slate-800 rounded-2xl">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setCategory(c.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                category === c.id
                  ? 'bg-amber-950 text-amber-400 border border-amber-800/60 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="relative max-w-xs w-full">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث في الإعلانات..."
            className="w-full pl-4 pr-9 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
          />
          <Search className="w-4 h-4 text-slate-500 absolute right-3 top-2.5" />
        </div>
      </div>

      {/* Ads Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 text-sm">جاري تحميل الإعلانات...</div>
      ) : ads.length === 0 ? (
        <div className="py-24 text-center rounded-3xl border border-slate-800 bg-[#090d1a]/50 p-8 space-y-2">
          <ShoppingBag className="w-12 h-12 mx-auto text-slate-600" />
          <h3 className="text-base font-bold text-slate-300">لا توجد إعلانات مطابقة</h3>
          <p className="text-xs text-slate-500">كن أول من ينشر إعلاناً في هذا القسم.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {ads.map((ad) => {
            const isOwner = ad.authorId === currentUser.id;
            return (
              <div
                key={ad.id}
                className="bg-[#0b1020] border border-slate-800 hover:border-amber-800/60 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between"
              >
                <div>
                  {/* Photo */}
                  <div className="aspect-video bg-slate-900 relative overflow-hidden flex items-center justify-center">
                    {ad.mediaUrl ? (
                      <img src={ad.mediaUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ShoppingBag className="w-10 h-10 text-slate-700" />
                    )}
                    <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-amber-400 font-black text-xs">
                      {ad.price}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="p-4 space-y-2">
                    <h4 className="font-bold text-white text-sm line-clamp-1">{ad.title}</h4>
                    {ad.description && <p className="text-xs text-slate-400 line-clamp-2">{ad.description}</p>}
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                      <MapPin className="w-3 h-3 text-amber-500" />
                      <span>{ad.location}</span>
                      <span>•</span>
                      <span>{ad.authorName}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpenChat(ad.authorId)}
                      className="px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-800/50 text-purple-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>محادثة</span>
                    </button>

                    <button
                      onClick={() => onStartCall({ id: ad.authorId, name: ad.authorName, username: '', email: '' }, 'audio')}
                      className="px-3 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/50 text-emerald-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>اتصال</span>
                    </button>
                  </div>

                  {isOwner && (
                    <button
                      onClick={() => handleDelete(ad.id)}
                      className="p-1.5 text-rose-400 hover:text-rose-300"
                      title="حذف الإعلان"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* New Ad Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1020] border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm">إضافة إعلان جديد</h3>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">عنوان الإعلان *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="مثال: آيفون 15 برو ماكس جديد"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-300 mb-1">القسم</label>
                  <select
                    value={adCategory}
                    onChange={(e) => setAdCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs"
                  >
                    <option value="cars">سيارات</option>
                    <option value="realestate">عقار</option>
                    <option value="electronics">إلكترونيات</option>
                    <option value="services">خدمات</option>
                    <option value="jobs">وظائف</option>
                    <option value="other">أخرى</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-300 mb-1">السعر *</label>
                  <input
                    type="text"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="مثال: 3,500 ر.س"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">المدينة / الموقع</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="مثال: الرياض، حي الملقا"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">صورة السلعة</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-400 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:bg-amber-950 file:text-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">الوصف التفصيلي</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="اكتب مواصفات السلعة وحالتها..."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !title || !price}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold text-xs shadow-lg shadow-amber-600/30 disabled:opacity-50"
              >
                {isSubmitting ? 'جاري النشر...' : 'نشر الإعلان'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
