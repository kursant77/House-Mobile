import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Story } from "@/types/marketing";
import { storiesService } from "@/services/api/stories";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X, Eye, Pause, Play, MoreHorizontal, Heart, Send, Trash2 } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { useStoryStore } from "@/store/storyStore";
import { toast } from "sonner";

interface StoryViewerProps {
    stories: Story[];
    userName: string;
    userAvatar: string;
    onClose: () => void;
    onNextGroup: () => void;
    onPrevGroup: () => void;
    hasNextGroup: boolean;
    hasPrevGroup: boolean;
}

interface StoryView {
    id: string;
    viewer_id: string;
    viewer?: {
        full_name?: string;
        avatar_url?: string;
    };
    viewed_at: string;
}

function formatTimeShort(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);

    if (diffSecs < 60) return `${diffSecs}s`;
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return `${diffWeeks}w`;
}

// Slide animation variants
const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? '100%' : '-100%',
        opacity: 0,
        scale: 0.9,
    }),
    center: {
        x: 0,
        opacity: 1,
        scale: 1,
        zIndex: 1,
    },
    exit: (direction: number) => ({
        x: direction < 0 ? '100%' : '-100%',
        opacity: 0,
        scale: 0.9,
        zIndex: 0,
    }),
};

export default function StoryViewer({
    stories,
    userName,
    userAvatar,
    onClose,
    onNextGroup,
    onPrevGroup,
    hasNextGroup,
    hasPrevGroup
}: StoryViewerProps) {
    const navigate = useNavigate();
    const { user: currentUser } = useAuthStore();
    const { removeStory } = useStoryStore();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [direction, setDirection] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);

    const [insightsMode, setInsightsMode] = useState(false);
    const [viewers, setViewers] = useState<StoryView[]>([]);
    const [isLoadingViewers, setIsLoadingViewers] = useState(false);

    const currentStory = stories[currentIndex];
    const prevStory = stories[currentIndex - 1];
    const nextStory = stories[currentIndex + 1];
    const STORY_DURATION = currentStory?.media_type === 'video' ? 15000 : 5000;
    const isOwner = currentStory?.user_id === currentUser?.id;

    // Hide bottom nav
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        const bottomNav = document.querySelector('[data-bottom-nav]') as HTMLElement;
        if (bottomNav) {
            bottomNav.style.setProperty('display', 'none', 'important');
            bottomNav.style.setProperty('visibility', 'hidden', 'important');
        }
        return () => {
            document.body.style.overflow = '';
            if (bottomNav) {
                bottomNav.style.removeProperty('display');
                bottomNav.style.removeProperty('visibility');
            }
        };
    }, []);

    useEffect(() => {
        if (isOwner && insightsMode && currentStory) {
            setIsLoadingViewers(true);
            storiesService.getStoryViewers(currentStory.id)
                .then(data => setViewers(data))
                .finally(() => setIsLoadingViewers(false));
        }
    }, [isOwner, insightsMode, currentStory?.id, currentIndex]);

    const goToNext = useCallback(() => {
        setDirection(1);
        if (currentIndex < stories.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setProgress(0);
            setIsLoading(true);
        } else if (hasNextGroup) {
            onNextGroup();
        } else {
            onClose();
        }
    }, [currentIndex, stories.length, hasNextGroup, onNextGroup, onClose]);

    const goToPrev = useCallback(() => {
        setDirection(-1);
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            setProgress(0);
            setIsLoading(true);
        } else if (hasPrevGroup) {
            onPrevGroup();
        }
    }, [currentIndex, hasPrevGroup, onPrevGroup]);

    useEffect(() => {
        if (currentStory && !currentStory.is_viewed) {
            storiesService.viewStory(currentStory.id);
        }
    }, [currentStory]);

    useEffect(() => {
        setCurrentIndex(0);
        setProgress(0);
        setInsightsMode(false);
        setIsLoading(true);
        setDirection(0);
    }, [stories]);

    useEffect(() => {
        if (progress >= 100) goToNext();
    }, [progress, goToNext]);

    useEffect(() => {
        if (isPaused || insightsMode || isLoading) return;
        const interval = setInterval(() => {
            setProgress(prev => Math.min(prev + (100 / (STORY_DURATION / 100)), 100));
        }, 100);
        return () => clearInterval(interval);
    }, [isPaused, insightsMode, isLoading, STORY_DURATION]);

    useEffect(() => {
        if (currentIndex >= stories.length && stories.length > 0) {
            setCurrentIndex(stories.length - 1);
        }
    }, [stories.length, currentIndex]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (insightsMode) { setInsightsMode(false); setIsPaused(false); }
                else onClose();
            }
            if (!insightsMode) {
                if (e.key === 'ArrowRight') goToNext();
                if (e.key === 'ArrowLeft') goToPrev();
                if (e.key === ' ') { e.preventDefault(); setIsPaused(p => !p); }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [goToNext, goToPrev, onClose, insightsMode]);

    const pressTimer = useRef<NodeJS.Timeout | null>(null);
    const isPressing = useRef(false);
    const startTime = useRef<number>(0);

    const handlePressStart = useCallback(() => {
        if (insightsMode) return;
        isPressing.current = true;
        startTime.current = Date.now();
        pressTimer.current = setTimeout(() => {
            if (isPressing.current) setIsPaused(true);
        }, 150);
    }, [insightsMode]);

    const handlePressEnd = useCallback((zone: 'left' | 'right') => {
        if (pressTimer.current) clearTimeout(pressTimer.current);
        const duration = Date.now() - startTime.current;
        isPressing.current = false;
        setIsPaused(false);

        if (duration < 200) {
            if (zone === 'left') goToPrev();
            else goToNext();
        }
    }, [goToPrev, goToNext]);

    const handleMediaLoad = () => setIsLoading(false);

    const handleViewerClick = (viewerId: string) => {
        onClose();
        if (viewerId === currentUser?.id) {
            navigate("/profile");
        } else {
            navigate(`/profile/${viewerId}`);
        }
    };

    const handleDeleteStory = async () => {
        if (!currentStory || isDeleting) return;

        const confirmDelete = window.confirm("Haqiqatan ham ushbu hikoyani o'chirmoqchimisiz?");
        if (!confirmDelete) return;

        setIsDeleting(true);
        try {
            await storiesService.deleteStory(currentStory.id);
            toast.success("Hikoya o'chirildi");

            // Remove from global store
            removeStory(currentStory.user_id, currentStory.id);

            // If there's a next story in the current local list, show it
            if (currentIndex < stories.length - 1) {
                // The current index will naturally point to the next story 
                // because the list shrinks. However, the store update handles 
                // the main list. Local 'stories' prop might not update immediately 
                // unless parent re-renders. 
                // But GlobalStoryViewer uses selection from store.
                // If we are at the last story, we should close or move group.
            }
        } catch (error) {
            console.error("Delete story error:", error);
            toast.error("O'chirishda xatolik yuz berdi");
        } finally {
            setIsDeleting(false);
        }
    };

    // Story card for insights mode
    const StoryCard = ({ story, isCurrent, size = 'normal' }: { story: Story; isCurrent: boolean; size?: 'small' | 'normal' }) => {
        const cardWidth = size === 'small' ? 100 : 180;
        const cardHeight = size === 'small' ? 150 : 280;

        return (
            <motion.div
                className={`relative rounded-xl shadow-2xl overflow-hidden shrink-0 transition-shadow ${isCurrent ? 'ring-2 ring-white' : 'opacity-40 scale-95'}`}
                style={{ width: cardWidth, height: cardHeight }}
            >
                {story.media_type === 'video' ? (
                    <video src={story.media_url} className="w-full h-full object-cover" muted />
                ) : (
                    <img src={story.media_url} className="w-full h-full object-cover" alt="" />
                )}
                {isCurrent && (
                    <div className="absolute top-0 left-0 right-0 p-1 bg-black/20">
                        <div className="h-0.5 bg-white/30 rounded-full overflow-hidden">
                            <div className="h-full bg-white rounded-full transition-all duration-100 ease-linear" style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                )}
            </motion.div>
        );
    };

    if (!currentStory) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-black">
            {/* INSIGHTS MODE */}
            <AnimatePresence>
                {insightsMode && (
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        transition={{ type: "spring", damping: 30, stiffness: 300, mass: 0.8 }}
                        className="absolute inset-0 z-[100] flex flex-col bg-black overflow-hidden"
                        onPanEnd={(e, info) => {
                            const { offset, velocity } = info;
                            const isHorizontal = Math.abs(offset.x) > Math.abs(offset.y);

                            if (isHorizontal && (Math.abs(velocity.x) > 300 || Math.abs(offset.x) > 60)) {
                                if (offset.x > 0) goToPrev();
                                else goToNext();
                            } else if (!isHorizontal && (offset.y > 80 || velocity.y > 500)) {
                                onClose();
                            } else if (!isHorizontal && (offset.y < -80 || velocity.y < -500)) {
                                setInsightsMode(false);
                                setIsPaused(false);
                            }
                        }}
                    >
                        {/* Close button */}
                        <div className="absolute top-4 right-4 z-[110]">
                            <button onClick={onClose} className="p-2 text-white/70 hover:text-white active:scale-90 transition-all">
                                <X className="w-7 h-7" />
                            </button>
                        </div>

                        {/* Carousel Section */}
                        <div className="pt-12 pb-2 shrink-0">
                            <div className="flex items-center gap-2 px-4 mb-4">
                                <Avatar className="w-8 h-8 ring-2 ring-white/10">
                                    <AvatarImage src={userAvatar} className="object-cover" />
                                    <AvatarFallback className="bg-neutral-800 text-white text-[10px]">
                                        {userName.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col -space-y-0.5">
                                    <span className="text-white text-sm font-semibold">{userName.toLowerCase().replace(/\s+/g, '')}</span>
                                    <span className="text-white/40 text-[10px] font-medium tracking-wide">{formatTimeShort(new Date(currentStory.created_at))}</span>
                                </div>
                            </div>

                            <div className="relative flex items-center justify-center h-[300px] gap-4 px-4 overflow-visible">
                                <AnimatePresence mode="popLayout" custom={direction}>
                                    {prevStory && (
                                        <motion.div
                                            key={`prev-${prevStory.id}`}
                                            initial={{ x: -160, opacity: 0, scale: 0.7 }}
                                            animate={{ x: -140, opacity: 0.3, scale: 0.8 }}
                                            exit={{ x: -200, opacity: 0 }}
                                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                            onClick={goToPrev}
                                            className="absolute cursor-pointer p-2"
                                        >
                                            <StoryCard story={prevStory} isCurrent={false} size="small" />
                                        </motion.div>
                                    )}

                                    <motion.div
                                        key={`current-${currentStory.id}`}
                                        initial={{ x: direction > 0 ? 160 : -160, opacity: 0, scale: 0.8 }}
                                        animate={{ x: 0, opacity: 1, scale: 1 }}
                                        exit={{ x: direction > 0 ? -160 : 160, opacity: 0, scale: 0.8 }}
                                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                                        onClick={() => { setInsightsMode(false); setIsPaused(false); }}
                                        className="relative z-10 cursor-pointer p-2"
                                    >
                                        <StoryCard story={currentStory} isCurrent={true} size="normal" />
                                    </motion.div>

                                    {nextStory && (
                                        <motion.div
                                            key={`next-${nextStory.id}`}
                                            initial={{ x: 160, opacity: 0, scale: 0.7 }}
                                            animate={{ x: 140, opacity: 0.3, scale: 0.8 }}
                                            exit={{ x: 200, opacity: 0 }}
                                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                            onClick={goToNext}
                                            className="absolute cursor-pointer p-2"
                                        >
                                            <StoryCard story={nextStory} isCurrent={false} size="small" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="flex justify-center gap-1 mt-4">
                                {stories.map((_, i) => (
                                    <div key={i} className={`h-1 rounded-full transition-all duration-300 ${i === currentIndex ? 'bg-white w-4' : 'bg-white/20 w-1'}`} />
                                ))}
                            </div>
                        </div>

                        {/* Viewers bar */}
                        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 backdrop-blur-sm bg-black/20">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-white/5 rounded-full">
                                    <Eye className="w-5 h-5 text-white/80" />
                                </div>
                                <span className="text-white text-sm font-bold">{currentStory.view_count || 0} ko'rishlar</span>
                            </div>
                            <button
                                onClick={handleDeleteStory}
                                disabled={isDeleting}
                                className="p-2.5 text-red-500/80 hover:bg-red-500/10 active:scale-90 rounded-full transition-all disabled:opacity-50"
                            >
                                <Trash2 className={`w-5.5 h-5.5 ${isDeleting ? 'animate-pulse' : ''}`} />
                            </button>
                        </div>

                        {/* Viewers list */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0a0a0a]">
                            {isLoadingViewers ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-3">
                                    <div className="w-6 h-6 border-2 border-white/10 border-t-white rounded-full animate-spin" />
                                </div>
                            ) : viewers.length > 0 ? (
                                <div className="px-4 pb-12">
                                    {viewers.map((view) => (
                                        <div
                                            key={view.id}
                                            className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors px-2 rounded-xl cursor-pointer active:scale-[0.98]"
                                            onClick={() => handleViewerClick(view.viewer_id)}
                                        >
                                            <Avatar className="w-11 h-11 ring-1 ring-white/10">
                                                <AvatarImage src={view.viewer?.avatar_url} className="object-cover" />
                                                <AvatarFallback className="bg-neutral-800 text-white font-bold">{view.viewer?.full_name?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <p className="text-white text-[13px] font-semibold">{view.viewer?.full_name || "House User"}</p>
                                                <p className="text-white/40 text-[11px]">{formatTimeShort(new Date(view.viewed_at))} ko'rdi</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center py-20 px-8 text-center opacity-40">
                                    <div className="p-4 bg-white/5 rounded-3xl mb-4 rotate-12">
                                        <Eye className="w-10 h-10" />
                                    </div>
                                    <p className="text-white text-sm font-semibold mb-1">Hali ko'rilmagan</p>
                                    <p className="text-white/30 text-xs">Hikoyangizni ko'rganlar shu yerda paydo bo'ladi</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* NORMAL MODE with swipe */}
            {!insightsMode && (
                <motion.div
                    className="relative w-full h-full max-w-[420px] mx-auto overflow-hidden bg-black"
                    drag="y"
                    dragConstraints={{ top: 0, bottom: 0 }}
                    dragElastic={0.4}
                    onDragEnd={(e, info) => {
                        if (info.offset.y > 100 || info.velocity.y > 500) onClose();
                    }}
                    onPanEnd={(e, info) => {
                        const isHorizontal = Math.abs(info.offset.x) > Math.abs(info.offset.y);
                        if (isHorizontal && (Math.abs(info.offset.x) > 60 || Math.abs(info.velocity.x) > 300)) {
                            if (info.offset.x > 0) goToPrev();
                            else goToNext();
                        } else if (!isHorizontal && info.offset.y < -80 && isOwner) {
                            setInsightsMode(true);
                            setIsPaused(true);
                        }
                    }}
                >
                    {/* Progress bars */}
                    <div className="absolute top-0 left-0 right-0 z-50 flex gap-[2px] px-2 pt-2 pb-1 bg-gradient-to-b from-black/60 to-transparent">
                        {stories.map((_, i) => (
                            <div key={i} className="flex-1 h-[2px] bg-white/20 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-white rounded-full"
                                    animate={{ width: i === currentIndex ? `${progress}%` : i < currentIndex ? '100%' : '0%' }}
                                    transition={{ duration: 0.1, ease: "linear" }}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Header */}
                    <div className="absolute top-5 left-0 right-0 z-50 flex items-center justify-between px-3">
                        <div className="flex items-center gap-2.5">
                            <Avatar className="w-8 h-8 ring-2 ring-white/10 shadow-lg">
                                <AvatarImage src={userAvatar} className="object-cover" />
                                <AvatarFallback className="bg-neutral-800 text-white text-[10px]">{userName.charAt(0).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col -space-y-0.5">
                                <span className="text-white text-[13px] font-bold drop-shadow-md">{userName.toLowerCase().replace(/\s+/g, '')}</span>
                                <span className="text-white/70 text-[10px] font-medium drop-shadow-sm">{formatTimeShort(new Date(currentStory.created_at))}</span>
                            </div>
                        </div>
                        <div className="flex items-center">
                            <button onClick={() => setIsPaused(p => !p)} className="p-2 text-white/90 active:scale-90 transition-transform">
                                {isPaused ? <Play className="w-6 h-6 fill-white" /> : <Pause className="w-6 h-6 fill-white" />}
                            </button>
                            <button onClick={onClose} className="p-2 text-white/90 active:scale-90 transition-transform"><X className="w-6 h-6 shadow-xl" /></button>
                        </div>
                    </div>

                    {/* Loading */}
                    {isLoading && (
                        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                            <div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin shadow-2xl" />
                        </div>
                    )}

                    {/* Story Media with slide animation */}
                    <AnimatePresence initial={false} custom={direction} mode="popLayout">
                        <motion.div
                            key={currentStory.id}
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{
                                x: { type: "spring", stiffness: 300, damping: 30, mass: 1 },
                                opacity: { duration: 0.25 },
                                scale: { duration: 0.25 }
                            }}
                            className="absolute inset-0 bg-black"
                        >
                            {currentStory.media_type === 'video' ? (
                                <video
                                    key={currentStory.id}
                                    src={currentStory.media_url}
                                    className="w-full h-full object-cover"
                                    autoPlay={!isPaused}
                                    muted
                                    playsInline
                                    onLoadedData={handleMediaLoad}
                                    onEnded={goToNext}
                                />
                            ) : (
                                <img
                                    src={currentStory.media_url}
                                    className="w-full h-full object-cover"
                                    onLoad={handleMediaLoad}
                                    alt=""
                                />
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {/* Touch zones */}
                    {!isLoading && !insightsMode && (
                        <div className="absolute inset-0 z-30 flex pointer-events-auto">
                            <div
                                className="w-1/3 h-full"
                                onMouseDown={handlePressStart}
                                onMouseUp={() => handlePressEnd('left')}
                                onTouchStart={handlePressStart}
                                onTouchEnd={() => handlePressEnd('left')}
                            />
                            <div className="w-1/3 h-full" onMouseDown={handlePressStart} onMouseUp={() => setIsPaused(p => !p)} />
                            <div
                                className="w-1/3 h-full"
                                onMouseDown={handlePressStart}
                                onMouseUp={() => handlePressEnd('right')}
                                onTouchStart={handlePressStart}
                                onTouchEnd={() => handlePressEnd('right')}
                            />
                        </div>
                    )}

                    {/* Footer */}
                    {!isLoading && (
                        <div className="absolute bottom-0 left-0 right-0 z-40 p-4 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-auto pb-8">
                            {isOwner ? (
                                <div
                                    className="flex flex-col items-center cursor-pointer active:scale-95 transition-all group"
                                    onClick={() => { setInsightsMode(true); setIsPaused(true); }}
                                >
                                    <div className="flex flex-col items-center py-2 px-6 rounded-2xl hover:bg-white/10 transition-colors">
                                        <div className="flex items-center gap-1.5 mb-0.5">
                                            <Eye className="w-5 h-5 text-white shadow-lg" />
                                            <span className="text-white text-sm font-bold shadow-sm">{currentStory.view_count || 0}</span>
                                        </div>
                                        <span className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] group-hover:text-white/60 transition-colors">Insights</span>
                                        <div className="mt-1 opacity-40 group-hover:opacity-100 transition-opacity">
                                            <svg className="w-4 h-4 text-white animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3 px-2">
                                    <div className="flex-1 relative">
                                        <input
                                            type="text"
                                            placeholder="Xabar yuboring..."
                                            className="w-full bg-white/5 border border-white/20 rounded-full py-2.5 px-5 text-white text-sm placeholder:text-white/40 focus:outline-none focus:border-white/40 backdrop-blur-md transition-all shadow-xl"
                                            readOnly
                                        />
                                    </div>
                                    <button className="p-2 text-white/90 active:scale-75 transition-transform"><Heart className="w-6 h-6" /></button>
                                    <button className="p-2 text-white/90 active:scale-75 transition-transform"><Send className="w-6 h-6" /></button>
                                </div>
                            )}
                        </div>
                    )}
                </motion.div>
            )}

            {/* Desktop arrows */}
            {!insightsMode && (
                <div className="hidden md:block pointer-events-none">
                    {hasPrevGroup && (
                        <button onClick={onPrevGroup} className="absolute left-8 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/20 active:scale-90 transition-all pointer-events-auto">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M15 19l-7-7 7-7" /></svg>
                        </button>
                    )}
                    {hasNextGroup && (
                        <button onClick={onNextGroup} className="absolute right-8 top-1/2 -translate-y-1/2 z-50 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-white/20 active:scale-90 transition-all pointer-events-auto">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" /></svg>
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
