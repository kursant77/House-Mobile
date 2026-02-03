import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
    className?: string;
    size?: number;
    showAnimation?: boolean;
}

export const VerifiedBadge = ({ className, size = 16, showAnimation = true }: VerifiedBadgeProps) => {
    return (
        <div className={cn(
            "relative inline-flex items-center justify-center shrink-0",
            className
        )}>
            {/* Main Badge Container with Premium Blue Color */}
            <div
                className={cn(
                    "relative flex items-center justify-center rounded-full overflow-hidden",
                    showAnimation && "animate-in fade-in zoom-in duration-500"
                )}
                style={{ width: size, height: size }}
            >
                {/* Background SVG representing the Telegram-style verification shape */}
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className={cn(
                        "w-full h-full text-[#3897f0]"
                    )}
                >
                    <path
                        d="M12 2L14.47 4.81L17.7 4.14L18.8 7.37L22 8.47L21.33 11.7L22.14 14.93L18.91 16.03L17.81 19.26L14.58 18.59L12 21.4L9.42 18.59L6.19 19.26L5.09 16.03L1.86 14.93L2.67 11.7L2 8.47L5.23 7.37L6.33 4.14L9.56 4.81L12 2Z"
                        fill="currentColor"
                        className="text-[#3897f0]"
                    />
                </svg>

                {/* Checkmark Icon */}
                <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="absolute w-[60%] h-[60%] text-white"
                >
                    <path
                        d="M17.3334 8L9.99998 15.3333L6.66665 12"
                        stroke="white"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={showAnimation ? "animate-[draw_1s_ease-out_forwards]" : ""}
                        style={{
                            strokeDasharray: 50,
                            strokeDashoffset: showAnimation ? 50 : 0
                        }}
                    />
                </svg>

                {/* Subtle outer glow for premium feel */}
                <div className="absolute inset-0 rounded-full shadow-[inset_0_0_2px_rgba(255,255,255,0.4)] pointer-events-none" />
            </div>

            {/* Pulsing Outer Ring (Subtle) */}
            {showAnimation && (
                <div
                    className="absolute inset-0 rounded-full border border-[#3897f0]/30 animate-ping opacity-20"
                    style={{ width: size, height: size, animationDuration: '3s' }}
                />
            )}

            <style>{`
                @keyframes draw {
                    to {
                        stroke-dashoffset: 0;
                    }
                }
            `}</style>
        </div>
    );
};
