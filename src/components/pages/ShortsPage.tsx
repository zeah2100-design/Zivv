'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Play, Pause, Volume2, VolumeX, Music } from 'lucide-react';

interface Short {
  id: number;
  userId: number;
  content: string | null;
  mediaUrl: string | null;
  views: number | null;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  isGoldMember: boolean | null;
  likesCount: number;
  commentsCount: number;
}

export default function ShortsPage() {
  const { user } = useAuth();
  const [shorts, setShorts] = useState<Short[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [likedShorts, setLikedShorts] = useState<Set<number>>(new Set());
  const [savedShorts, setSavedShorts] = useState<Set<number>>(new Set());
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<{ [key: number]: HTMLVideoElement }>({});

  // Demo shorts data
  const demoShorts: Short[] = [
    {
      id: 1, userId: 1, content: 'شوفوا المنظر الجميل ده! 🌅 #sunset #nature', 
      mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      views: 15420, username: 'ziad', displayName: 'زياد أحمد', avatarUrl: 'https://i.pravatar.cc/150?u=ziad',
      isGoldMember: true, likesCount: 2340, commentsCount: 156
    },
    {
      id: 2, userId: 2, content: 'وصفة سريعة وسهلة 🍝 #cooking #food',
      mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      views: 8930, username: 'ahmed', displayName: 'أحمد محمد', avatarUrl: 'https://i.pravatar.cc/150?u=ahmed',
      isGoldMember: false, likesCount: 1205, commentsCount: 89
    },
    {
      id: 3, userId: 3, content: 'تعلم البرمجة معي! 💻 #coding #tech',
      mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      views: 25600, username: 'sara', displayName: 'سارة علي', avatarUrl: 'https://i.pravatar.cc/150?u=sara',
      isGoldMember: false, likesCount: 4521, commentsCount: 312
    },
    {
      id: 4, userId: 4, content: 'رحلتي لدبي 🏙️ #travel #dubai',
      mediaUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
      views: 12300, username: 'omar', displayName: 'عمر خالد', avatarUrl: 'https://i.pravatar.cc/150?u=omar',
      isGoldMember: false, likesCount: 1890, commentsCount: 134
    },
  ];

  useEffect(() => {
    loadShorts();
  }, []);

  useEffect(() => {
    // Play current video, pause others
    Object.entries(videoRefs.current).forEach(([index, video]) => {
      if (parseInt(index) === currentIndex) {
        if (isPlaying) video.play().catch(() => {});
        else video.pause();
        video.muted = isMuted;
      } else {
        video.pause();
        video.currentTime = 0;
      }
    });
  }, [currentIndex, isPlaying, isMuted]);

  const loadShorts = async () => {
    try {
      const res = await fetch('/api/posts?type=shorts');
      const data = await res.json();
      if (data.posts && data.posts.length > 0) {
        setShorts(data.posts);
      } else {
        setShorts(demoShorts);
      }
    } catch {
      setShorts(demoShorts);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const height = containerRef.current.clientHeight;
    const newIndex = Math.round(scrollTop / height);
    if (newIndex !== currentIndex && newIndex >= 0 && newIndex < shorts.length) {
      setCurrentIndex(newIndex);
    }
  };

  const handleLike = (shortId: number) => {
    setLikedShorts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(shortId)) newSet.delete(shortId);
      else newSet.add(shortId);
      return newSet;
    });
  };

  const handleSave = (shortId: number) => {
    setSavedShorts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(shortId)) newSet.delete(shortId);
      else newSet.add(shortId);
      return newSet;
    });
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  if (isLoading) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#a0a0a0] border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      onScroll={handleScroll}
      className="h-screen bg-black overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
    >
      {shorts.map((short, index) => (
        <div 
          key={short.id}
          className="h-screen w-full snap-start relative flex items-center justify-center bg-black"
        >
          {/* Video */}
          <video
            ref={el => { if (el) videoRefs.current[index] = el; }}
            src={short.mediaUrl || ''}
            className="h-full w-full object-cover"
            loop
            playsInline
            muted={isMuted}
            onClick={togglePlayPause}
          />

          {/* Play/Pause indicator */}
          {!isPlaying && index === currentIndex && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-20 h-20 rounded-full bg-black/40 flex items-center justify-center">
                <Play size={40} className="text-white ml-1" fill="white" />
              </div>
            </div>
          )}

          {/* Top gradient */}
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
          
          {/* Bottom gradient */}
          <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />

          {/* Header */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
            <h1 className="text-lg font-semibold">ريلز</h1>
            <button 
              onClick={() => setIsMuted(!isMuted)}
              className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center"
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
          </div>

          {/* Right Actions */}
          <div className="absolute left-3 bottom-24 flex flex-col items-center gap-5">
            {/* Like */}
            <button 
              onClick={() => handleLike(short.id)}
              className="flex flex-col items-center"
            >
              <Heart 
                size={28} 
                className={likedShorts.has(short.id) ? 'text-[#ed4956]' : 'text-white'}
                fill={likedShorts.has(short.id) ? '#ed4956' : 'none'}
              />
              <span className="text-xs mt-1">{formatNumber(short.likesCount + (likedShorts.has(short.id) ? 1 : 0))}</span>
            </button>

            {/* Comment */}
            <button className="flex flex-col items-center">
              <MessageCircle size={28} />
              <span className="text-xs mt-1">{formatNumber(short.commentsCount)}</span>
            </button>

            {/* Share */}
            <button className="flex flex-col items-center">
              <Send size={26} />
              <span className="text-xs mt-1">مشاركة</span>
            </button>

            {/* Save */}
            <button 
              onClick={() => handleSave(short.id)}
              className="flex flex-col items-center"
            >
              <Bookmark 
                size={26} 
                fill={savedShorts.has(short.id) ? 'white' : 'none'}
              />
            </button>

            {/* More */}
            <button>
              <MoreHorizontal size={26} />
            </button>

            {/* Music disc */}
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/30 animate-spin" style={{ animationDuration: '3s' }}>
              {short.avatarUrl ? (
                <img src={short.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Music size={16} />
                </div>
              )}
            </div>
          </div>

          {/* Bottom Info */}
          <div className="absolute bottom-6 right-4 left-16">
            {/* User info */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full overflow-hidden bg-[#262626]">
                {short.avatarUrl ? (
                  <img src={short.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-semibold">
                    {short.username[0].toUpperCase()}
                  </div>
                )}
              </div>
              <span className="font-semibold text-sm">{short.username}</span>
              {short.isGoldMember && <span className="text-[#0095f6] text-sm">✓</span>}
              <button className="text-sm font-semibold border border-white/50 px-3 py-0.5 rounded-lg">
                متابعة
              </button>
            </div>

            {/* Caption */}
            {short.content && (
              <p className="text-sm leading-relaxed mb-2">{short.content}</p>
            )}

            {/* Music */}
            <div className="flex items-center gap-2">
              <Music size={12} />
              <p className="text-xs text-white/80">الصوت الأصلي - {short.username}</p>
            </div>
          </div>

          {/* Progress dots */}
          <div className="absolute top-14 left-0 right-0 flex justify-center gap-1">
            {shorts.map((_, i) => (
              <div 
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === currentIndex ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
