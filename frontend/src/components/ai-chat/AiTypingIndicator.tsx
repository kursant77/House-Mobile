/**
 * AI Typing Indicator — ChatGPT-style fade dots
 */

import { motion } from "framer-motion";

export const AiTypingIndicator = () => {
    return (
        <div className="flex items-center gap-1.5 py-1">
            {[0, 1, 2].map((i) => (
                <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-white/40"
                    animate={{
                        opacity: [0.3, 1, 0.3],
                        scale: [0.85, 1, 0.85],
                    }}
                    transition={{
                        duration: 1,
                        repeat: Infinity,
                        delay: i * 0.2,
                        ease: "easeInOut",
                    }}
                />
            ))}
        </div>
    );
};
