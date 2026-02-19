/**
 * AI Message Bubble — Exact ChatGPT message style
 * User: right-aligned dark pill, no avatar
 * AI: left-aligned plain text, no bubble, action icons below
 */

import { memo, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, ThumbsUp, ThumbsDown, Share, MoreHorizontal } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { AiTypingIndicator } from "./AiTypingIndicator";
import { AiProductCard } from "./AiProductCard";
import { AiComparisonTable } from "./AiComparisonTable";
import type { AiMessage } from "@/store/aiChatStore";

interface Props {
    message: AiMessage;
}

/** Markdown renderer */
function renderMarkdown(text: string): React.ReactNode[] {
    const lines = text.split("\n");
    const elements: React.ReactNode[] = [];

    lines.forEach((line, lineIdx) => {
        if (!line.trim()) {
            elements.push(<div key={`sp-${lineIdx}`} className="h-2" />);
            return;
        }

        // Bullet list
        if (/^[\s]*[-•]\s/.test(line)) {
            elements.push(
                <div key={lineIdx} className="flex items-start gap-2 pl-2 py-[3px]">
                    <span className="text-white/40 mt-[2px] select-none">•</span>
                    <span className="flex-1">{formatInline(line.replace(/^[\s]*[-•]\s/, ""))}</span>
                </div>
            );
            return;
        }

        // Numbered list
        if (/^[\s]*\d+[.)]\s/.test(line)) {
            const match = line.match(/^[\s]*(\d+)[.)]\s(.*)/);
            if (match) {
                elements.push(
                    <div key={lineIdx} className="flex items-start gap-2 pl-2 py-[3px]">
                        <span className="text-white/50 font-medium min-w-[1.2rem] text-right select-none">{match[1]}.</span>
                        <span className="flex-1">{formatInline(match[2])}</span>
                    </div>
                );
                return;
            }
        }

        // Heading with emoji/icon
        if (/^#+\s/.test(line)) {
            const level = (line.match(/^#+/) || [""])[0].length;
            const headingText = line.replace(/^#+\s/, "");
            elements.push(
                <p key={lineIdx} className={`${level <= 2 ? "text-base font-semibold mt-4 mb-1.5" : "text-[15px] font-semibold mt-3 mb-1"} text-white`}>
                    {formatInline(headingText)}
                </p>
            );
            return;
        }

        // Horizontal rule
        if (/^[-_]{3,}$/.test(line.trim())) {
            elements.push(<hr key={lineIdx} className="border-white/[0.08] my-3" />);
            return;
        }

        // Normal paragraph
        elements.push(
            <p key={lineIdx} className="py-[2px]">
                {formatInline(line)}
            </p>
        );
    });

    return elements;
}

function formatInline(text: string): React.ReactNode {
    const parts: React.ReactNode[] = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
        const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
        const codeMatch = remaining.match(/`([^`]+)`/);
        const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);

        const matches = [
            boldMatch ? { type: "bold", match: boldMatch, index: boldMatch.index! } : null,
            codeMatch ? { type: "code", match: codeMatch, index: codeMatch.index! } : null,
            linkMatch ? { type: "link", match: linkMatch, index: linkMatch.index! } : null,
        ]
            .filter(Boolean)
            .sort((a, b) => a!.index - b!.index);

        if (matches.length === 0) {
            parts.push(remaining);
            break;
        }

        const first = matches[0]!;
        if (first.index > 0) parts.push(remaining.slice(0, first.index));

        if (first.type === "bold") {
            parts.push(<strong key={key++} className="font-semibold text-white">{first.match[1]}</strong>);
        } else if (first.type === "code") {
            parts.push(
                <code key={key++} className="px-1.5 py-0.5 bg-white/[0.08] rounded text-[13px] font-mono text-white/80">
                    {first.match[1]}
                </code>
            );
        } else if (first.type === "link") {
            parts.push(
                <a key={key++} href={first.match[2]} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline underline-offset-2 hover:text-blue-300">
                    {first.match[1]}
                </a>
            );
        }

        remaining = remaining.slice(first.index + first.match[0].length);
    }

    return <>{parts}</>;
}

export const AiMessageBubble = memo(function AiMessageBubble({ message }: Props) {
    const isUser = message.role === "user";
    const isStreaming = message.isStreaming && !message.content;
    const [copied, setCopied] = useState(false);

    const formattedContent = useMemo(() => {
        if (!message.content) return null;
        return renderMarkdown(message.content);
    }, [message.content]);

    const handleCopy = () => {
        navigator.clipboard.writeText(message.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (isUser) {
        /* ── User Message — Right-aligned dark pill ── */
        return (
            <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.15 }}
                className="flex justify-end py-2"
            >
                <div className="max-w-[70%] rounded-3xl bg-[#303030] px-5 py-3 text-[15px] text-white/90 leading-relaxed">
                    {message.content}
                </div>
            </motion.div>
        );
    }

    /* ── AI Message — Left-aligned plain text, no bubble ── */
    return (
        <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.15 }}
            className="group py-3"
        >
            {isStreaming ? (
                <AiTypingIndicator />
            ) : (
                <>
                    {/* Text Content */}
                    <div className="text-[15px] text-white/[0.82] leading-[1.7]">
                        {formattedContent}
                    </div>

                    {/* Products */}
                    {message.products && message.products.length > 0 && (
                        <div className="mt-4">
                            <ScrollArea className="w-full">
                                <div className="flex gap-3 pb-2">
                                    {message.products.map((product, i) => (
                                        <AiProductCard key={i} product={product} index={i} />
                                    ))}
                                </div>
                                <ScrollBar orientation="horizontal" />
                            </ScrollArea>
                        </div>
                    )}

                    {/* Comparison */}
                    {message.comparison && (
                        <div className="mt-4">
                            <AiComparisonTable comparison={message.comparison} />
                        </div>
                    )}

                    {/* Sources */}
                    {message.sources && message.sources.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {message.sources.map((src, i) => {
                                try {
                                    const url = new URL(src);
                                    return (
                                        <a
                                            key={i}
                                            href={src}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs px-2.5 py-1 rounded-full bg-white/[0.05] text-white/40 hover:text-white/60 hover:bg-white/[0.08] transition-colors"
                                        >
                                            {url.hostname}
                                        </a>
                                    );
                                } catch {
                                    return null;
                                }
                            })}
                        </div>
                    )}

                    {/* Action Buttons — ChatGPT style */}
                    <div className="flex items-center gap-0.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            onClick={handleCopy}
                            className="p-1.5 rounded-md hover:bg-white/[0.07] transition-colors text-white/35 hover:text-white/60"
                            title="Nusxa olish"
                        >
                            {copied ? (
                                <Check className="w-4 h-4 text-green-400" />
                            ) : (
                                <Copy className="w-4 h-4" />
                            )}
                        </button>
                        <button className="p-1.5 rounded-md hover:bg-white/[0.07] transition-colors text-white/35 hover:text-white/60" title="Yoqdi">
                            <ThumbsUp className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 rounded-md hover:bg-white/[0.07] transition-colors text-white/35 hover:text-white/60" title="Yoqmadi">
                            <ThumbsDown className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 rounded-md hover:bg-white/[0.07] transition-colors text-white/35 hover:text-white/60" title="Ulashish">
                            <Share className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 rounded-md hover:bg-white/[0.07] transition-colors text-white/35 hover:text-white/60">
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                    </div>
                </>
            )}
        </motion.div>
    );
});
