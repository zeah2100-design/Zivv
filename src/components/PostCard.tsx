'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Post {
  id: number;
  userId: number;
  type: string;
  content: string | null;
  mediaUrl: string | null;
  thumbnailUrl: string | null;
  views: number | null;
  createdAt: Date | string | null;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  isGoldMember: boolean | null;
  likesCount: number;
  commentsCount: number;
}

interface PostCardProps {
  post: Post;
  onUserClick?: (userId: number) => void;
}

export default function PostCard({ post, onUserClick }: PostCardProps) {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [likesCount, setLikesCount] = useState(Number(post.likesCount) || 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Array<{ id: number; content: string; username: string; avatarUrl: string | null }>>([]);
  const [comment, setComment] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  const handleLike = async () => {
    if (!user) return;
    
    const newLiked = !isLiked;
    setIsLiked(newLiked);
    setLikesCount(prev => newLiked ? prev + 1 : prev - 1);
    
    try {
      await fetch(`/api/posts/${post.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
    } catch (error) {
      setIsLiked(!newLiked);
      setLikesCount(prev => newLiked ? prev - 1 : prev + 1);
    }
  };

  const loadComments = async () => {
    setIsLoadingComments(true);
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`);
      const data = await res.json();
      setComments(data.comments || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const toggleComments = () => {
    if (!showComments) {
      loadComments();
    }
    setShowComments(!showComments);
  };

  const addComment = async () => {
    if (!user || !comment.trim()) return;
    
    try {
      const res = await fetch(`/api/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, content: comment }),
      });
      const data = await res.json();
      
      if (data.success) {
        setComments(prev => [{
          id: data.comment.id,
          content: comment,
          username: user.username,
          avatarUrl: user.avatarUrl,
        }, ...prev]);
        setComment('');
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return '';
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: false, locale: ar });
    } catch {
      return '';
    }
  };

  return (
    <article className="post-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onUserClick?.(post.userId)}>
          <div className="w-8 h-8 rounded-full overflow-hidden bg-[#262626]">
            {post.avatarUrl ? (
              <img src={post.avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs font-semibold">{post.username?.[0]?.toUpperCase()}</div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm font-semibold">{post.username}</span>
            {post.isGoldMember && <span className="text-[#0095f6] text-xs">✓</span>}
          </div>
        </div>
        <button className="p-1"><MoreHorizontal size={20} className="text-white" /></button>
      </div>

      {/* Media */}
      {post.mediaUrl && (
        <div className="relative bg-black" onDoubleClick={handleLike}>
          {post.type === 'video' ? (
            <video src={post.mediaUrl} className="w-full aspect-square object-cover" controls playsInline />
          ) : (
            <img src={post.mediaUrl} alt="" className="w-full aspect-square object-cover" />
          )}
        </div>
      )}

      {/* Actions */}
      <div className="px-4 pt-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <button onClick={handleLike} className="transition-transform active:scale-125">
              <Heart size={24} className={isLiked ? 'text-[#ed4956] fill-[#ed4956]' : 'text-white'} />
            </button>
            <button onClick={toggleComments}>
              <MessageCircle size={24} className="text-white" />
            </button>
            <button><Send size={24} className="text-white" /></button>
          </div>
          <button onClick={() => setIsSaved(!isSaved)}>
            <Bookmark size={24} className={`text-white ${isSaved ? 'fill-white' : ''}`} />
          </button>
        </div>

        {/* Likes */}
        {likesCount > 0 && (
          <p className="text-sm font-semibold mb-1">{likesCount.toLocaleString('ar')} إعجاب</p>
        )}

        {/* Caption */}
        {post.content && (
          <p className="text-sm mb-1">
            <span className="font-semibold ml-1">{post.username}</span>
            {post.content}
          </p>
        )}

        {/* Comments link */}
        {Number(post.commentsCount) > 0 && !showComments && (
          <button onClick={toggleComments} className="text-sm text-[#737373] mb-1">
            عرض جميع التعليقات ({post.commentsCount})
          </button>
        )}

        {/* Comments list */}
        {showComments && (
          <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
            {isLoadingComments ? (
              <p className="text-xs text-[#737373]">جاري التحميل...</p>
            ) : comments.length > 0 ? (
              comments.map(c => (
                <p key={c.id} className="text-sm">
                  <span className="font-semibold ml-1">{c.username}</span>
                  {c.content}
                </p>
              ))
            ) : (
              <p className="text-xs text-[#737373]">لا توجد تعليقات</p>
            )}
          </div>
        )}

        {/* Time */}
        <p className="text-[10px] text-[#737373] uppercase tracking-wide mt-1">
          منذ {formatDate(post.createdAt)}
        </p>
      </div>

      {/* Add comment */}
      <div className="px-4 py-3 border-t border-[#262626] mt-2">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addComment()}
            placeholder="أضف تعليقاً..."
            className="flex-1 bg-transparent text-sm placeholder:text-[#737373] outline-none"
          />
          {comment.trim() && (
            <button onClick={addComment} className="text-[#0095f6] text-sm font-semibold">نشر</button>
          )}
        </div>
      </div>
    </article>
  );
}
