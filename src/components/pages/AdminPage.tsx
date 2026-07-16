'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Crown, Ban, Check, X, Trash2, Users, FileVideo, Shield, Bell } from '@/components/icons';

interface GoldRequest {
  id: number;
  userId: number;
  status: string;
  message: string | null;
  createdAt: Date | string;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface UserData {
  id: number;
  username: string;
  displayName: string | null;
  email: string;
  isBanned: boolean | null;
  isGoldMember: boolean | null;
  avatarUrl: string | null;
}

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'gold' | 'users' | 'posts' | 'reports'>('gold');
  const [goldRequests, setGoldRequests] = useState<GoldRequest[]>([]);
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (activeTab === 'gold') {
      loadGoldRequests();
    } else if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab]);

  const loadGoldRequests = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/gold-requests?status=pending');
      const data = await res.json();
      setGoldRequests(data.requests || []);
    } catch (error) {
      console.error('Error loading gold requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      // In production, you'd have a proper admin API endpoint
      setUsers([]);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoldRequest = async (requestId: number, action: 'approve' | 'reject') => {
    if (!user) return;
    
    try {
      const res = await fetch(`/api/gold-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, adminId: user.id }),
      });
      
      if (res.ok) {
        setGoldRequests(prev => prev.filter(r => r.id !== requestId));
      }
    } catch (error) {
      console.error('Error handling gold request:', error);
    }
  };

  const handleBanUser = async (userId: number, action: 'ban' | 'unban') => {
    if (!user) return;
    
    try {
      const res = await fetch(`/api/admin/users/${userId}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, adminId: user.id }),
      });
      
      if (res.ok) {
        setUsers(prev => prev.map(u => 
          u.id === userId ? { ...u, isBanned: action === 'ban' } : u
        ));
      }
    } catch (error) {
      console.error('Error banning user:', error);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center">
          <Crown size={32} className="text-black" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">لوحة تحكم الملك</h1>
          <p className="text-[#a1a1aa]">إدارة التطبيق والمستخدمين</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
        {[
          { id: 'gold', icon: Crown, label: 'طلبات الذهبي' },
          { id: 'users', icon: Users, label: 'المستخدمين' },
          { id: 'posts', icon: FileVideo, label: 'المنشورات' },
          { id: 'reports', icon: Bell, label: 'البلاغات' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-black font-bold'
                : 'bg-[#25253d] text-[#a1a1aa] hover:bg-[#3f3f5a]'
            }`}
          >
            <tab.icon size={20} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'gold' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold mb-4">طلبات الاشتراك الذهبي</h2>
          
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="card flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full skeleton" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 skeleton" />
                    <div className="h-3 w-48 skeleton" />
                  </div>
                </div>
              ))}
            </div>
          ) : goldRequests.length > 0 ? (
            goldRequests.map((request) => (
              <div key={request.id} className="card flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {request.avatarUrl ? (
                    <img src={request.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-xl font-bold">{request.username?.[0]?.toUpperCase()}</span>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{request.displayName || request.username}</h3>
                  <p className="text-sm text-[#a1a1aa]">@{request.username}</p>
                  {request.message && (
                    <p className="text-sm mt-1">{request.message}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleGoldRequest(request.id, 'approve')}
                    className="w-12 h-12 rounded-xl bg-green-500/20 text-green-500 flex items-center justify-center hover:bg-green-500 hover:text-white transition-all"
                  >
                    <Check size={24} />
                  </button>
                  <button
                    onClick={() => handleGoldRequest(request.id, 'reject')}
                    className="w-12 h-12 rounded-xl bg-red-500/20 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20">
              <div className="text-8xl mb-6">👑</div>
              <h2 className="text-xl font-bold mb-2">لا توجد طلبات</h2>
              <p className="text-[#a1a1aa]">ستظهر هنا طلبات الاشتراك الذهبي الجديدة</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'users' && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold mb-4">إدارة المستخدمين</h2>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {users.length > 0 ? (
              users.map((userData) => (
                <div key={userData.id} className="card">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center overflow-hidden">
                      {userData.avatarUrl ? (
                        <img src={userData.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-white font-bold">{userData.username?.[0]?.toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{userData.displayName || userData.username}</span>
                        {userData.isGoldMember && <span className="gold-badge">ذهبي</span>}
                        {userData.isBanned && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded">محظور</span>}
                      </div>
                      <span className="text-sm text-[#a1a1aa]">@{userData.username}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleBanUser(userData.id, userData.isBanned ? 'unban' : 'ban')}
                      className={`flex-1 py-2 rounded-xl flex items-center justify-center gap-2 ${
                        userData.isBanned
                          ? 'bg-green-500/20 text-green-500 hover:bg-green-500 hover:text-white'
                          : 'bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white'
                      } transition-all`}
                    >
                      {userData.isBanned ? (
                        <>
                          <Shield size={18} />
                          إلغاء الحظر
                        </>
                      ) : (
                        <>
                          <Ban size={18} />
                          حظر
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-20">
                <div className="text-8xl mb-6">👥</div>
                <h2 className="text-xl font-bold mb-2">لا يوجد مستخدمين</h2>
                <p className="text-[#a1a1aa]">سيظهر هنا قائمة المستخدمين</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'posts' && (
        <div className="text-center py-20">
          <div className="text-8xl mb-6">📝</div>
          <h2 className="text-xl font-bold mb-2">إدارة المنشورات</h2>
          <p className="text-[#a1a1aa]">ستتمكن من مراجعة وحذف المنشورات من هنا</p>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="text-center py-20">
          <div className="text-8xl mb-6">🚨</div>
          <h2 className="text-xl font-bold mb-2">البلاغات</h2>
          <p className="text-[#a1a1aa]">ستظهر هنا البلاغات المقدمة من المستخدمين</p>
        </div>
      )}
    </div>
  );
}
