'use client';

import { useAuth } from '@/contexts/AuthContext';
import { Plus } from '@/components/icons';

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
  }>;
}

interface StoriesBarProps {
  onOpenStory: (groupIndex: number) => void;
  onCreateStory: () => void;
  storyGroups: StoryGroup[];
}

export default function StoriesBar({ onOpenStory, onCreateStory, storyGroups }: StoriesBarProps) {
  const { user } = useAuth();
  const myStory = user ? storyGroups.find(g => g.user.id === user.id) : null;

  return (
    <div className="px-4 py-4">
      <div className="flex gap-4 overflow-x-auto scrollbar-hide">
        {/* My Story */}
        {user && (
          <button
            onClick={myStory ? () => onOpenStory(storyGroups.indexOf(myStory)) : onCreateStory}
            className="flex flex-col items-center gap-1 flex-shrink-0"
          >
            <div className="relative">
              <div className={`w-[62px] h-[62px] rounded-full ${myStory ? 'story-ring' : 'bg-[#262626]'} p-[2px]`}>
                <div className="w-full h-full rounded-full overflow-hidden bg-black">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-lg font-semibold">
                      {user.username?.[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
              {!myStory && (
                <div className="absolute bottom-0 right-0 w-5 h-5 bg-[#0095f6] rounded-full flex items-center justify-center border-2 border-black">
                  <Plus size={12} className="text-white" />
                </div>
              )}
            </div>
            <span className="text-[11px] text-[#a0a0a0] max-w-[66px] truncate">
              قصتك
            </span>
          </button>
        )}

        {/* Other Stories */}
        {storyGroups
          .filter(g => !user || g.user.id !== user.id)
          .map((group) => {
            const idx = storyGroups.indexOf(group);
            return (
              <button
                key={group.user.id}
                onClick={() => onOpenStory(idx)}
                className="flex flex-col items-center gap-1 flex-shrink-0"
              >
                <div className="story-ring w-[66px] h-[66px] rounded-full p-[2px]">
                  <div className="w-full h-full rounded-full overflow-hidden bg-black p-[2px]">
                    <div className="w-full h-full rounded-full overflow-hidden bg-[#262626]">
                      {group.user.avatarUrl ? (
                        <img src={group.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg font-semibold">
                          {group.user.username?.[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-[11px] max-w-[66px] truncate">
                  {group.user.username}
                </span>
              </button>
            );
          })}
      </div>
    </div>
  );
}
