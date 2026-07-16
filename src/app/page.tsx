'use client';

import { useState } from 'react';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import Navigation from '@/components/Navigation';
import AuthModal from '@/components/AuthModal';
import HomePage from '@/components/pages/HomePage';
import StoriesPage from '@/components/pages/StoriesPage';
import ShortsPage from '@/components/pages/ShortsPage';
import MusicPage from '@/components/pages/MusicPage';
import ChatPage from '@/components/pages/ChatPage';
import ProtectedChatPage from '@/components/pages/ProtectedChatPage';
import CreatePostPage from '@/components/pages/CreatePostPage';
import ProfilePage from '@/components/pages/ProfilePage';
import SearchPage from '@/components/pages/SearchPage';
import FriendsPage from '@/components/pages/FriendsPage';
import NotificationsPage from '@/components/pages/NotificationsPage';
import SettingsPage from '@/components/pages/SettingsPage';
import AdminPage from '@/components/pages/AdminPage';
import AIPage from '@/components/pages/AIPage';

function AppContent() {
  const { user, isLoading } = useAuth();
  const [currentPage, setCurrentPage] = useState('home');
  const [pageData, setPageData] = useState<Record<string, unknown>>({});
  const [showAuth, setShowAuth] = useState(false);

  const handleNavigate = (page: string, data?: Record<string, unknown>) => {
    setCurrentPage(page);
    setPageData(data || {});
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-2 border-[#a0a0a0] border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <HomePage onNavigate={handleNavigate} />;
      case 'stories': return <StoriesPage />;
      case 'shorts': return <ShortsPage />;
      case 'music': return <MusicPage />;
      case 'chat': return <ChatPage />;
      case 'protected-chat': return <ProtectedChatPage />;
      case 'create': return <CreatePostPage onNavigate={handleNavigate} />;
      case 'profile': return <ProfilePage viewUserId={pageData.viewUserId as number | undefined} onNavigate={handleNavigate} />;
      case 'search': return <SearchPage onNavigate={handleNavigate} />;
      case 'friends': return <FriendsPage onNavigate={handleNavigate} />;
      case 'notifications': return <NotificationsPage onNavigate={handleNavigate} />;
      case 'settings': return <SettingsPage onNavigate={handleNavigate} />;
      case 'admin': return <AdminPage />;
      case 'ai': return <AIPage />;
      default: return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-black">
      <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
      
      <main className="flex-1 min-w-0 h-screen overflow-y-auto md:overflow-y-auto">
        {!user && (
          <button 
            onClick={() => setShowAuth(true)}
            className="fixed top-3 left-3 z-[60] text-sm text-[#0095f6] font-semibold bg-black/80 px-3 py-1.5 rounded-lg border border-[#262626]"
          >
            تسجيل الدخول
          </button>
        )}
        {renderPage()}
      </main>

      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </div>
  );
}

export default function Page() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
