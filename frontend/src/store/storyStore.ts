import { create } from 'zustand';
import { Story } from '@/types/marketing';

interface UserStoryGroup {
    userId: string;
    userName: string;
    userAvatar: string;
    stories: Story[];
    hasUnviewed: boolean;
}

interface StoryState {
    storyGroups: UserStoryGroup[];
    selectedGroupIndex: number | null;
    isOpen: boolean;
    isCreatorOpen: boolean;

    // Actions
    openStories: (groups: UserStoryGroup[], index: number) => void;
    closeStories: () => void;
    nextGroup: () => void;
    prevGroup: () => void;
    openCreator: () => void;
    closeCreator: () => void;
    removeStory: (userId: string, storyId: string) => void;
}

export const useStoryStore = create<StoryState>((set) => ({
    storyGroups: [],
    selectedGroupIndex: null,
    isOpen: false,
    isCreatorOpen: false,

    openStories: (groups, index) => set({
        storyGroups: groups,
        selectedGroupIndex: index,
        isOpen: true
    }),

    closeStories: () => set({
        isOpen: false,
        selectedGroupIndex: null
    }),

    nextGroup: () => set((state) => {
        if (state.selectedGroupIndex !== null && state.selectedGroupIndex < state.storyGroups.length - 1) {
            return { selectedGroupIndex: state.selectedGroupIndex + 1 };
        }
        return { isOpen: false, selectedGroupIndex: null };
    }),

    prevGroup: () => set((state) => {
        if (state.selectedGroupIndex !== null && state.selectedGroupIndex > 0) {
            return { selectedGroupIndex: state.selectedGroupIndex - 1 };
        }
        return state;
    }),

    openCreator: () => set({ isCreatorOpen: true }),
    closeCreator: () => set({ isCreatorOpen: false }),

    removeStory: (userId, storyId) => set((state) => {
        const newStoryGroups = state.storyGroups.map(group => {
            if (group.userId === userId) {
                return {
                    ...group,
                    stories: group.stories.filter(s => s.id !== storyId)
                };
            }
            return group;
        }).filter(group => group.stories.length > 0);

        // If no story groups left, close the viewer
        if (newStoryGroups.length === 0) {
            return {
                storyGroups: [],
                isOpen: false,
                selectedGroupIndex: null
            };
        }

        // Adjust selectedGroupIndex if needed
        let newIndex = state.selectedGroupIndex;
        if (newIndex !== null && newIndex >= newStoryGroups.length) {
            newIndex = newStoryGroups.length - 1;
        }

        return {
            storyGroups: newStoryGroups,
            selectedGroupIndex: newIndex
        };
    }),
}));
