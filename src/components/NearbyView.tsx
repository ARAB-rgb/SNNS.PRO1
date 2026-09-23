import React, { useState, useEffect } from 'react';
import { api } from '../api.ts';
import { User } from '../types.ts';
import { Compass, MapPin, RefreshCw, MessageSquare, Phone } from 'lucide-react';

interface NearbyViewProps {
  currentUser: User;
  onOpenChat: (peerId: string) => void;
  onStartCall: (targetUser: User, type: 'audio' | 'video') => void;
}

export const NearbyView: React.FC<NearbyViewProps> = ({
  currentUser,
  onOpenChat,
  onStartCall,
}) => {
  const [sharing, setSharing] = useState<boolean>(!!currentUser.shareLocation);
  const [radiusMeters, setRadiusMeters] = useState<number>(20000); // 20km
  const [nearbyUsers, setNearbyUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [locStatus, setLocStatus] = useState<string>(
    currentUser.shareLocation ? 'الموقع مفعل ونشط' : 'مشاركة الموقع غير مفعلة'
  );

  const requestLocation = () => {
    if (!navigator.geolocation) {
      setLocStatus('المتصفح لا يدعم تحديد الموقع الجغرافي');
      return;
    }
    setLoading(true);
    setLocStatus('جاري تحديد الإحداثيات...');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await api.updateLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            shareLocation: true,
          });
          setSharing(true);
          setLocStatus('الموقع مفعل ومحدث بنجاح');
          loadNearby(radiusMeters);
        } catch (e) {
          setLocStatus('فشل حفظ الموقع في الخادم');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setLoading(false);
        setLocStatus('تم رفض إذن الوصول للموقع: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const stopLocation = async () => {
    try {
      await api.updateLocation({ shareLocation: false });
      setSharing(false);
      setLocStatus('تم إيقاف مشاركة الموقع');
      setNearbyUsers([]);
    } catch (e) {
      console.error(e);
    }
  };

  const loadNearby = async (radius: number) => {
    setLoading(true);
    try {
      const res = await api.getNearby(radius);
      setNearbyUsers(res.nearby || []);
    } catch (e) {
      console.error('Failed to load nearby users:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sharing) {
      loadNearby(radiusMeters);
    }
  }, [radiusMeters, sharing]);

  const radiusOptions = [
    { label: '1 كم', value: 1000 },
    { label: '5 كم', value: 5000 },
    { label: '20 كم', value: 20000 },
    { label: '50 كم', value: 50000 },
    { label: '100 كم', value: 100000 },
    { label: '250 كم', value: 250000 },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      {/* Radar Hero Card */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#090d1a] via-[#0b1329] to-[#070a14] border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-4 max-w-lg z-10">
          <div>
            <span className="text-xs font-bold text-sky-400 tracking-wider">الرادار الحقيقي</span>
            <h2 className="text-2xl sm:text-3xl font-black text-white mt-1">الأشخاص القريبون منك</h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
              يظهر فقط المستخدمون الذين قاموا بتفعيل مشاركة الموقع فعلياً. حساب المسافات يتم بدقة عبر معادلة Haversine دون أي مسافات تجريبية أو وهمية.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            {!sharing ? (
              <button
                onClick={requestLocation}
                disabled={loading}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-sky-500/30 transition-all flex items-center gap-2 cursor-pointer"
              >
                <MapPin className="w-4 h-4" />
                <span>{loading ? 'جاري التحديد...' : 'تفعيل مشاركة موقعي'}</span>
              </button>
            ) : (
              <button
                onClick={stopLocation}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-rose-950/40 border border-slate-700 hover:border-rose-800/60 text-slate-300 hover:text-rose-400 font-semibold text-xs transition-colors cursor-pointer"
              >
                إيقاف مشاركة الموقع
              </button>
            )}

            <button
              onClick={() => loadNearby(radiusMeters)}
              disabled={!sharing || loading}
              className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>تحديث</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
            <span className={`w-2 h-2 rounded-full ${sharing ? 'bg-sky-400 animate-pulse' : 'bg-slate-600'}`}></span>
            <span>{locStatus}</span>
          </div>
        </div>

        {/* Animated Radar Visualizer */}
        <div className="relative w-48 h-48 sm:w-60 sm:h-60 flex-shrink-0 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-sky-500/20"></div>
          <div className="absolute inset-6 rounded-full border border-sky-500/30"></div>
          <div className="absolute inset-12 rounded-full border border-sky-500/40"></div>
          <div className="absolute inset-20 rounded-full border border-sky-500/60"></div>
          {sharing && <div className="radar-wave w-44 h-44"></div>}

          {/* Center Point */}
          <div className="relative z-10 w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 shadow-lg shadow-sky-500/50 flex items-center justify-center text-white">
            <Compass className={`w-5 h-5 ${sharing ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }} />
          </div>
        </div>
      </div>

      {/* Radius Filters Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 overflow-x-auto p-1 bg-slate-900/80 border border-slate-800 rounded-2xl">
          {radiusOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRadiusMeters(opt.value)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                radiusMeters === opt.value
                  ? 'bg-sky-950 text-sky-400 border border-sky-800/60 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400">
          النطاق المحدد: <strong>{(radiusMeters / 1000).toFixed(0)} كم</strong>
        </span>
      </div>

      {/* Nearby Users List */}
      {!sharing ? (
        <div className="py-16 text-center rounded-2xl border border-slate-800 bg-slate-900/30 p-8 space-y-2">
          <MapPin className="w-10 h-10 mx-auto text-sky-500/60" />
          <h3 className="text-sm font-bold text-slate-300">مشاركة الموقع غير مفعلة</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            قم بتفعيل مشاركة موقعك لرؤية المستخدمين القريبين منك في نطاق حتى 250 كم.
          </p>
        </div>
      ) : nearbyUsers.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-slate-800 bg-slate-900/30 p-8 space-y-2">
          <Compass className="w-10 h-10 mx-auto text-slate-600" />
          <h3 className="text-sm font-bold text-slate-300">لا يوجد مستخدمون قريبون الآن</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            لم يقم أي مستخدم آخر في نطاق {(radiusMeters / 1000).toFixed(0)} كم بتفعيل مشاركة الموقع حالياً.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {nearbyUsers.map((u) => (
            <div
              key={u.id}
              className="bg-[#0b1020]/90 border border-slate-800 hover:border-sky-800/60 rounded-2xl p-4 shadow-lg flex flex-col justify-between"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="relative flex-shrink-0">
                  {u.avatar ? (
                    <img src={u.avatar} alt="" className="w-12 h-12 rounded-full object-cover border border-slate-700" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-sky-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                      {u.name.charAt(0)}
                    </div>
                  )}
                  {u.isOnline && (
                    <span className="absolute bottom-0 left-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#0b1020]"></span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-white text-sm truncate">{u.displayName || u.name}</h4>
                  <p className="text-xs text-slate-400 dir-ltr text-right truncate">@{u.username}</p>
                  <div className="flex items-center gap-1.5 text-[11px] text-sky-400 font-semibold mt-0.5">
                    <MapPin className="w-3 h-3" />
                    <span>يبعد {u.distanceKm} كم</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-2">
                <button
                  onClick={() => onOpenChat(u.id)}
                  className="py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-purple-400" />
                  <span>رسالة</span>
                </button>
                <button
                  onClick={() => onStartCall(u, 'audio')}
                  className="py-2 rounded-xl bg-slate-900 hover:bg-emerald-950/60 text-slate-300 hover:text-emerald-400 border border-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>اتصال</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
