import { useNavigate } from "react-router-dom";
import { Profile } from "@/types/product";

interface StoriesSectionProps {
    stories: Profile[];
    isLoading: boolean;
}

export function StoriesSection({ stories, isLoading }: StoriesSectionProps) {
    const navigate = useNavigate();

    if (!stories.length && !isLoading) return null;

    return (
        <div className="md:hidden space-y-4 pt-2">
            <div className="flex overflow-x-auto gap-3 px-4 pb-2 no-scrollbar" role="list" aria-label="Obunachilar">
                {isLoading ? (
                    [1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-16 w-16 rounded-full bg-muted animate-pulse shrink-0" aria-hidden="true" />
                    ))
                ) : (
                    stories.map((author) => (
                        <div
                            key={author.id}
                            className="flex flex-col items-center gap-1 shrink-0 cursor-pointer"
                            onClick={() => navigate(`/profile/${author.id}`)}
                            role="listitem"
                            tabIndex={0}
                            aria-label={`${author.fullName} profilini ko'rish`}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    navigate(`/profile/${author.id}`);
                                }
                            }}
                        >
                            <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-yellow-400 to-red-500 p-[2px]">
                                <div className="h-full w-full rounded-full bg-background border-2 border-background overflow-hidden relative">
                                    <img
                                        src={author.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${author.fullName}`}
                                        className="h-full w-full object-cover"
                                        alt={author.fullName || 'Foydalanuvchi'}
                                        loading="lazy"
                                    />
                                </div>
                            </div>
                            <span className="text-[10px] text-center w-16 truncate">{author.fullName?.split(' ')[0]}</span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
