import React from 'react';
import { User } from '../types.ts';
import { Menu, Globe, LogOut, ShieldCheck } from 'lucide-react';

interface TopNavProps {
  user: User;
  onLogout: () => void;
  onOpenMobileMenu: () => void;
  onSelectPage: (page: string) => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  user,
  onLogout,
  onOpenMobileMenu,
  onSelectPage,
}) => {
  return (
    <header className="sticky top-0 z-30 h-16 w-full border-b border-slate-800/80 bg-[#070a14]/90 backdrop-blur-md px-4 flex items-center justify-between">
      {/* Brand & Mobile Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          aria-label="القائمة الرئيسية"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div
          onClick={() => onSelectPage('contacts')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 via-purple-600 to-blue-600 p-[1.5px] shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-[#070a14] rounded-[10px] flex items-center justify-center">
              <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 text-lg tracking-tight">
                S
              </span>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-wider text-white">SNNS</span>
              <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-950/80 text-cyan-400 border border-cyan-800/50">
                PRO
              </span>
            </div>
            <span className="text-[11px] text-slate-400 hidden sm:block">تواصل آمن، سريع وبسيط</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {/* Real Online Status Pill */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-emerald-400 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>متصل</span>
        </div>

        {/* Language selector */}
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-xs">
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <select
            defaultValue="ar"
            aria-label="اختيار اللغة"
            className="bg-transparent border-0 text-slate-200 text-xs focus:outline-none cursor-pointer"
          >
            <option value="ar" className="bg-slate-900">العربية</option>
            <option value="en" className="bg-slate-900">English</option>
          </select>
        </div>

        {/* User Mini Profile */}
        <button
          onClick={() => onSelectPage('profile')}
          className="flex items-center gap-2.5 pl-1 pr-2.5 py-1 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition-colors text-right"
        >
          <div className="relative">
            {user.avatar ? (
              <img src={user.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                {user.name?.charAt(0) || 'U'}
              </div>
            )}
            {user.isVerified && (
              <span className="absolute -bottom-0.5 -left-0.5 w-3 h-3 bg-cyan-500 rounded-full flex items-center justify-center text-[8px] text-white">
                ✓
              </span>
            )}
          </div>
          <span className="text-xs font-semibold text-slate-200 hidden md:block max-w-[100px] truncate">
            {user.displayName || user.name}
          </span>
        </button>

        {/* Logout */}
        <button
          onClick={onLogout}
          className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-900/40 transition-colors"
          title="تسجيل الخروج"
          aria-label="تسجيل الخروج"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
