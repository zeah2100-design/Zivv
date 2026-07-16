'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Search, UserPlus, UserMinus, Check, X, Users, MessageCircle } from 'lucide-react';

interface Friend {
  id: number;
  friendId: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  isOnline?: boolean;
}

interface FriendRequest {
  id: number;
  senderId: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  mutualFriends?: number;
}

interface SuggestedUser {
  id: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  mutualFriends: number;
}

interface FriendsPageProps {
  onNavigate: (page: string, data?: Record<string, unknown>) => void;
}

export default function FriendsPage({ onNavigate }: FriendsPageProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'suggestions'>('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Demo suggested users
  const [suggestions] = useState<SuggestedUser[]>([
    { id: 5, username: 'khalid', displayName: 'خالد سعد', avatarUrl: 'https://i.pravatar.cc/150?u=khalid', mutualFriends: 8 },
    { id: 6, username: 'noor', displayName: 'نور محمد', avatarUrl: 'https://i.pravatar.cc/150?u=noor', mutualFriends: 5 },
    { id: 7, username: 'layla', displayName: 'ليلى أحمد', avatarUrl: 'https://i.pravatar.cc/150?u=layla', mutualFriends: 3 },
    { id: 8, username: 'youssef', displayName: 'يوسف علي', avatarUrl: 'https://i.pravatar.cc/150?u=youssef', mutualFriends: 12 },
    { id: 9, username: 'hana', displayName: 'هنا محمود', avatarUrl: 'https://i.pravatar.cc/150?u=hana', mutualFriends: 7 },
  ]);

  useEffect(() => {
    if (user) {
      loadFriends();
      loadRequests();
    }
  }, [user]);

  const loadFriends = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/friends?userId=${user.id}&status=accepted`);
      const data = await res.json();
      setFriends(data.friends || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRequests = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/friends?userId=${user.id}&status=pending`);
      const data = await res.json();
      setRequests(data.requests || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleRequest = async (requestId: number, action: 'accept' | 'reject') => {
    try {
      await fetch(`/api/friends/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      setRequests(prev => prev.filter(r => r.id !== requestId));
      if (action === 'accept') loadFriends();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const filteredFriends = friends.filter(f =>
    f.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <p className="text-[#a0a0a0]">سجل الدخول لعرض الأصدقاء</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-black pt-[82px] md:pt-0 pb-[60px] md:pb-0 overflow-y-auto">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black border-b border-[#262626]">
        <h1 className="text-lg font-semibold text-center py-3">الأصدقاء</h1>
        
        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a0a0a0]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث عن صديق..."
              className="w-full bg-[#262626] rounded-lg py-2 pr-10 pl-4 text-sm placeholder:text-[#a0a0a0] outline-none"
            />
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex">
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-3 text-sm font-medium border-b flex items-center justify-center gap-2 ${
              activeTab === 'friends' ? 'border-white' : 'border-transparent text-[#a0a0a0]'
            }`}
          >
            <Users size={18} />
            أصدقائي
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-3 text-sm font-medium border-b flex items-center justify-center gap-2 relative ${
              activeTab === 'requests' ? 'border-white' : 'border-transparent text-[#a0a0a0]'
            }`}
          >
            <UserPlus size={18} />
            الطلبات
            {requests.length > 0 && (
              <span className="bg-[#ed4956] text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                {requests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('suggestions')}
            className={`flex-1 py-3 text-sm font-medium border-b ${
              activeTab === 'suggestions' ? 'border-white' : 'border-transparent text-[#a0a0a0]'
            }`}
          >
            اقتراحات
          </button>
        </div>
      </header>

      {/* Content */}
      {activeTab === 'friends' && (
        <div>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-[#a0a0a0] border-t-white rounded-full animate-spin" />
            </div>
          ) : filteredFriends.length > 0 ? (
            <div>
              {/* Online Friends */}
              <div className="px-4 py-3">
                <h2 className="text-sm text-[#a0a0a0]">متصل الآن</h2>
              </div>
              {filteredFriends.slice(0, 2).map(friend => (
                <div key={friend.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#0a0a0a]">
                  <button
                    onClick={() => onNavigate('profile', { viewUserId: friend.friendId })}
                    className="relative"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-[#262626]">
                      {friend.avatarUrl ? (
                        <img src={friend.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-semibold">
                          {friend.username[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-[#00a67e] rounded-full border-2 border-black" />
                  </button>
                  
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{friend.displayName || friend.username}</p>
                    <p className="text-xs text-[#a0a0a0]">@{friend.username}</p>
                  </div>
                  
                  <button
                    onClick={() => onNavigate('chat')}
                    className="w-9 h-9 rounded-full bg-[#262626] flex items-center justify-center"
                  >
                    <MessageCircle size={18} />
                  </button>
                </div>
              ))}

              {/* All Friends */}
              <div className="px-4 py-3 mt-2">
                <h2 className="text-sm text-[#a0a0a0]">جميع الأصدقاء ({filteredFriends.length})</h2>
              </div>
              {filteredFriends.map(friend => (
                <div key={friend.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#0a0a0a]">
                  <button
                    onClick={() => onNavigate('profile', { viewUserId: friend.friendId })}
                    className="w-12 h-12 rounded-full overflow-hidden bg-[#262626]"
                  >
                    {friend.avatarUrl ? (
                      <img src={friend.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center font-semibold">
                        {friend.username[0].toUpperCase()}
                      </div>
                    )}
                  </button>
                  
                  <div className="flex-1">
                    <p className="font-semibold text-sm">{friend.displayName || friend.username}</p>
                    <p className="text-xs text-[#a0a0a0]">@{friend.username}</p>
                  </div>
                  
                  <button
                    onClick={() => onNavigate('chat')}
                    className="w-9 h-9 rounded-full bg-[#262626] flex items-center justify-center"
                  >
                    <MessageCircle size={18} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full border-2 border-white mx-auto mb-4 flex items-center justify-center">
                <Users size={32} />
              </div>
              <h3 className="font-semibold mb-1">لا يوجد أصدقاء</h3>
              <p className="text-sm text-[#a0a0a0] mb-4">ابحث عن أصدقاء وأضفهم</p>
              <button
                onClick={() => setActiveTab('suggestions')}
                className="text-[#0095f6] text-sm font-semibold"
              >
                تصفح الاقتراحات
              </button>
            </div>
          )}
        </div>
      )}

      {activeTab === 'requests' && (
        <div>
          {requests.length > 0 ? (
            requests.map(request => (
              <div key={request.id} className="flex items-center gap-3 px-4 py-3">
                <button
                  onClick={() => onNavigate('profile', { viewUserId: request.senderId })}
                  className="w-12 h-12 rounded-full overflow-hidden bg-[#262626] flex-shrink-0"
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
                  <p className="font-semibold text-sm">{request.displayName || request.username}</p>
                  <p className="text-xs text-[#a0a0a0]">@{request.username}</p>
                  {request.mutualFriends && request.mutualFriends > 0 && (
                    <p className="text-xs text-[#a0a0a0]">{request.mutualFriends} أصدقاء مشتركين</p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleRequest(request.id, 'accept')}
                    className="w-9 h-9 rounded-full bg-[#0095f6] flex items-center justify-center"
                  >
                    <Check size={18} />
                  </button>
                  <button
                    onClick={() => handleRequest(request.id, 'reject')}
                    className="w-9 h-9 rounded-full bg-[#262626] flex items-center justify-center"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16">
              <div className="w-16 h-16 rounded-full border-2 border-white mx-auto mb-4 flex items-center justify-center">
                <UserPlus size={32} />
              </div>
              <h3 className="font-semibold mb-1">لا توجد طلبات</h3>
              <p className="text-sm text-[#a0a0a0]">ستظهر طلبات الصداقة هنا</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'suggestions' && (
        <div>
          <div className="px-4 py-3">
            <h2 className="text-sm text-[#a0a0a0]">أشخاص قد تعرفهم</h2>
          </div>
          
          {suggestions.map(user => (
            <div key={user.id} className="flex items-center gap-3 px-4 py-3 hover:bg-[#0a0a0a]">
              <button
                onClick={() => onNavigate('profile', { viewUserId: user.id })}
                className="w-12 h-12 rounded-full overflow-hidden bg-[#262626] flex-shrink-0"
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-semibold">
                    {user.username[0].toUpperCase()}
                  </div>
                )}
              </button>
              
              <div className="flex-1">
                <p className="font-semibold text-sm">{user.displayName || user.username}</p>
                <p className="text-xs text-[#a0a0a0]">@{user.username}</p>
                <p className="text-xs text-[#a0a0a0]">{user.mutualFriends} أصدقاء مشتركين</p>
              </div>
              
              <button className="bg-[#0095f6] text-white text-sm font-semibold px-4 py-1.5 rounded-lg flex items-center gap-1">
                <UserPlus size={16} />
                إضافة
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
