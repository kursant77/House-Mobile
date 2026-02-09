import StoriesBar from "@/components/stories/StoriesBar";
import { useAuthStore } from "@/store/authStore";
import { useStoryStore } from "@/store/storyStore";

export function StoriesSection() {
    const { isAuthenticated, user } = useAuthStore();
    const { openCreator } = useStoryStore();

    const handleCreateStory = () => {
        if (!isAuthenticated) {
            window.location.href = '/auth';
            return;
        }

        if (user?.role === 'seller' || user?.role === 'blogger' || user?.role === 'super_admin') {
            openCreator();
        }
    };

    // Check if user can create stories
    const canCreateStory = isAuthenticated &&
        (user?.role === 'seller' || user?.role === 'blogger' || user?.role === 'super_admin');

    return (
        <div className="border-b border-border/50">
            <StoriesBar
                showCreateButton={canCreateStory}
                onCreateStory={handleCreateStory}
                className="max-w-screen-2xl mx-auto"
            />
        </div>
    );
}
