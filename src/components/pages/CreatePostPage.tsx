'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { X, Upload, Camera } from 'lucide-react';

interface CreatePostPageProps {
  onNavigate: (page: string) => void;
}

export default function CreatePostPage({ onNavigate }: CreatePostPageProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [mediaPreview, setMediaPreview] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [postType, setPostType] = useState<'text' | 'image' | 'video'>('text');
  const [urlInput, setUrlInput] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaPreview(URL.createObjectURL(file));
    setPostType(file.type.startsWith('video/') ? 'video' : 'image');
    const reader = new FileReader();
    reader.onload = () => setMediaUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return;
    setMediaUrl(urlInput);
    setMediaPreview(urlInput);
    setPostType('image');
  };

  const handleSubmit = async () => {
    if (!user || (!content.trim() && !mediaUrl)) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, type: postType, content, mediaUrl: mediaUrl || null }),
      });
      const data = await res.json();
      if (data.success) onNavigate('home');
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center pt-[82px] md:pt-0 pb-[60px] md:pb-0 h-full">
        <p className="text-[#737373]">سجل الدخول لنشر محتوى</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col pt-[82px] md:pt-0 pb-[60px] md:pb-0" style={{ height: '100dvh' }}>
      {/* Header */}
      <div className="bg-black border-b border-[#262626] px-4 py-3 flex items-center justify-between flex-shrink-0">
        <button onClick={() => onNavigate('home')} className="text-sm text-[#737373]">إلغاء</button>
        <h1 className="font-semibold">منشور جديد</h1>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || (!content.trim() && !mediaUrl)}
          className="text-[#0095f6] font-semibold text-sm disabled:opacity-30"
        >
          {isSubmitting ? '...' : 'مشاركة'}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* User info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-[#262626]">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-semibold">
                {user.username?.[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <span className="font-semibold text-sm">{user.username}</span>
        </div>

        {/* Text input */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="ماذا يدور في بالك؟"
          rows={3}
          className="w-full bg-transparent text-sm outline-none resize-none placeholder:text-[#737373]"
          autoFocus
        />

        {/* Media Preview */}
        {mediaPreview && (
          <div className="relative rounded-xl overflow-hidden bg-[#262626]">
            <button
              onClick={() => { setMediaPreview(''); setMediaUrl(''); setPostType('text'); setUrlInput(''); }}
              className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-black/70 flex items-center justify-center"
            >
              <X size={18} />
            </button>
            {postType === 'video' ? (
              <video src={mediaPreview} controls className="w-full max-h-72 object-contain" />
            ) : (
              <img src={mediaPreview} alt="" className="w-full max-h-72 object-contain" />
            )}
          </div>
        )}

        {/* Upload options - only show when no media selected */}
        {!mediaPreview && (
          <div className="space-y-3">
            {/* Upload from device */}
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full border border-[#262626] rounded-xl py-10 flex flex-col items-center gap-3 active:bg-[#262626] transition-colors"
            >
              <div className="w-14 h-14 rounded-full bg-[#262626] flex items-center justify-center">
                <Upload size={24} className="text-[#0095f6]" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">رفع من الجهاز</p>
                <p className="text-xs text-[#737373] mt-1">صورة أو فيديو</p>
              </div>
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileSelect}
            />

            {/* Or URL */}
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px bg-[#262626]" />
              <span className="text-xs text-[#737373]">أو أدخل رابط</span>
              <div className="flex-1 h-px bg-[#262626]" />
            </div>

            <div className="flex gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUrlSubmit()}
                placeholder="https://..."
                className="flex-1 bg-[#262626] rounded-lg px-3 py-2.5 text-sm outline-none"
                dir="ltr"
              />
              {urlInput && (
                <button onClick={handleUrlSubmit} className="bg-[#0095f6] px-4 rounded-lg text-sm font-semibold">
                  إضافة
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
