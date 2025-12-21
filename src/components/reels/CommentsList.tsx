import { Button } from "@/components/ui/button";
import { Heart, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function CommentsList({
    className,
    header,
    onClose
}: {
    className?: string;
    header?: React.ReactNode;
    onClose?: () => void;
}) {
    const [commentText, setCommentText] = useState("");
    const [comments, setComments] = useState([
        { id: 1, user: "alex_tech", avatar: "AT", text: "This looks insane! 🔥 Need to upgrade.", likes: 24, time: "2h" },
        { id: 2, user: "sarah_mobile", avatar: "SM", text: "Is the camera really that good?", likes: 12, time: "5h" },
        { id: 3, user: "john_doe", avatar: "JD", text: "Price is a bit high though...", likes: 5, time: "1d" },
        { id: 4, user: "gadget_guy", avatar: "GG", text: "Love the titanium finish! 😍", likes: 89, time: "1d" },
        { id: 5, user: "tech_reviewer_uz", avatar: "TR", text: "O'zbekistonga qachon keladi?", likes: 45, time: "2d" },
    ]);

    const handleSend = () => {
        if (!commentText.trim()) return;
        const newComment = {
            id: Date.now(),
            user: "you",
            avatar: "Y",
            text: commentText,
            likes: 0,
            time: "now",
        };
        setComments([newComment, ...comments]);
        setCommentText("");
    };

    return (
        <div className={cn("flex flex-col h-full bg-zinc-950 text-white", className)}>
            {header}

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-xs font-bold shrink-0">
                            {comment.avatar}
                        </div>
                        <div className="flex-1 space-y-1">
                            <div className="flex items-baseline gap-2">
                                <span className="text-xs font-bold text-zinc-300">{comment.user}</span>
                                <span className="text-[10px] text-zinc-500">{comment.time}</span>
                            </div>
                            <p className="text-sm text-zinc-200 leading-relaxed">{comment.text}</p>
                            <button className="text-[10px] font-semibold text-zinc-500 mt-1 hover:text-zinc-300">Reply</button>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <Heart className="h-4 w-4 text-zinc-500 hover:text-red-500 cursor-pointer" />
                            <span className="text-[10px] text-zinc-500">{comment.likes}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-white/10 bg-zinc-950 pb-8 md:pb-3 shrink-0">
                <div className="flex items-center gap-2 bg-zinc-900 rounded-full px-4 py-2 border border-zinc-800 focus-within:border-zinc-700">
                    <div className="h-6 w-6 rounded-full bg-zinc-700 flex items-center justify-center text-[10px]">Y</div>
                    <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Add a comment..."
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-600"
                    />
                    <button
                        onClick={handleSend}
                        className={cn("text-blue-500 font-bold text-sm transition-opacity", !commentText.trim() && "opacity-50 pointer-events-none")}
                    >
                        Post
                    </button>
                </div>
            </div>
        </div>
    );
}
