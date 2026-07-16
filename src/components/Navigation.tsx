'use client';

import { useAuth } from '@/contexts/AuthContext';
import { 
  Home, Video, Music, MessageCircle, Lock, PlusSquare,
  User, Search, Users, Settings, Crown, Bot, Camera, Heart
} from '@/components/icons';

interface NavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Navigation({ currentPage, onNavigate }: NavigationProps) {
  const { user } = useAuth();

  const allPages = [
    { id: 'home', icon: Home, label: 'الرئيسية' },
    { id: 'search', icon: Search, label: 'البحث' },
    { id: 'stories', icon: Camera, label: 'الحالات' },
    { id: 'shorts', icon: Video, label: 'ريلز' },
    { id: 'notifications', icon: Heart, label: 'الإشعارات' },
    { id: 'ai', icon: Bot, label: 'المساعد الذكي' },
    { id: 'chat', icon: MessageCircle, label: 'الرسائل' },
    { id: 'friends', icon: Users, label: 'الأصدقاء' },
    { id: 'create', icon: PlusSquare, label: 'إنشاء' },
    { id: 'music', icon: Music, label: 'الموسيقى' },
    { id: 'protected-chat', icon: Lock, label: 'رسائل سرية' },
    { id: 'profile', icon: User, label: 'حسابي' },
    { id: 'settings', icon: Settings, label: 'الإعدادات' },
  ];

  if (user?.isAdmin) {
    allPages.push({ id: 'admin', icon: Crown, label: 'لوحة التحكم' });
  }

  // Mobile: top scrollable row (extra pages not in bottom bar)
  const mobileRow = [
    { id: 'stories', icon: Camera, label: 'حالات' },
    { id: 'shorts', icon: Video, label: 'ريلز' },
    { id: 'music', icon: Music, label: 'موسيقى' },
    { id: 'ai', icon: Bot, label: 'AI' },
    { id: 'chat', icon: MessageCircle, label: 'رسائل' },
    { id: 'friends', icon: Users, label: 'أصدقاء' },
    { id: 'protected-chat', icon: Lock, label: 'سري' },
    { id: 'settings', icon: Settings, label: 'إعدادات' },
  ];

  const mobileBottom = [
    { id: 'home', icon: Home },
    { id: 'search', icon: Search },
    { id: 'create', icon: PlusSquare },
    { id: 'notifications', icon: Heart },
    { id: 'profile', icon: User },
  ];

  return (
    <>
      {/* ===== Desktop Sidebar ===== */}
      <aside className="hidden lg:flex flex-col w-[220px] bg-black border-l border-[#262626] h-screen sticky top-0 py-4 px-3 flex-shrink-0">
        <div className="px-3 pt-2 pb-6">
          <h1 className="text-2xl font-semibold">Zivv</h1>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto">
          {allPages.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`nav-item w-full ${currentPage === item.id ? 'active' : ''}`}
            >
              <item.icon size={24} strokeWidth={currentPage === item.id ? 2.5 : 1.5} />
              <span className="text-[15px]">{item.label}</span>
            </button>
          ))}
        </nav>
        {user && (
          <div className="pt-3 border-t border-[#262626] mt-2">
            <button onClick={() => onNavigate('profile')} className="nav-item w-full">
              <div className="w-6 h-6 rounded-full overflow-hidden bg-[#262626]">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-bold">{user.username?.[0]?.toUpperCase()}</div>
                )}
              </div>
              <span className="text-[15px]">{user.username}</span>
            </button>
          </div>
        )}
      </aside>

      {/* ===== Tablet Sidebar ===== */}
      <aside className="hidden md:flex lg:hidden flex-col w-[72px] bg-black border-l border-[#262626] h-screen sticky top-0 py-4 items-center flex-shrink-0">
        <div className="pt-2 pb-6"><span className="text-2xl font-semibold">Z</span></div>
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {allPages.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-12 h-12 rounded-lg flex items-center justify-center hover:bg-[#1a1a1a] ${currentPage === item.id ? 'bg-[#1a1a1a]' : ''}`}
              title={item.label}
            >
              <item.icon size={24} strokeWidth={currentPage === item.id ? 2.5 : 1.5} />
            </button>
          ))}
        </nav>
      </aside>

      {/* ===== MOBILE: Top header + scrollable nav row ===== */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-black">
        {/* Header row */}
        <div className="flex items-center justify-between px-4 h-[44px] border-b border-[#262626]">
          <h1 className="text-lg font-semibold">Zivv</h1>
          <div className="flex items-center gap-3">
            <button onClick={() => onNavigate('notifications')}><Heart size={22} /></button>
            <button onClick={() => onNavigate('chat')}><MessageCircle size={22} /></button>
          </div>
        </div>
        {/* Scrollable page icons row */}
        <div className="flex overflow-x-auto scrollbar-hide px-1 h-[38px] items-center gap-0 border-b border-[#262626]">
          {mobileRow.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex items-center gap-1 px-3 py-1 rounded-full flex-shrink-0 text-xs whitespace-nowrap ${
                currentPage === item.id ? 'bg-[#262626] text-white font-semibold' : 'text-[#737373]'
              }`}
            >
              <item.icon size={14} strokeWidth={currentPage === item.id ? 2.5 : 1.5} />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* ===== MOBILE: Bottom navigation ===== */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-black border-t border-[#262626] flex justify-around py-2">
        {mobileBottom.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 ${currentPage === item.id ? 'text-white' : 'text-[#737373]'}`}
          >
            <item.icon size={24} strokeWidth={currentPage === item.id ? 2.5 : 1.5} />
          </button>
        ))}
      </nav>
    </>
  );
}
