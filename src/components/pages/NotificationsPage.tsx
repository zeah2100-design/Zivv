'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, MessageCircle, UserPlus, AtSign } from 'lucide-react';

interface Notification {
  id: number;
  type: 'like' | 'comment' | 'follow' | 'mention';
  userId: number;
  username: string;
  avatarUrl: string | null;
  content?: string;
  postImage?: string;
  time: string;
  isRead: boolean;
}

interface NotificationsPageProps {
  onNavigate: (page: string, data?: Record<string, unknown>) => void;
}

export default function NotificationsPage({ onNavigate }: NotificationsPageProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'requests'>('all');
  
  // Demo notifications
  const [notifications] = useState<Notification[]>([
    {
      id: 1,
      type: 'like',
      userId: 2,
      username: 'ahmed',
      avatarUrl: 'https://i.pravatar.cc/150?u=ahmed',
      postImage: 'https://picsum.photos/100/100?random=1',
      time: 'منذ 5 دقائق',
      isRead: false,
    },
    {
      id: 2,
      type: 'follow',
      userId: 3,
      username: 'sara',
      avatarUrl: 'https://i.pravatar.cc/150?u=sara',
      time: 'منذ 15 دقيقة',
      isRead: false,
    },
    {
      id: 3,
      type: 'comment',
      userId: 4,
      username: 'omar',
      avatarUrl: 'https://i.pravatar.cc/150?u=omar',
      content: 'رائع جداً! 🔥',
      postImage: 'https://picsum.photos/100/100?random=2',
      time: 'منذ ساعة',
      isRead: true,
    },
    {
      id: 4,
      type: 'like',
      userId: 2,
      username: 'ahmed',
      avatarUrl: 'https://i.pravatar.cc/150?u=ahmed',
      postImage: 'https://picsum.photos/100/100?random=3',
      time: 'منذ ساعتين',
      isRead: true,
    },
    {
      id: 5,
      type: 'mention',
      userId: 3,
      username: 'sara',
      avatarUrl: 'https://i.pravatar.cc/150?u=sara',
      content: 'أشار إليك في تعليق',
      time: 'منذ 3 ساعات',
      isRead: true,
    },
    {
      id: 6,
      type: 'follow',
      userId: 5,
      username: 'khalid',
      avatarUrl: 'https://i.pravatar.cc/150?u=khalid',
      time: 'أمس',
      isRead: true,
    },
  ]);

  const [followRequests] = useState([
    {
      id: 1,
      userId: 6,
      username: 'noor',
      displayName: 'نور محمد',
      avatarUrl: 'https://i.pravatar.cc/150?u=noor',
      mutualFriends: 3,
    },
    {
      id: 2,
      userId: 7,
      username: 'layla',
      displayName: 'ليلى أحمد',
      avatarUrl: 'https://i.pravatar.cc/150?u=layla',
      mutualFriends: 5,
    },
  ]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart size={16} className="text-[#ed4956]" fill="#ed4956" />;
      case 'comment': return <MessageCircle size={16} className="text-[#0095f6]" />;
      case 'follow': return <UserPlus size={16} className="text-[#00a67e]" />;
      case 'mention': return <AtSign size={16} className="text-[#a855f7]" />;
      default: return null;
    }
  };

  const getNotificationText = (notification: Notification) => {
    switch (notification.type) {
      case 'like': return 'أعجب بمنشورك';
      case 'comment': return `علّق: ${notification.content}`;
      case 'follow': return 'بدأ بمتابعتك';
      case 'mention': return notification.content;
      default: return '';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-[#a0a0a0]">سجل الدخول لعرض الإشعارات</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-black pt-[82px] md:pt-0 pb-[60px] md:pb-0 overflow-y-auto">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black border-b border-[#262626]">
        <h1 className="text-lg font-semibold text-center py-3">الإشعارات</h1>
        
        {/* Tabs */}
        <div className="flex">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-3 text-sm font-medium border-b ${
              activeTab === 'all' ? 'border-white' : 'border-transparent text-[#a0a0a0]'
            }`}
          >
            الكل
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-3 text-sm font-medium border-b relative ${
              activeTab === 'requests' ? 'border-white' : 'border-transparent text-[#a0a0a0]'
            }`}
          >
            طلبات المتابعة
            {followRequests.length > 0 && (
              <span className="absolute top-2 mr-1 bg-[#ed4956] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                {followRequests.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {activeTab === 'all' ? (
        <div>
          {/* Today */}
          <div className="px-4 py-2">
            <h2 className="text-sm font-semibold">اليوم</h2>
          </div>
          
          {notifications.filter(n => !n.isRead).map(notification => (
            <button
              key={notification.id}
              onClick={() => onNavigate('profile', { viewUserId: notification.userId })}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#0a0a0a] transition-colors bg-[#0a0a0a]/50"
            >
              <div className="relative">
                <div className="w-11 h-11 rounded-full overflow-hidden bg-[#262626]">
                  {notification.avatarUrl ? (
                    <img src={notification.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-semibold">
                      {notification.username[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-black flex items-center justify-center">
                  {getNotificationIcon(notification.type)}
                </div>
              </div>
              
              <div className="flex-1 text-right">
                <p className="text-sm">
                  <span className="font-semibold">{notification.username}</span>
                  {' '}{getNotificationText(notification)}
                  <span className="text-[#a0a0a0]"> {notification.time}</span>
                </p>
              </div>
              
              {notification.postImage && (
                <div className="w-11 h-11 bg-[#262626]">
                  <img src={notification.postImage} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              
              {notification.type === 'follow' && (
                <button className="bg-[#0095f6] text-white text-sm font-semibold px-4 py-1.5 rounded-lg">
                  متابعة
                </button>
              )}
            </button>
          ))}

          {/* Earlier */}
          <div className="px-4 py-2 mt-2">
            <h2 className="text-sm font-semibold">في وقت سابق</h2>
          </div>
          
          {notifications.filter(n => n.isRead).map(notification => (
            <button
              key={notification.id}
              onClick={() => onNavigate('profile', { viewUserId: notification.userId })}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#0a0a0a] transition-colors"
            >
              <div className="relative">
                <div className="w-11 h-11 rounded-full overflow-hidden bg-[#262626]">
                  {notification.avatarUrl ? (
                    <img src={notification.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-semibold">
                      {notification.username[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-black flex items-center justify-center">
                  {getNotificationIcon(notification.type)}
                </div>
              </div>
              
              <div className="flex-1 text-right">
                <p className="text-sm">
                  <span className="font-semibold">{notification.username}</span>
                  {' '}{getNotificationText(notification)}
                  <span className="text-[#a0a0a0]"> {notification.time}</span>
                </p>
              </div>
              
              {notification.postImage && (
                <div className="w-11 h-11 bg-[#262626]">
                  <img src={notification.postImage} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              
              {notification.type === 'follow' && (
                <button className="bg-[#262626] text-white text-sm font-semibold px-4 py-1.5 rounded-lg">
                  متابَع
                </button>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div>
          {followRequests.length > 0 ? (
            followRequests.map(request => (
              <div key={request.id} className="flex items-center gap-3 px-4 py-3">
                <button
                  onClick={() => onNavigate('profile', { viewUserId: request.userId })}
                  className="w-11 h-11 rounded-full overflow-hidden bg-[#262626] flex-shrink-0"
                >
                  {request.avatarUrl ? (
                    <img src={request.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center font-semibold">
                      {request.username[0].toUpperCase()}
                    </div>
                  )}
                </button>
                
                <div className="flex-1">
                  <p className="text-sm font-semibold">{request.username}</p>
                  <p className="text-xs text-[#a0a0a0]">{request.displayName}</p>
                  {request.mutualFriends > 0 && (
                    <p className="text-xs text-[#a0a0a0]">{request.mutualFriends} أصدقاء مشتركين</p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button className="bg-[#0095f6] text-white text-sm font-semibold px-4 py-1.5 rounded-lg">
                    قبول
                  </button>
                  <button className="bg-[#262626] text-white text-sm font-semibold px-4 py-1.5 rounded-lg">
                    حذف
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full border-2 border-white mx-auto mb-4 flex items-center justify-center">
                <UserPlus size={32} />
              </div>
              <h3 className="font-semibold mb-1">طلبات المتابعة</h3>
              <p className="text-sm text-[#a0a0a0]">لا توجد طلبات متابعة حالياً</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
