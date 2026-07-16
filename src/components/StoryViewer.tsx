'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { X, Eye, ChevronLeft, ChevronRight, Send, Heart, Volume2, VolumeX, Pause, Play } from '@/components/icons';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Story {
  id: number;
  mediaUrl: string;
  mediaType: string;
  caption: string | null;
  views: number | null;
  createdAt: Date | string | null;
}

interface StoryGroup {
  user: {
    id: number;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    isGoldMember: boolean | null;
  };
  stories: Story[];
}

interface StoryViewerProps {
  storyGroups: StoryGroup[];
  initialGroupIndex: number;
  onClose: () => void;
}

export default function StoryViewer({ storyGroups, initialGroupIndex, onClose }: StoryViewerProps) {
  const { user } = useAuth();
  const [groupIndex, setGroupIndex] = useState(initialGroupIndex);
  const [storyIndex, setStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReply, setShowReply] = useState(false);
  const [liked, setLiked] = useState(false);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const currentGroup = storyGroups[groupIndex];
  const currentStory = currentGroup?.stories[storyIndex];
  const isVideo = currentStory?.mediaType === 'video';
  const STORY_DURATION = isVideo ? 15000 : 5000;

  // Record view
  useEffect(() => {
    if (currentStory && user) {
      fetch(`/api/stories/${currentStory.id}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ viewerId: user.id }),
      }).catch(() => {});
    }
  }, [currentStory?.id, user]);

  // Progress timer
  useEffect(() => {
    if (isPaused || showReply) return;

    setProgress(0);
    const step = 100 / (STORY_DURATION / 50);

    progressTimer.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          goNext();
          return 0;
        }
        return prev + step;
      });
    }, 50);

    return () => {
      if (progressTimer.current) clearInterval(progressTimer.current);
    };
  }, [groupIndex, storyIndex, isPaused, showReply, STORY_DURATION]);

  // Video sync
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      if (isPaused) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {});
      }
    }
  }, [isPaused, isMuted, currentStory?.id]);

  const goNext = useCallback(() => {
    if (!currentGroup) return;
    if (storyIndex < currentGroup.stories.length - 1) {
      setStoryIndex(prev => prev + 1);
      setLiked(false);
    } else if (groupIndex < storyGroups.length - 1) {
      setGroupIndex(prev => prev + 1);
      setStoryIndex(0);
      setLiked(false);
    } else {
      onClose();
    }
  }, [currentGroup, storyIndex, groupIndex, storyGroups.length, onClose]);

  const goPrev = useCallback(() => {
    if (storyIndex > 0) {
      setStoryIndex(prev => prev - 1);
      setLiked(false);
    } else if (groupIndex > 0) {
      setGroupIndex(prev => prev - 1);
      const prevGroup = storyGroups[groupIndex - 1];
      setStoryIndex(prevGroup.stories.length - 1);
      setLiked(false);
    }
  }, [storyIndex, groupIndex, storyGroups]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        // RTL: right = prev, left = next
        if (e.key === 'ArrowRight') goPrev();
        else goNext();
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPaused(p => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev, onClose]);

  // Touch handling (swipe)
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsPaused(false);
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Only swipe if horizontal movement is greater
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        // Swiped right (RTL = next)
        goNext();
      } else {
        // Swiped left (RTL = prev)
        goPrev();
      }
    }
    // Swipe down to close
    if (deltaY > 100) {
      onClose();
    }
  };

  const handleTap = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    // RTL: left third = next, right third = prev
    if (x < width / 3) {
      goNext();
    } else if (x > (width * 2) / 3) {
      goPrev();
    } else {
      // Middle = pause/play
      setIsPaused(p => !p);
    }
  };

  const formatTime = (date: Date | string | null) => {
    if (!date) return '';
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ar });
    } catch {
      return '';
    }
  };

  const handleReply = () => {
    if (!replyText.trim()) return;
    // In production, send message to story owner
    alert(`تم إرسال الرد: ${replyText}`);
    setReplyText('');
    setShowReply(false);
  };

  if (!currentGroup || !currentStory) return null;

  return (
    <div className="fixed inset-0 bg-black z-[9999] flex items-center justify-center">
      {/* Desktop: Previous Group Arrow */}
      {groupIndex > 0 && (
        <button
          onClick={() => { setGroupIndex(prev => prev - 1); setStoryIndex(0); }}
          className="hidden md:flex absolute right-4 z-20 w-10 h-10 rounded-full bg-white/10 backdrop-blur items-center justify-center hover:bg-white/20 transition-colors"
        >
          <ChevronRight size={24} className="text-white" />
        </button>
      )}

      {/* Desktop: Next Group Arrow */}
      {groupIndex < storyGroups.length - 1 && (
        <button
          onClick={() => { setGroupIndex(prev => prev + 1); setStoryIndex(0); }}
          className="hidden md:flex absolute left-4 z-20 w-10 h-10 rounded-full bg-white/10 backdrop-blur items-center justify-center hover:bg-white/20 transition-colors"
        >
          <ChevronLeft size={24} className="text-white" />
        </button>
      )}

      {/* Story Container */}
      <div className="relative w-full h-full md:w-[400px] md:h-[calc(100vh-40px)] md:rounded-2xl md:overflow-hidden bg-black">
        {/* Progress Bars */}
        <div className="absolute top-0 left-0 right-0 z-20 flex gap-[3px] px-3 pt-3">
          {currentGroup.stories.map((_, i) => (
            <div key={i} className="flex-1 h-[2.5px] bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-none"
                style={{
                  width: i < storyIndex ? '100%' :
                         i === storyIndex ? `${Math.min(progress, 100)}%` : '0%',
                  transition: i === storyIndex ? 'none' : undefined,
                }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-6 left-0 right-0 z-20 flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
              {currentGroup.user.avatarUrl ? (
                <img src={currentGroup.user.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white font-bold text-sm">
                  {currentGroup.user.username?.[0]?.toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-white font-semibold text-sm">
                  {currentGroup.user.displayName || currentGroup.user.username}
                </span>
                {currentGroup.user.isGoldMember && <span className="text-xs">👑</span>}
              </div>
              <span className="text-white/60 text-[11px]">
                {formatTime(currentStory.createdAt)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isVideo && (
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="w-8 h-8 rounded-full bg-black/30 backdrop-blur flex items-center justify-center"
              >
                {isMuted ? (
                  <VolumeX size={16} className="text-white" />
                ) : (
                  <Volume2 size={16} className="text-white" />
                )}
              </button>
            )}
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="w-8 h-8 rounded-full bg-black/30 backdrop-blur flex items-center justify-center"
            >
              {isPaused ? (
                <Play size={16} className="text-white" />
              ) : (
                <Pause size={16} className="text-white" />
              )}
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-black/30 backdrop-blur flex items-center justify-center"
            >
              <X size={18} className="text-white" />
            </button>
          </div>
        </div>

        {/* Story Media */}
        <div
          className="absolute inset-0 flex items-center justify-center"
          onClick={handleTap}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {isVideo ? (
            <video
              ref={videoRef}
              key={currentStory.id}
              src={currentStory.mediaUrl}
              className="w-full h-full object-contain"
              autoPlay
              playsInline
              loop={false}
              muted={isMuted}
            />
          ) : (
            <img
              key={currentStory.id}
              src={currentStory.mediaUrl}
              alt=""
              className="w-full h-full object-contain"
            />
          )}

          {/* Gradient overlays */}
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
        </div>

        {/* Caption */}
        {currentStory.caption && (
          <div className="absolute bottom-24 left-4 right-4 z-20">
            <div className="bg-black/40 backdrop-blur-md rounded-2xl px-4 py-3">
              <p className="text-white text-sm leading-relaxed">{currentStory.caption}</p>
            </div>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="absolute bottom-0 left-0 right-0 z-20 p-4">
          {showReply ? (
            <div className="flex gap-2 animate-slideUp">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                placeholder="اكتب رداً..."
                className="flex-1 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-2.5 text-white text-sm placeholder:text-white/50 focus:outline-none focus:border-white/40"
                autoFocus
                onBlur={() => !replyText && setShowReply(false)}
              />
              <button
                onClick={handleReply}
                className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center"
              >
                <Send size={18} className="text-white" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {/* Reply input trigger */}
              {user && currentGroup.user.id !== user.id && (
                <button
                  onClick={() => { setShowReply(true); setIsPaused(true); }}
                  className="flex-1 bg-white/10 backdrop-blur border border-white/20 rounded-full px-4 py-2.5 text-white/50 text-sm text-right"
                >
                  اكتب رداً...
                </button>
              )}

              {/* Views (own story) */}
              {user && currentGroup.user.id === user.id && (
                <div className="flex-1 flex items-center gap-2 text-white/70">
                  <Eye size={18} />
                  <span className="text-sm">{currentStory.views || 0} مشاهدة</span>
                </div>
              )}

              {/* Like button */}
              {user && currentGroup.user.id !== user.id && (
                <button
                  onClick={() => setLiked(!liked)}
                  className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center transition-transform active:scale-125"
                >
                  <Heart
                    size={22}
                    className={liked ? 'text-red-500' : 'text-white'}
                    fill={liked ? 'currentColor' : 'none'}
                  />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Paused indicator */}
        {isPaused && !showReply && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-black/40 backdrop-blur flex items-center justify-center animate-fadeIn">
              <Pause size={32} className="text-white" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
