'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Play, Pause, SkipBack, SkipForward, Heart, MoreHorizontal, Search, Shuffle, Repeat, Volume2, ListMusic } from 'lucide-react';

interface Track {
  id: number;
  title: string;
  artist: string;
  albumArt: string;
  duration: number;
  audioUrl?: string;
}

export default function MusicPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'forYou' | 'trending' | 'recent'>('forYou');
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [likedTracks, setLikedTracks] = useState<Set<number>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [volume, setVolume] = useState(80);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  // Demo tracks
  const tracks: Track[] = [
    { id: 1, title: 'أغنية الصيف', artist: 'فنان 1', albumArt: 'https://picsum.photos/200?random=1', duration: 215 },
    { id: 2, title: 'ليالي الشرق', artist: 'فنان 2', albumArt: 'https://picsum.photos/200?random=2', duration: 189 },
    { id: 3, title: 'على البحر', artist: 'فنان 3', albumArt: 'https://picsum.photos/200?random=3', duration: 234 },
    { id: 4, title: 'ذكريات', artist: 'فنان 4', albumArt: 'https://picsum.photos/200?random=4', duration: 198 },
    { id: 5, title: 'حلم بعيد', artist: 'فنان 5', albumArt: 'https://picsum.photos/200?random=5', duration: 267 },
    { id: 6, title: 'نسيم الليل', artist: 'فنان 6', albumArt: 'https://picsum.photos/200?random=6', duration: 203 },
    { id: 7, title: 'شمس الصباح', artist: 'فنان 7', albumArt: 'https://picsum.photos/200?random=7', duration: 221 },
    { id: 8, title: 'قمر الليالي', artist: 'فنان 8', albumArt: 'https://picsum.photos/200?random=8', duration: 245 },
  ];

  const trendingTracks = tracks.slice(3, 8);
  const recentTracks = tracks.slice(0, 4);

  useEffect(() => {
    if (isPlaying && currentTrack) {
      progressInterval.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            playNext();
            return 0;
          }
          return prev + (100 / currentTrack.duration);
        });
      }, 1000);
    } else {
      if (progressInterval.current) clearInterval(progressInterval.current);
    }

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
    };
  }, [isPlaying, currentTrack]);

  const playTrack = (track: Track) => {
    if (currentTrack?.id === track.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentTrack(track);
      setProgress(0);
      setIsPlaying(true);
    }
  };

  const playNext = () => {
    if (!currentTrack) return;
    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
    const nextIndex = isShuffled 
      ? Math.floor(Math.random() * tracks.length)
      : (currentIndex + 1) % tracks.length;
    setCurrentTrack(tracks[nextIndex]);
    setProgress(0);
  };

  const playPrevious = () => {
    if (!currentTrack) return;
    const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
    const prevIndex = currentIndex === 0 ? tracks.length - 1 : currentIndex - 1;
    setCurrentTrack(tracks[prevIndex]);
    setProgress(0);
  };

  const toggleLike = (trackId: number) => {
    setLikedTracks(prev => {
      const newSet = new Set(prev);
      if (newSet.has(trackId)) newSet.delete(trackId);
      else newSet.add(trackId);
      return newSet;
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentTime = () => {
    if (!currentTrack) return '0:00';
    const currentSeconds = Math.floor((progress / 100) * currentTrack.duration);
    return formatDuration(currentSeconds);
  };

  const displayTracks = activeTab === 'trending' ? trendingTracks : activeTab === 'recent' ? recentTracks : tracks;
  const filteredTracks = searchQuery 
    ? displayTracks.filter(t => t.title.includes(searchQuery) || t.artist.includes(searchQuery))
    : displayTracks;

  return (
    <div className="h-full bg-black pt-[82px] md:pt-0 pb-[60px] md:pb-0 overflow-y-auto">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-black/95 backdrop-blur border-b border-[#262626]">
        <div className="px-4 py-3">
          <h1 className="text-xl font-semibold mb-3">الموسيقى</h1>
          
          {/* Search */}
          <div className="relative mb-3">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a0a0a0]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث عن أغنية أو فنان..."
              className="w-full bg-[#262626] rounded-lg py-2 pr-10 pl-4 text-sm placeholder:text-[#a0a0a0] outline-none"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-2">
            {[
              { id: 'forYou', label: 'لك' },
              { id: 'trending', label: 'رائج' },
              { id: 'recent', label: 'الأخيرة' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-black'
                    : 'bg-[#262626] text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Featured */}
      {activeTab === 'forYou' && !searchQuery && (
        <div className="px-4 py-4">
          <h2 className="text-lg font-semibold mb-3">المميز</h2>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {tracks.slice(0, 4).map(track => (
              <button
                key={track.id}
                onClick={() => playTrack(track)}
                className="flex-shrink-0 w-36"
              >
                <div className="relative w-36 h-36 rounded-lg overflow-hidden mb-2">
                  <img src={track.albumArt} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                      <Play size={24} className="text-black ml-1" fill="black" />
                    </div>
                  </div>
                  {currentTrack?.id === track.id && isPlaying && (
                    <div className="absolute bottom-2 right-2 flex gap-0.5">
                      <span className="w-1 h-4 bg-white rounded animate-pulse" />
                      <span className="w-1 h-4 bg-white rounded animate-pulse" style={{ animationDelay: '0.1s' }} />
                      <span className="w-1 h-4 bg-white rounded animate-pulse" style={{ animationDelay: '0.2s' }} />
                    </div>
                  )}
                </div>
                <p className="text-sm font-medium truncate">{track.title}</p>
                <p className="text-xs text-[#a0a0a0] truncate">{track.artist}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Track List */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">
            {activeTab === 'forYou' ? 'جميع الأغاني' : activeTab === 'trending' ? 'الرائج الآن' : 'استمعت مؤخراً'}
          </h2>
          <button className="text-[#a0a0a0]">
            <ListMusic size={20} />
          </button>
        </div>

        <div className="space-y-1">
          {filteredTracks.map((track, index) => (
            <div
              key={track.id}
              className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                currentTrack?.id === track.id ? 'bg-[#1a1a1a]' : 'hover:bg-[#0a0a0a]'
              }`}
            >
              <span className="w-5 text-center text-sm text-[#a0a0a0]">{index + 1}</span>
              
              <button 
                onClick={() => playTrack(track)}
                className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0"
              >
                <img src={track.albumArt} alt="" className="w-full h-full object-cover" />
                {currentTrack?.id === track.id && isPlaying ? (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="flex gap-0.5">
                      <span className="w-0.5 h-3 bg-white rounded animate-pulse" />
                      <span className="w-0.5 h-3 bg-white rounded animate-pulse" style={{ animationDelay: '0.1s' }} />
                      <span className="w-0.5 h-3 bg-white rounded animate-pulse" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Play size={20} fill="white" className="text-white" />
                  </div>
                )}
              </button>

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${currentTrack?.id === track.id ? 'text-[#0095f6]' : ''}`}>
                  {track.title}
                </p>
                <p className="text-xs text-[#a0a0a0] truncate">{track.artist}</p>
              </div>

              <span className="text-xs text-[#a0a0a0]">{formatDuration(track.duration)}</span>

              <button 
                onClick={() => toggleLike(track.id)}
                className="p-2"
              >
                <Heart 
                  size={18} 
                  className={likedTracks.has(track.id) ? 'text-[#ed4956]' : 'text-[#a0a0a0]'}
                  fill={likedTracks.has(track.id) ? '#ed4956' : 'none'}
                />
              </button>

              <button className="p-2 text-[#a0a0a0]">
                <MoreHorizontal size={18} />
              </button>
            </div>
          ))}
        </div>

        {filteredTracks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-[#a0a0a0]">لا توجد نتائج</p>
          </div>
        )}
      </div>

      {/* Player */}
      {currentTrack && (
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 md:right-[72px] lg:right-[220px] bg-[#181818] border-t border-[#262626]">
          {/* Progress bar */}
          <div className="h-1 bg-[#3e3e3e]">
            <div 
              className="h-full bg-white transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center gap-4 px-4 py-3">
            {/* Track info */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                <img src={currentTrack.albumArt} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{currentTrack.title}</p>
                <p className="text-xs text-[#a0a0a0] truncate">{currentTrack.artist}</p>
              </div>
              <button onClick={() => toggleLike(currentTrack.id)}>
                <Heart 
                  size={18} 
                  className={likedTracks.has(currentTrack.id) ? 'text-[#ed4956]' : 'text-[#a0a0a0]'}
                  fill={likedTracks.has(currentTrack.id) ? '#ed4956' : 'none'}
                />
              </button>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsShuffled(!isShuffled)}
                className={`hidden md:block ${isShuffled ? 'text-[#0095f6]' : 'text-[#a0a0a0]'}`}
              >
                <Shuffle size={18} />
              </button>

              <button onClick={playPrevious} className="text-white">
                <SkipBack size={22} fill="white" />
              </button>

              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-10 h-10 rounded-full bg-white flex items-center justify-center"
              >
                {isPlaying ? (
                  <Pause size={22} className="text-black" fill="black" />
                ) : (
                  <Play size={22} className="text-black ml-0.5" fill="black" />
                )}
              </button>

              <button onClick={playNext} className="text-white">
                <SkipForward size={22} fill="white" />
              </button>

              <button 
                onClick={() => setRepeatMode(repeatMode === 'off' ? 'all' : repeatMode === 'all' ? 'one' : 'off')}
                className={`hidden md:block ${repeatMode !== 'off' ? 'text-[#0095f6]' : 'text-[#a0a0a0]'}`}
              >
                <Repeat size={18} />
                {repeatMode === 'one' && <span className="text-[8px] absolute">1</span>}
              </button>
            </div>

            {/* Time & Volume */}
            <div className="hidden md:flex items-center gap-3 flex-1 justify-end">
              <span className="text-xs text-[#a0a0a0]">{getCurrentTime()}</span>
              <span className="text-xs text-[#a0a0a0]">/</span>
              <span className="text-xs text-[#a0a0a0]">{formatDuration(currentTrack.duration)}</span>
              
              <div className="flex items-center gap-2 mr-4">
                <Volume2 size={18} className="text-[#a0a0a0]" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(parseInt(e.target.value))}
                  className="w-20 h-1 accent-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
