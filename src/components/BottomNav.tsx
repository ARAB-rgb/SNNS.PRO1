import React from 'react';
import { Users, MessageSquare, Radio, Compass, UserCheck } from 'lucide-react';

interface BottomNavProps {
  currentPage: string;
  onSelectPage: (page: string) => void;
  unreadChatsCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentPage,
  onSelectPage,
  unreadChatsCount = 0,
}) => {
  const items = [
    { id: 'contacts', label: 'الأشخاص', icon: Users, accent: 'text-cyan-400' },
    { id: 'chats', label: 'الرسائل', icon: MessageSquare, accent: 'text-purple-400', badge: unreadChatsCount },
    { id: 'live', label: 'LIVE', icon: Radio, accent: 'text-rose-500', isLive: true },
    { id: 'nearby', label: 'الرادار', icon: Compass, accent: 'text-sky-400' },
    { id: 'profile', label: 'ملفي', icon: UserCheck, accent: 'text-teal-400' },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-[#070a14]/95 backdrop-blur-lg border-t border-slate-800/80 px-2 flex items-center justify-around">
      {items.map((item) => {
        const isActive = currentPage === item.id;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => onSelectPage(item.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1 transition-transform ${
              isActive ? 'scale-105' : 'opacity-70 hover:opacity-100'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${isActive ? item.accent : 'text-slate-400'}`} />
              {item.badge && item.badge > 0 ? (
                <span className="absolute -top-1.5 -right-2 px-1.5 py-0.2 rounded-full bg-cyan-500 text-[10px] font-bold text-slate-950">
                  {item.badge}
                </span>
              ) : null}
              {item.isLive && (
                <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              )}
            </div>
            <span
              className={`text-[11px] mt-1 font-semibold ${
                isActive ? item.accent : 'text-slate-400'
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
