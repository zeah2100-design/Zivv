'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Image, Camera, X, Eye, Clock, Upload } from '@/components/icons';
import StoryViewer from '@/components/StoryViewer';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Story {
  id: number;
  userId: number;
  mediaUrl: string;
  mediaType: string;
  caption: string | null;
  views: number | null;
  createdAt: Date | string | null;
  expiresAt: Date | string | null;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  isGoldMember: boolean | null;
}

interface StoryGroup {
  user: { id: number; username: string; displayName: string | null; avatarUrl: string | null; isGoldMember: boolean | null };
  stories: Story[];
}

export default function StoriesPage() {
  const { user } = useAuth();
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showViewer, setShowViewer] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [newCaption, setNewCaption] = useState('');
  const [newMediaPreview, setNewMediaPreview] = useState('');
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newMediaType, setNewMediaType] = useState<'image' | 'video'>('image');
  const [isCreating, setIsCreating] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadStories(); }, []);

  const loadStories = async () => {
    try {
      const res = await fetch('/api/stories');
      const data = await res.json();
      setStoryGroups(data.stories || []);
    } catch {} finally { setIsLoading(false); }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewMediaPreview(URL.createObjectURL(file));
    setNewMediaType(file.type.startsWith('video/') ? 'video' : 'image');
    const reader = new FileReader();
    reader.onload = () => setNewMediaUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleUrlAdd = () => {
    if (!urlInput.trim()) return;
    setNewMediaUrl(urlInput);
    setNewMediaPreview(urlInput);
    setNewMediaType('image');
  };

  const createStory = async () => {
    if (!user || !newMediaUrl) return;
    setIsCreating(true);
    try {
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, mediaUrl: newMediaUrl, mediaType: newMediaType, caption: newCaption }),
      });
      if (res.ok) {
        setShowCreate(false);
        setNewMediaPreview(''); setNewMediaUrl(''); setNewCaption(''); setUrlInput('');
        loadStories();
      }
    } catch {} finally { setIsCreating(false); }
  };

  const formatTime = (date: Date | string | null) => {
    if (!date) return '';
    try { return formatDistanceToNow(new Date(date), { addSuffix: true, locale: ar }); } catch { return ''; }
  };

  const openStory = (i: number) => { setViewerIndex(i); setShowViewer(true); };
  const myStory = user ? storyGroups.find(g => g.user.id === user.id) : null;
  const otherStories = storyGroups.filter(g => !user || g.user.id !== user.id);

  if (showViewer && storyGroups.length > 0) {
    return <StoryViewer storyGroups={storyGroups} initialGroupIndex={viewerIndex} onClose={() => setShowViewer(false)} />;
  }

  // Create story view
  if (showCreate) {
    return (
      <div className="flex flex-col pt-[82px] md:pt-0 pb-[60px] md:pb-0" style={{ height: '100dvh' }}>
        <div className="bg-black border-b border-[#262626] px-4 py-3 flex items-center justify-between flex-shrink-0">
          <button onClick={() => { setShowCreate(false); setNewMediaPreview(''); setNewMediaUrl(''); setNewCaption(''); setUrlInput(''); }}
            className="text-sm text-[#737373]">إلغاء</button>
          <h1 className="font-semibold">حالة جديدة</h1>
          <button onClick={createStory} disabled={!newMediaUrl || isCreating}
            className="text-[#0095f6] font-semibold text-sm disabled:opacity-30">
            {isCreating ? '...' : 'نشر'}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Upload from device */}
          {!newMediaPreview && (
            <>
              <button onClick={() => fileRef.current?.click()}
                className="w-full border border-[#262626] rounded-xl py-12 flex flex-col items-center gap-3 active:bg-[#262626] transition-colors">
                <div className="w-14 h-14 rounded-full bg-[#262626] flex items-center justify-center">
                  <Upload size={24} className="text-[#0095f6]" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">رفع من الجهاز</p>
                  <p className="text-xs text-[#737373] mt-1">صورة أو فيديو</p>
                </div>
              </button>
              <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFileSelect} />

              <div className="flex items-center gap-2">
                <div className="flex-1 h-px bg-[#262626]" />
                <span className="text-xs text-[#737373]">أو أدخل رابط</span>
                <div className="flex-1 h-px bg-[#262626]" />
              </div>

              <div className="flex gap-2">
                <input type="url" value={urlInput} onChange={e => setUrlInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleUrlAdd()}
                  placeholder="https://..." className="flex-1 bg-[#262626] rounded-lg px-3 py-2.5 text-sm outline-none" dir="ltr" />
                {urlInput && (
                  <button onClick={handleUrlAdd} className="bg-[#0095f6] px-4 rounded-lg text-sm font-semibold">إضافة</button>
                )}
              </div>
            </>
          )}

          {/* Preview */}
          {newMediaPreview && (
            <div className="relative rounded-xl overflow-hidden bg-[#262626]">
              <button onClick={() => { setNewMediaPreview(''); setNewMediaUrl(''); setUrlInput(''); }}
                className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/70 flex items-center justify-center">
                <X size={18} />
              </button>
              {newMediaType === 'video' ? (
                <video src={newMediaPreview} controls className="w-full max-h-80 object-contain" />
              ) : (
                <img src={newMediaPreview} alt="" className="w-full max-h-80 object-contain" />
              )}
            </div>
          )}

          {/* Caption */}
          <textarea value={newCaption} onChange={e => setNewCaption(e.target.value)}
            placeholder="اكتب شيئاً عن حالتك... (اختياري)"
            rows={2} maxLength={200}
            className="w-full bg-[#262626] rounded-lg px-3 py-2 text-sm outline-none resize-none" />

          <p className="text-[10px] text-[#737373]">⏰ الحالة تختفي بعد 24 ساعة</p>
        </div>
      </div>
    );
  }

  // Stories list
  return (
    <div className="h-full bg-black pt-[82px] md:pt-0 pb-[60px] md:pb-0 overflow-y-auto">
      <header className="sticky top-0 bg-black border-b border-[#262626] px-4 py-3 z-10">
        <h1 className="font-semibold text-center">الحالات</h1>
      </header>

      <div className="p-4">
        {/* My Story */}
        <div className="mb-4">
          <p className="text-xs text-[#737373] mb-2">حالتي</p>
          <button onClick={() => myStory ? openStory(storyGroups.indexOf(myStory)) : setShowCreate(true)}
            className="w-full flex items-center gap-3 py-2">
            <div className="relative">
              <div className={`w-14 h-14 rounded-full overflow-hidden ${myStory ? 'ring-2 ring-[#0095f6] ring-offset-2 ring-offset-black' : 'bg-[#262626]'}`}>
                {user?.avatarUrl ? <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" /> :
                  <div className="w-full h-full flex items-center justify-center text-lg font-semibold">{user?.username?.[0]?.toUpperCase() || '?'}</div>}
              </div>
              {!myStory && (
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-[#0095f6] rounded-full flex items-center justify-center border-2 border-black">
                  <Plus size={12} className="text-white" />
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="font-semibold text-sm">{myStory ? 'حالتي' : 'أضف حالة'}</p>
              <p className="text-xs text-[#737373]">{myStory ? `${myStory.stories.length} حالة` : 'اضغط لإضافة'}</p>
            </div>
          </button>
        </div>

        {/* Others */}
        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-[#737373] border-t-white rounded-full animate-spin" />
          </div>
        ) : otherStories.length > 0 ? (
          <div>
            <p className="text-xs text-[#737373] mb-2">التحديثات الأخيرة</p>
            {otherStories.map(group => {
              const idx = storyGroups.indexOf(group);
              const latest = group.stories[group.stories.length - 1];
              return (
                <button key={group.user.id} onClick={() => openStory(idx)}
                  className="w-full flex items-center gap-3 py-2 hover:bg-[#0a0a0a] rounded-lg">
                  <div className="story-ring w-[58px] h-[58px] rounded-full p-[2px]">
                    <div className="w-full h-full rounded-full overflow-hidden bg-black p-[2px]">
                      <div className="w-full h-full rounded-full overflow-hidden bg-[#262626]">
                        {group.user.avatarUrl ? <img src={group.user.avatarUrl} alt="" className="w-full h-full object-cover" /> :
                          <div className="w-full h-full flex items-center justify-center font-semibold">{group.user.username[0].toUpperCase()}</div>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex-1">
                    <p className="font-semibold text-sm">{group.user.displayName || group.user.username}</p>
                    <p className="text-xs text-[#737373]">{formatTime(latest.createdAt)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Camera size={40} className="text-[#262626] mx-auto mb-3" />
            <p className="text-sm text-[#737373]">لا توجد حالات</p>
            {user && (
              <button onClick={() => setShowCreate(true)} className="mt-3 text-[#0095f6] text-sm font-semibold">أضف حالة</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
