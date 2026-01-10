import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
    className?: string;
    size?: number;
}

export const VerifiedBadge = ({ className, size = 16 }: VerifiedBadgeProps) => {
    return (
        <div className={cn("inline-flex items-center justify-center text-amber-500 shrink-0", className)}>
            <svg
                viewBox="0 0 24 24"
                width={size}
                height={size}
                fill="currentColor"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="drop-shadow-[0_0_2px_rgba(245,158,11,0.5)]"
            >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
                <path d="M9 11l2 2 4-4" stroke="white" fill="none" strokeWidth="2.5" />
            </svg>
        </div>
    );
};
