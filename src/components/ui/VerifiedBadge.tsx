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
                        "w-full h-full text-[#3897f0]",
                        showAnimation && "animate-[spin_10s_linear_infinite]"
                    )}
                >
                    <path
                        d="M12 2L14.47 5.07L18.06 4.33L19.29 7.72L22.79 8.59L21.92 12.09L22.79 15.59L19.29 16.46L18.06 19.85L14.47 19.11L12 22.18L9.53 19.11L5.94 19.85L4.71 16.46L1.21 15.59L2.08 12.09L1.21 8.59L4.71 7.72L5.94 4.33L9.53 5.07L12 2Z"
                        fill="currentColor"
                        stroke="currentColor"
                        strokeWidth="1"
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
