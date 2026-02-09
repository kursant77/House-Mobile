import { useQuery } from "@tanstack/react-query";
import { badgesService } from "@/services/api/badges";
import { Badge as BadgeType } from "@/types/marketing";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface UserBadgesProps {
    userId: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export default function UserBadges({
    userId,
    className,
    size = 'md'
}: UserBadgesProps) {
    const { data: userBadges = [], isLoading } = useQuery({
        queryKey: ["user-badges", userId],
        queryFn: () => badgesService.getUserBadges(userId),
        enabled: !!userId,
        staleTime: 1000 * 60 * 10, // 10 minutes cache
    });

    if (isLoading || userBadges.length === 0) return null;

    const sizeClasses = {
        sm: 'h-6 w-6 text-xs',
        md: 'h-8 w-8 text-base',
        lg: 'h-10 w-10 text-xl'
    };

    return (
        <TooltipProvider>
            <div className={cn("flex flex-wrap gap-2", className)}>
                {userBadges.map((userBadge) => {
                    const badge = userBadge.badge;
                    if (!badge) return null;

                    return (
                        <Tooltip key={badge.id}>
                            <TooltipTrigger asChild>
                                <div
                                    className={cn(
                                        "rounded-full flex items-center justify-center cursor-help transition-transform hover:scale-110 shadow-sm border",
                                        sizeClasses[size]
                                    )}
                                    style={{
                                        backgroundColor: badge.color + '15',
                                        borderColor: badge.color + '40'
                                    }}
                                >
                                    <span style={{ color: badge.color }}>
                                        {badge.icon_url || '🏆'}
                                    </span>
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <div className="space-y-1">
                                    <p className="font-bold">{badge.name}</p>
                                    {badge.description && (
                                        <p className="text-xs text-muted-foreground max-w-[200px]">
                                            {badge.description}
                                        </p>
                                    )}
                                    <p className="text-[10px] opacity-70 italic">
                                        Berildi: {new Date(userBadge.awarded_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </TooltipContent>
                        </Tooltip>
                    );
                })}
            </div>
        </TooltipProvider>
    );
}
