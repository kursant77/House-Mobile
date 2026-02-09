import { useStoryStore } from "@/store/storyStore";
import StoryViewer from "./StoryViewer";
import StoryCreator from "./StoryCreator";
import { AnimatePresence, motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

export default function GlobalStoryViewer() {
    const {
        isOpen,
        storyGroups,
        selectedGroupIndex,
        closeStories,
        nextGroup,
        prevGroup,
        isCreatorOpen,
        closeCreator
    } = useStoryStore();

    const queryClient = useQueryClient();

    const currentGroup = selectedGroupIndex !== null ? storyGroups[selectedGroupIndex] : null;
    const shouldShowViewer = isOpen && currentGroup !== null;

    return (
        <>
            {/* Story Viewer - Instagram Style */}
            <AnimatePresence>
                {shouldShowViewer && (
                    <motion.div
                        key={`story-viewer-${selectedGroupIndex}`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="fixed inset-0 z-[100]"
                    >
                        <StoryViewer
                            stories={currentGroup.stories}
                            userName={currentGroup.userName}
                            userAvatar={currentGroup.userAvatar}
                            onClose={closeStories}
                            onNextGroup={nextGroup}
                            onPrevGroup={prevGroup}
                            hasNextGroup={selectedGroupIndex !== null && selectedGroupIndex < storyGroups.length - 1}
                            hasPrevGroup={selectedGroupIndex !== null && selectedGroupIndex > 0}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Story Creator */}
            <StoryCreator
                isOpen={isCreatorOpen}
                onClose={closeCreator}
                onSuccess={() => {
                    queryClient.invalidateQueries({ queryKey: ["stories"] });
                }}
            />
        </>
    );
}
