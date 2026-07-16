'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import PostCard from '@/components/PostCard';
import StoriesBar from '@/components/StoriesBar';
import StoryViewer from '@/components/StoryViewer';
import AdBanner from '@/components/AdBanner';

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

interface StoryGroup {
  user: {
    id: number;
    username: string;
    displayName: string | null;
    avatarUrl: string | null;
    isGoldMember: boolean | null;
  };
  stories: Array<{
    id: number;
    mediaUrl: string;
    mediaType: string;
    caption: string | null;
    views: number | null;
    createdAt: Date | string | null;
  }>;
}

interface HomePageProps {
  onNavigate: (page: string, data?: Record<string, unknown>) => void;
}

export default function HomePage({ onNavigate }: HomePageProps) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showStoryViewer, setShowStoryViewer] = useState(false);
  const [storyViewerIndex, setStoryViewerIndex] = useState(0);

  useEffect(() => {
    loadPosts();
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      const res = await fetch('/api/stories');
      const data = await res.json();
      setStoryGroups(data.stories || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadPosts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/posts?type=feed');
      const data = await res.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserClick = (userId: number) => {
    onNavigate('profile', { viewUserId: userId });
  };

  const handleOpenStory = (groupIndex: number) => {
    setStoryViewerIndex(groupIndex);
    setShowStoryViewer(true);
  };

  if (showStoryViewer && storyGroups.length > 0) {
    return (
      <StoryViewer
        storyGroups={storyGroups}
        initialGroupIndex={storyViewerIndex}
        onClose={() => setShowStoryViewer(false)}
      />
    );
  }

  return (
    <div className="max-w-[470px] mx-auto pt-[82px] md:pt-0 pb-[60px] md:pb-0">
      {/* Stories */}
      {storyGroups.length > 0 && (
        <div className="border-b border-[#262626]">
          <StoriesBar
            storyGroups={storyGroups}
            onOpenStory={handleOpenStory}
            onCreateStory={() => onNavigate('stories')}
          />
        </div>
      )}

      {/* Posts */}
      <div>
        {isLoading ? (
          <div className="space-y-4 p-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full skeleton" />
                  <div className="h-3 w-24 skeleton" />
                </div>
                <div className="aspect-square w-full skeleton" />
              </div>
            ))}
          </div>
        ) : posts.length > 0 ? (
          posts.map((post, index) => (
            <div key={post.id}>
              <PostCard post={post} onUserClick={handleUserClick} />
              {/* Show ad after every 3 posts */}
              {(index + 1) % 3 === 0 && (
                <div className="py-2 px-4">
                  <AdBanner slot="HOME_FEED" format="horizontal" />
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-16 px-4">
            <p className="text-[#a0a0a0] text-sm">لا توجد منشورات بعد</p>
            <button onClick={() => onNavigate('create')} className="mt-4 text-[#0095f6] text-sm font-semibold">
              شارك أول منشور
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
