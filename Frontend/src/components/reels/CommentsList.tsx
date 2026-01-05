import { Button } from "@/components/ui/button";
import { Heart, X } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { socialService } from "@/services/api/social";
import { useAuthStore } from "@/store/authStore";
import { formatDistanceToNow } from "date-fns";
import { uz } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function CommentsList({
    className,
    header,
    productId,
    onClose
}: {
    className?: string;
    header?: React.ReactNode;
    productId: string;
    onClose?: () => void;
}) {
    const { user: currentUser } = useAuthStore();
    const [commentText, setCommentText] = useState("");
    const [comments, setComments] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchComments = async () => {
            setIsLoading(true);
            try {
                const data = await socialService.getComments(productId);
                setComments(data);
            } catch (error) {
                console.error("Failed to fetch comments:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (productId) {
            fetchComments();
        }
    }, [productId]);

    const handleSend = async () => {
        if (!commentText.trim()) return;
        if (!currentUser) {
            toast.error("Iltimos, avval tizimga kiring");
            return;
        }

        try {
            const newComment = await socialService.addComment(productId, commentText);
            setComments([newComment, ...comments]);
            setCommentText("");
        } catch (error) {
            toast.error("Izoh qoldirishda xatolik yuz berdi");
        }
    };

    return (
        <div className={cn("flex flex-col h-full bg-zinc-950 text-white", className)}>
            {header}

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                {isLoading ? (
                    <div className="h-full flex flex-col items-center justify-center gap-2 text-zinc-500">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <p className="text-xs">Yuklanmoqda...</p>
                    </div>
                ) : comments.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-500 p-8 text-center bg-zinc-950">
                        <p className="text-sm font-medium">Hali izohlar yo'q</p>
                        <p className="text-xs mt-1">Birinchi bo'lib izoh qoldiring!</p>
                    </div>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                            <div className="h-8 w-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden">
                                {comment.user?.avatarUrl ? (
                                    <img src={comment.user.avatarUrl} alt="" className="h-full w-full object-cover" />
                                ) : (
                                    comment.user?.fullName?.charAt(0) || "U"
                                )}
                            </div>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-xs font-bold text-zinc-300">
                                        {comment.user?.fullName || "Foydalanuvchi"}
                                    </span>
                                    <span className="text-[10px] text-zinc-500">
                                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: uz })}
                                    </span>
                                </div>
                                <p className="text-sm text-zinc-200 leading-relaxed">{comment.text}</p>
                                <button className="text-[10px] font-semibold text-zinc-500 mt-1 hover:text-zinc-300">Reply</button>
                            </div>
                            <div className="flex flex-col items-center gap-1">
                                <Heart className="h-4 w-4 text-zinc-500 hover:text-red-500 cursor-pointer" />
                                <span className="text-[10px] text-zinc-500">0</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-white/10 bg-zinc-950 pb-8 md:pb-3 shrink-0">
                <div className="flex items-center gap-2 bg-zinc-900 rounded-full px-4 py-2 border border-zinc-800 focus-within:border-zinc-700">
                    <div className="h-6 w-6 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] overflow-hidden">
                        {currentUser?.avatar_url ? (
                            <img src={currentUser.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                            currentUser?.full_name?.charAt(0) || "U"
                        )}
                    </div>
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
