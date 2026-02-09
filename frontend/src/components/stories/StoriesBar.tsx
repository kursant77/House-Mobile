import { useState, useEffect, useRef } from "react";
import { Story } from "@/types/marketing";
import { storiesService } from "@/services/api/stories";
import { featureFlagsService } from "@/services/api/featureFlags";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus } from "lucide-react";
import { useStoryStore } from "@/store/storyStore";

interface StoriesBarProps {
    onCreateStory?: () => void;
    showCreateButton?: boolean;
    className?: string;
}

interface UserStoryGroup {
    userId: string;
    userName: string;
    userAvatar: string;
    stories: Story[];
    hasUnviewed: boolean;
}

export default function StoriesBar({
    onCreateStory,
    showCreateButton = true,
    className
}: StoriesBarProps) {
    const [storyGroups, setStoryGroups] = useState<UserStoryGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFeatureEnabled, setIsFeatureEnabled] = useState(true);
    const { openStories } = useStoryStore();
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadStories();
    }, []);

    async function loadStories() {
        const enabled = await featureFlagsService.isEnabled('stories');
        setIsFeatureEnabled(enabled);

        if (!enabled) {
            setLoading(false);
            return;
        }

        try {
            const storiesMap = await storiesService.getStoriesGroupedByUser();
            const groups: UserStoryGroup[] = [];

            storiesMap.forEach((stories, userId) => {
                if (stories.length > 0) {
                    const firstStory = stories[0];
                    groups.push({
                        userId,
                        userName: firstStory.user?.full_name || 'User',
                        userAvatar: firstStory.user?.avatar_url || '',
                        stories,
                        hasUnviewed: stories.some(s => !s.is_viewed)
                    });
                }
            });

            // Sort: unviewed first
            groups.sort((a, b) => {
                if (a.hasUnviewed && !b.hasUnviewed) return -1;
                if (!a.hasUnviewed && b.hasUnviewed) return 1;
                return new Date(b.stories[0].created_at).getTime() -
                    new Date(a.stories[0].created_at).getTime();
            });

            setStoryGroups(groups);
        } catch (error) {
            console.error("Error loading stories:", error);
        } finally {
            setLoading(false);
        }
    }

    function handleStoryClick(index: number) {
        openStories(storyGroups, index);
    }

    if (!isFeatureEnabled) return null;

    if (loading) {
        return (
            <div className={`flex gap-4 py-3 px-4 overflow-x-auto ${className || ''}`}>
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5 animate-pulse">
                        <div className="w-[62px] h-[62px] rounded-full bg-neutral-200 dark:bg-neutral-800" />
                        <div className="w-12 h-2.5 rounded bg-neutral-200 dark:bg-neutral-800" />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div
            ref={scrollRef}
            className={`flex gap-3 py-3 px-4 overflow-x-auto scrollbar-hide ${className || ''}`}
        >
            {/* Your Story - Instagram Style */}
            {showCreateButton && (
                <button
                    onClick={onCreateStory}
                    className="flex flex-col items-center gap-1 shrink-0 active:opacity-70 transition-opacity"
                >
                    <div className="relative">
                        <div className="w-[62px] h-[62px] rounded-full bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 flex items-center justify-center overflow-hidden">
                            <Plus className="w-7 h-7 text-neutral-500" />
                        </div>
                        {/* Blue plus badge - Instagram style */}
                        <div className="absolute bottom-0 right-0 w-5 h-5 bg-[#0095f6] rounded-full flex items-center justify-center border-2 border-white dark:border-black">
                            <Plus className="w-3 h-3 text-white stroke-[3]" />
                        </div>
                    </div>
                    <span className="text-[11px] text-neutral-900 dark:text-white">
                        Sizning
                    </span>
                </button>
            )}

            {/* Story Items - Instagram Style */}
            {storyGroups.map((group, index) => (
                <button
                    key={group.userId}
                    onClick={() => handleStoryClick(index)}
                    className="flex flex-col items-center gap-1 shrink-0 active:opacity-70 transition-opacity"
                >
                    {/* Avatar with gradient ring */}
                    <div className={`p-[2.5px] rounded-full ${group.hasUnviewed
                            ? 'bg-gradient-to-tr from-[#feda75] via-[#fa7e1e] via-[#d62976] via-[#962fbf] to-[#4f5bd5]'
                            : 'bg-neutral-300 dark:bg-neutral-700'
                        }`}>
                        <div className="p-[2px] rounded-full bg-white dark:bg-black">
                            <Avatar className="w-[56px] h-[56px]">
                                <AvatarImage
                                    src={group.userAvatar}
                                    alt={group.userName}
                                    className="object-cover"
                                />
                                <AvatarFallback className="bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-sm font-medium">
                                    {group.userName.charAt(0).toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                    </div>
                    {/* Username - Instagram style (lowercase, truncated) */}
                    <span className={`text-[11px] w-[64px] text-center truncate ${group.hasUnviewed
                            ? 'text-neutral-900 dark:text-white'
                            : 'text-neutral-500'
                        }`}>
                        {group.userName.split(' ')[0].toLowerCase()}
                    </span>
                </button>
            ))}

            {/* Empty state */}
            {storyGroups.length === 0 && !showCreateButton && (
                <div className="flex items-center justify-center w-full py-4 text-neutral-500 text-sm">
                    Hozircha hikoyalar yo'q
                </div>
            )}
        </div>
    );
}
