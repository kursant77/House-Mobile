import { Button } from "@/components/ui/button";
import { Heart, X, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { socialService } from "@/services/api/social";
import { useAuthStore } from "@/store/authStore";
import { formatDistanceToNow } from "date-fns";
import { uz } from "date-fns/locale";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

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
    const queryClient = useQueryClient();
    const [commentText, setCommentText] = useState("");
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState("");
    const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

    // Real-time comments with auto-refetch
    const { data: comments = [], isLoading, refetch } = useQuery({
        queryKey: ["comments", productId],
        queryFn: () => socialService.getComments(productId),
        refetchInterval: 1500, // Har 1.5 soniyada yangilash
        enabled: !!productId,
    });

    // Real-time subscription for comments
    useEffect(() => {
        if (!productId) return;

        const channel = supabase
            .channel(`comments:${productId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'product_comments',
                    filter: `product_id=eq.${productId}`
                },
                () => {
                    // Comment o'zgarganda yangilash
                    refetch();
                    queryClient.invalidateQueries({ queryKey: ["comment-count", productId] });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [productId, refetch, queryClient]);

    const handleSend = async () => {
        if (!commentText.trim()) return;
        if (!currentUser) {
            toast.error("Iltimos, avval tizimga kiring");
            return;
        }

        try {
            await socialService.addComment(productId, commentText);
            setCommentText("");
            // Invalidate va yangilash
            queryClient.invalidateQueries({ queryKey: ["comments", productId] });
            queryClient.invalidateQueries({ queryKey: ["comment-count", productId] });
            refetch();
            toast.success("Izoh qo'shildi!");
        } catch (error: any) {
            toast.error(error.message || "Izoh qoldirishda xatolik yuz berdi");
        }
    };

    const handleReply = async (commentId: string) => {
        if (!replyText.trim()) return;
        if (!currentUser) {
            toast.error("Iltimos, avval tizimga kiring");
            return;
        }

        try {
            await socialService.addCommentReply(commentId, replyText);
            setReplyText("");
            setReplyingTo(null);
            // Invalidate va yangilash
            queryClient.invalidateQueries({ queryKey: ["comments", productId] });
            queryClient.invalidateQueries({ queryKey: ["comment-replies", commentId] });
            refetch();
            toast.success("Javob qo'shildi!");
        } catch (error: any) {
            toast.error(error.message || "Javob qoldirishda xatolik yuz berdi");
        }
    };

    const toggleReplies = (commentId: string) => {
        const newExpanded = new Set(expandedReplies);
        if (newExpanded.has(commentId)) {
            newExpanded.delete(commentId);
        } else {
            newExpanded.add(commentId);
        }
        setExpandedReplies(newExpanded);
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
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            currentUser={currentUser}
                            productId={productId}
                            onReply={() => setReplyingTo(comment.id)}
                            isReplying={replyingTo === comment.id}
                            replyText={replyText}
                            onReplyTextChange={setReplyText}
                            onReplySubmit={() => handleReply(comment.id)}
                            onCancelReply={() => {
                                setReplyingTo(null);
                                setReplyText("");
                            }}
                            showReplies={expandedReplies.has(comment.id)}
                            onToggleReplies={() => toggleReplies(comment.id)}
                        />
                    ))
                )}
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-white/10 bg-zinc-950 pb-safe md:pb-3 shrink-0">
                <div className="flex items-center gap-2 bg-zinc-900 rounded-full px-4 py-2 border border-zinc-800 focus-within:border-zinc-700">
                    <div className="h-6 w-6 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] overflow-hidden">
                        {currentUser?.avatarUrl ? (
                            <img src={currentUser.avatarUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                            currentUser?.name?.charAt(0) || "U"
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

function CommentItem({ 
    comment, 
    currentUser, 
    productId,
    onReply,
    isReplying,
    replyText,
    onReplyTextChange,
    onReplySubmit,
    onCancelReply,
    showReplies,
    onToggleReplies
}: { 
    comment: any; 
    currentUser: any;
    productId: string;
    onReply: () => void;
    isReplying: boolean;
    replyText: string;
    onReplyTextChange: (text: string) => void;
    onReplySubmit: () => void;
    onCancelReply: () => void;
    showReplies: boolean;
    onToggleReplies: () => void;
}) {
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);

    // Real-time replies
    const { data: replies = [], refetch: refetchReplies } = useQuery({
        queryKey: ["comment-replies", comment.id],
        queryFn: () => socialService.getCommentReplies(comment.id),
        enabled: showReplies,
        refetchInterval: 1500,
    });

    // Real-time subscription for replies
    useEffect(() => {
        if (!showReplies) return;

        const channel = supabase
            .channel(`comment-replies:${comment.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'product_comments',
                    filter: `parent_comment_id=eq.${comment.id}`
                },
                () => {
                    refetchReplies();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [comment.id, showReplies, refetchReplies]);

    useEffect(() => {
        const fetchLikeStatus = async () => {
            try {
                const [liked, count] = await Promise.all([
                    socialService.isCommentLiked(comment.id),
                    socialService.getCommentLikesCount(comment.id)
                ]);
                setIsLiked(liked);
                setLikesCount(count);
            } catch (error) {
                console.error("Failed to fetch comment like status:", error);
            }
        };
        fetchLikeStatus();
        
        // Real-time updates
        const interval = setInterval(fetchLikeStatus, 3000);
        return () => clearInterval(interval);
    }, [comment.id]);

    const handleLike = async () => {
        if (!currentUser) {
            toast.error("Iltimos, avval tizimga kiring");
            return;
        }

        try {
            const newStatus = !isLiked;
            setIsLiked(newStatus);
            setLikesCount(prev => newStatus ? prev + 1 : Math.max(0, prev - 1));
            await socialService.toggleCommentLike(comment.id);
        } catch (error) {
            // Revert
            setIsLiked(!isLiked);
            setLikesCount(prev => !isLiked ? prev - 1 : prev + 1);
            toast.error("Xatolik yuz berdi");
        }
    };

    return (
        <div className="space-y-3">
            <div className="flex gap-3 group">
                <div className="h-8 w-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden">
                    {comment.user?.avatarUrl ? (
                        <img src={comment.user.avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                        comment.user?.fullName?.charAt(0) || comment.user?.username?.charAt(0) || "U"
                    )}
                </div>
                <div className="flex-1 space-y-1">
                    <div className="flex items-baseline gap-2">
                        <span className="text-[11px] font-black text-zinc-200 uppercase tracking-tighter">
                            {comment.user?.username || comment.user?.fullName || "User"}
                        </span>
                        <span className="text-[9px] font-bold text-zinc-600 uppercase">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: uz }).replace('avval', '')}
                        </span>
                    </div>
                    <p className="text-[13px] text-zinc-300 leading-snug font-medium">{comment.text}</p>
                    <div className="flex items-center gap-4 mt-1">
                        <button 
                            onClick={handleLike}
                            className="flex items-center gap-1.5"
                        >
                            <Heart className={cn("h-3.5 w-3.5 transition-colors", isLiked ? "text-red-500 fill-red-500" : "text-zinc-600")} />
                            {likesCount > 0 && (
                                <span className="text-[10px] font-black text-zinc-500">{likesCount}</span>
                            )}
                        </button>
                        <button 
                            onClick={onReply}
                            className="text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-zinc-300"
                        >
                            Reply
                        </button>
                        {comment.repliesCount > 0 && (
                            <button
                                onClick={onToggleReplies}
                                className="text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-zinc-300 flex items-center gap-1"
                            >
                                {showReplies ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                {comment.repliesCount} {comment.repliesCount === 1 ? 'reply' : 'replies'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Reply Input */}
            {isReplying && (
                <div className="ml-11 space-y-2">
                    <div className="flex items-center gap-2 bg-zinc-900 rounded-lg px-3 py-2 border border-zinc-800">
                        <div className="h-6 w-6 rounded-full bg-zinc-700 flex items-center justify-center text-[10px] overflow-hidden shrink-0">
                            {currentUser?.avatarUrl ? (
                                <img src={currentUser.avatarUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                                currentUser?.name?.charAt(0) || "U"
                            )}
                        </div>
                        <input
                            type="text"
                            value={replyText}
                            onChange={(e) => onReplyTextChange(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && onReplySubmit()}
                            placeholder="Javob yozing..."
                            className="flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-600 text-white"
                            autoFocus
                        />
                        <button
                            onClick={onReplySubmit}
                            disabled={!replyText.trim()}
                            className={cn("text-blue-500 font-bold text-xs px-2", !replyText.trim() && "opacity-50")}
                        >
                            Post
                        </button>
                        <button
                            onClick={onCancelReply}
                            className="text-zinc-500 text-xs px-2"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Replies List */}
            {showReplies && replies.length > 0 && (
                <div className="ml-11 space-y-3 pt-2 border-l-2 border-zinc-800 pl-4">
                    {replies.map((reply: any) => (
                        <div key={reply.id} className="flex gap-2">
                            <div className="h-6 w-6 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center text-[10px] font-bold shrink-0 overflow-hidden">
                                {reply.user?.avatarUrl ? (
                                    <img src={reply.user.avatarUrl} alt="" className="h-full w-full object-cover" />
                                ) : (
                                    reply.user?.fullName?.charAt(0) || reply.user?.username?.charAt(0) || "U"
                                )}
                            </div>
                            <div className="flex-1 space-y-0.5">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-[10px] font-black text-zinc-300 uppercase tracking-tighter">
                                        {reply.user?.username || reply.user?.fullName || "User"}
                                    </span>
                                    <span className="text-[8px] font-bold text-zinc-600 uppercase">
                                        {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true, locale: uz }).replace('avval', '')}
                                    </span>
                                </div>
                                <p className="text-[12px] text-zinc-400 leading-snug">{reply.text}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
