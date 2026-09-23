import React from 'react';
import { User } from '../types.ts';
import {
  Users,
  MessageSquare,
  Compass,
  Bell,
  Film,
  Radio,
  ShoppingBag,
  Building2,
  Users2,
  PhoneCall,
  ShieldAlert,
  UserCheck,
  Download,
  ChevronLeft,
} from 'lucide-react';

interface SidebarProps {
  user: User;
  currentPage: string;
  onSelectPage: (page: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  unreadChatsCount?: number;
  unreadNotificationsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  currentPage,
  onSelectPage,
  isOpenMobile,
  onCloseMobile,
  unreadChatsCount = 0,
  unreadNotificationsCount = 0,
}) => {
  const isAdmin = user.role === 'owner' || user.role === 'admin' || user.role === 'moderator';

  const navItems = [
    {
      id: 'contacts',
      label: 'جهات الاتصال',
      icon: Users,
      accent: 'cyan',
      badge: null,
      activeColor: 'text-cyan-400 bg-cyan-950/40 border-cyan-800/50 shadow-cyan-950/30',
      hoverColor: 'hover:text-cyan-300 hover:bg-cyan-950/20',
      iconColor: 'text-cyan-400',
    },
    {
      id: 'chats',
      label: 'الرسائل',
      icon: MessageSquare,
      accent: 'purple',
      badge: unreadChatsCount > 0 ? unreadChatsCount : null,
      activeColor: 'text-purple-400 bg-purple-950/40 border-purple-800/50 shadow-purple-950/30',
      hoverColor: 'hover:text-purple-300 hover:bg-purple-950/20',
      iconColor: 'text-purple-400',
    },
    {
      id: 'nearby',
      label: 'الأجهزة القريبة',
      icon: Compass,
      accent: 'sky',
      badge: null,
      activeColor: 'text-sky-400 bg-sky-950/40 border-sky-800/50 shadow-sky-950/30',
      hoverColor: 'hover:text-sky-300 hover:bg-sky-950/20',
      iconColor: 'text-sky-400',
    },
    {
      id: 'notifications',
      label: 'الإشعارات',
      icon: Bell,
      accent: 'orange',
      badge: unreadNotificationsCount > 0 ? unreadNotificationsCount : null,
      activeColor: 'text-orange-400 bg-orange-950/40 border-orange-800/50 shadow-orange-950/30',
      hoverColor: 'hover:text-orange-300 hover:bg-orange-950/20',
      iconColor: 'text-orange-400',
    },
    {
      id: 'videos',
      label: 'لحظات SNNS',
      icon: Film,
      accent: 'rose',
      badge: null,
      activeColor: 'text-rose-400 bg-rose-950/40 border-rose-800/50 shadow-rose-950/30',
      hoverColor: 'hover:text-rose-300 hover:bg-rose-950/20',
      iconColor: 'text-rose-400',
    },
    {
      id: 'live',
      label: 'SNNS LIVE Studio',
      icon: Radio,
      accent: 'crimson',
      badge: 'LIVE',
      activeColor: 'text-rose-400 bg-rose-950/50 border-rose-700/60 shadow-rose-950/40 glow-crimson',
      hoverColor: 'hover:text-rose-300 hover:bg-rose-950/30',
      iconColor: 'text-rose-500',
    },
    {
      id: 'market',
      label: 'السوق والإعلانات',
      icon: ShoppingBag,
      accent: 'amber',
      badge: null,
      activeColor: 'text-amber-400 bg-amber-950/40 border-amber-800/50 shadow-amber-950/30',
      hoverColor: 'hover:text-amber-300 hover:bg-amber-950/20',
      iconColor: 'text-amber-400',
    },
    {
      id: 'companies',
      label: 'الشركات',
      icon: Building2,
      accent: 'blue',
      badge: null,
      activeColor: 'text-blue-400 bg-blue-950/40 border-blue-800/50 shadow-blue-950/30',
      hoverColor: 'hover:text-blue-300 hover:bg-blue-950/20',
      iconColor: 'text-blue-400',
    },
    {
      id: 'groups',
      label: 'القروبات',
      icon: Users2,
      accent: 'violet',
      badge: null,
      activeColor: 'text-violet-400 bg-violet-950/40 border-violet-800/50 shadow-violet-950/30',
      hoverColor: 'hover:text-violet-300 hover:bg-violet-950/20',
      iconColor: 'text-violet-400',
    },
    {
      id: 'history',
      label: 'سجل المكالمات',
      icon: PhoneCall,
      accent: 'emerald',
      badge: null,
      activeColor: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/50 shadow-emerald-950/30',
      hoverColor: 'hover:text-emerald-300 hover:bg-emerald-950/20',
      iconColor: 'text-emerald-400',
    },
    {
      id: 'profile',
      label: 'ملفي الشخصي',
      icon: UserCheck,
      accent: 'teal',
      badge: null,
      activeColor: 'text-teal-400 bg-teal-950/40 border-teal-800/50 shadow-teal-950/30',
      hoverColor: 'hover:text-teal-300 hover:bg-teal-950/20',
      iconColor: 'text-teal-400',
    },
  ];

  if (isAdmin) {
    navItems.push({
      id: 'admin',
      label: 'لوحة الإدارة STS',
      icon: ShieldAlert,
      accent: 'indigo',
      badge: 'STS',
      activeColor: 'text-indigo-300 bg-indigo-950/50 border-indigo-700/60 shadow-indigo-950/40',
      hoverColor: 'hover:text-indigo-200 hover:bg-indigo-950/30',
      iconColor: 'text-indigo-400',
    });
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#090d1a] border-l border-slate-800/80 w-64 select-none">
      {/* User profile mini header */}
      <div className="p-4 border-b border-slate-800/70 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative flex-shrink-0">
            {user.avatar ? (
              <img src={user.avatar} alt="" className="w-11 h-11 rounded-full object-cover border border-slate-700" />
            ) : (
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-cyan-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                {user.name?.charAt(0) || 'U'}
              </div>
            )}
            <span className="absolute bottom-0 left-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#090d1a]"></span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-slate-100 text-sm truncate flex items-center gap-1">
              <span>{user.displayName || user.name}</span>
              {user.isVerified && <span className="text-cyan-400 text-xs">✓</span>}
            </h3>
            <p className="text-xs text-slate-400 truncate dir-ltr text-right">@{user.username}</p>
          </div>
        </div>

        {isOpenMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="إغلاق القائمة"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {navItems.map((item) => {
          const isActive = currentPage === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectPage(item.id);
                if (isOpenMobile) onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-sm font-medium transition-all duration-150 ${
                isActive
                  ? `${item.activeColor} border-opacity-60 shadow-sm font-bold`
                  : `text-slate-300 border-transparent ${item.hoverColor}`
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 transition-colors ${isActive ? item.iconColor : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                    item.badge === 'LIVE'
                      ? 'bg-rose-600 text-white live-pulse shadow-sm shadow-rose-600/50'
                      : item.badge === 'STS'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-cyan-500 text-slate-950'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Download PWA App */}
        <a
          href="/download.html"
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-transparent text-sm font-medium text-slate-400 hover:text-cyan-300 hover:bg-slate-800/40 transition-colors mt-2"
        >
          <div className="flex items-center gap-3">
            <Download className="w-5 h-5 text-slate-400" />
            <span>تثبيت SNNS على جهازك</span>
          </div>
          <span className="text-xs text-cyan-400">⇩</span>
        </a>
      </nav>

      {/* Bottom status badge */}
      <div className="p-3 border-t border-slate-800/70">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
          <div className="flex flex-col">
            <span className="font-semibold text-slate-200">المنصة متصلة</span>
            <span className="text-[10px] text-slate-400">اتصال مشفر وآمن</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop static sidebar */}
      <aside className="hidden lg:block h-[calc(100vh-4rem)] sticky top-16 z-20 flex-shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          ></div>
          <div className="relative z-10 w-72 max-w-[85vw] h-full shadow-2xl animate-in slide-in-from-right duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
