import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
    className?: string;
    size?: number;
    showAnimation?: boolean;
}

export const VerifiedBadge = ({ className, size = 16 }: VerifiedBadgeProps) => {
    return (
        <div
            className={cn("inline-flex items-center justify-center shrink-0", className)}
            style={{ width: size, height: size }}
        >
            <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="w-full h-full drop-shadow-[0_0.5px_1px_rgba(0,0,0,0.1)]"
            >
                <path
                    d="M12 1L14.63 3.63L18.25 2.75L19.13 6.38L22.75 7.25L21.88 10.88L23 13.5L19.88 16.13L19 19.75L15.38 18.88L12.75 21.5L10.13 18.88L6.5 19.75L5.63 16.13L2.5 13.5L3.63 10.88L2.75 7.25L6.38 6.38L7.25 2.75L10.88 3.63L12 1Z"
                    fill="#3897f0"
                />
                <path
                    d="M7.5 12.5L10.5 15.5L16.5 9.5"
                    stroke="white"
                    strokeWidth="2.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
        </div>
    );
};
