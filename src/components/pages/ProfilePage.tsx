'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Settings, Grid3X3, Film, Bookmark, UserPlus, MoreHorizontal } from 'lucide-react';

interface UserProfile {
  id: number;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  isGoldMember: boolean | null;
  followersCount: number;
  followingCount: number;
  postsCount: number;
}

interface Post {
  id: number;
  mediaUrl: string | null;
  type: string;
}

interface ProfilePageProps {
  viewUserId?: number;
  onNavigate: (page: string, data?: Record<string, unknown>) => void;
}

export default function ProfilePage({ viewUserId, onNavigate }: ProfilePageProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'reels' | 'saved'>('posts');

  const profileId = viewUserId || user?.id;
  const isOwnProfile = user?.id === profileId;

  useEffect(() => {
    if (profileId) {
      loadProfile();
      loadPosts();
    }
  }, [profileId]);

  const loadProfile = async () => {
    if (!profileId) return;
    try {
      const res = await fetch(`/api/users/${profileId}`);
      const data = await res.json();
      setProfile(data.user);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPosts = async () => {
    if (!profileId) return;
    try {
      const res = await fetch(`/api/posts?userId=${profileId}`);
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleFollow = async () => {
    if (!user || !profileId) return;
    setIsFollowing(!isFollowing);
    try {
      await fetch(`/api/users/${profileId}/follow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
    } catch {
      setIsFollowing(isFollowing);
    }
  };

  if (!profileId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[#a0a0a0]">سجل الدخول لعرض الملف الشخصي</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#a0a0a0] border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-[#a0a0a0]">المستخدم غير موجود</p>
      </div>
    );
  }

  return (
    <div className="h-full bg-black pt-[82px] md:pt-0 pb-[60px] md:pb-0 overflow-y-auto">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black px-4 py-3 border-b border-[#262626] flex items-center justify-between">
        <h1 className="text-lg font-semibold">{profile.username}</h1>
        {isOwnProfile && (
          <button onClick={() => onNavigate('settings')}>
            <Settings size={24} />
          </button>
        )}
      </header>

      {/* Profile Info */}
      <div className="p-4">
        <div className="flex items-start gap-6 mb-4">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-[#262626] flex-shrink-0">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-semibold">
                {profile.username?.[0]?.toUpperCase()}
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex justify-around text-center">
              <div>
                <p className="font-semibold">{profile.postsCount}</p>
                <p className="text-xs text-[#a0a0a0]">منشورات</p>
              </div>
              <div>
                <p className="font-semibold">{profile.followersCount}</p>
                <p className="text-xs text-[#a0a0a0]">متابعون</p>
              </div>
              <div>
                <p className="font-semibold">{profile.followingCount}</p>
                <p className="text-xs text-[#a0a0a0]">متابَعون</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-1">
            <p className="font-semibold text-sm">{profile.displayName || profile.username}</p>
            {profile.isGoldMember && <span className="text-[#0095f6]">✓</span>}
          </div>
          {profile.bio && <p className="text-sm mt-1">{profile.bio}</p>}
        </div>

        {isOwnProfile ? (
          <div className="flex gap-2">
            <button className="btn-secondary flex-1 py-1.5 text-sm">تعديل الملف الشخصي</button>
            <button className="btn-secondary flex-1 py-1.5 text-sm">مشاركة الملف</button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleFollow}
              className={`flex-1 py-1.5 text-sm rounded-lg font-semibold ${
                isFollowing
                  ? 'bg-[#262626] text-white'
                  : 'bg-[#0095f6] text-white'
              }`}
            >
              {isFollowing ? 'متابَع' : 'متابعة'}
            </button>
            <button className="btn-secondary py-1.5 text-sm">رسالة</button>
            <button className="btn-secondary p-1.5">
              <UserPlus size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-t border-[#262626]">
        <button
          onClick={() => setActiveTab('posts')}
          className={`flex-1 py-3 flex justify-center border-t ${
            activeTab === 'posts' ? 'border-white' : 'border-transparent text-[#a0a0a0]'
          }`}
        >
          <Grid3X3 size={22} />
        </button>
        <button
          onClick={() => setActiveTab('reels')}
          className={`flex-1 py-3 flex justify-center border-t ${
            activeTab === 'reels' ? 'border-white' : 'border-transparent text-[#a0a0a0]'
          }`}
        >
          <Film size={22} />
        </button>
        {isOwnProfile && (
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex-1 py-3 flex justify-center border-t ${
              activeTab === 'saved' ? 'border-white' : 'border-transparent text-[#a0a0a0]'
            }`}
          >
            <Bookmark size={22} />
          </button>
        )}
      </div>

      {/* Posts Grid */}
      <div className="grid grid-cols-3 gap-[2px]">
        {posts.filter(p => p.mediaUrl).map(post => (
          <div key={post.id} className="aspect-square bg-[#262626]">
            <img src={post.mediaUrl!} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
      </div>

      {posts.length === 0 && (
        <div className="py-16 text-center">
          <p className="text-[#a0a0a0] text-sm">لا توجد منشورات بعد</p>
        </div>
      )}
    </div>
  );
}
