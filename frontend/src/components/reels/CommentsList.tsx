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
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
        <div className={cn("flex flex-col h-full bg-background text-foreground transition-colors duration-300", className)}>
            {header}

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-6 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
                {isLoading ? (
                    <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <p className="text-xs">Yuklanmoqda...</p>
                    </div>
                ) : comments.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                        <p className="text-sm font-medium text-foreground">Hali izohlar yo'q</p>
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
            <div className="p-3 border-t border-border bg-background pb-safe md:pb-3 shrink-0">
                <div className="flex items-center gap-2 bg-muted/50 rounded-full px-4 py-2 border border-border focus-within:border-primary/20">
                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] overflow-hidden">
                        {currentUser?.avatarUrl ? (
                            <img src={currentUser.avatarUrl} alt="" className="h-full w-full object-cover" />
                        ) : (
                            currentUser?.name?.charAt(0) || "U"
                        )}
                    </div>
                    <textarea
                        value={commentText}
                        onChange={(e) => {
                            setCommentText(e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder="Add a comment..."
                        className="flex-1 bg-transparent text-sm shadow-none outline-none placeholder:text-muted-foreground/50 text-foreground resize-none py-1 min-h-[20px] max-h-[150px]"
                        rows={1}
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

    const queryClient = useQueryClient();

    const { data: likeData, refetch: refetchLikeStatus } = useQuery({
        queryKey: ["comment-like-status", comment.id],
        queryFn: async () => {
            const [liked, count] = await Promise.all([
                socialService.isCommentLiked(comment.id),
                socialService.getCommentLikesCount(comment.id)
            ]);
            return { liked, count };
        },
        enabled: !!comment.id,
    });

    useEffect(() => {
        if (likeData) {
            setIsLiked(likeData.liked);
            setLikesCount(likeData.count);
        }
    }, [likeData]);

    const toggleLikeMutation = useMutation({
        mutationFn: () => socialService.toggleCommentLike(comment.id),
        onMutate: async () => {
            const prevLiked = isLiked;
            const prevCount = likesCount;
            setIsLiked(!prevLiked);
            setLikesCount(prev => !prevLiked ? prev + 1 : Math.max(0, prev - 1));
            return { prevLiked, prevCount };
        },
        onError: (err, variables, context) => {
            if (context) {
                setIsLiked(context.prevLiked);
                setLikesCount(context.prevCount);
            }
            toast.error("Xatolik yuz berdi");
        },
        onSuccess: () => {
            refetchLikeStatus();
        }
    });

    const handleLike = () => {
        if (!currentUser) {
            toast.error("Iltimos, avval tizimga kiring");
            return;
        }
        toggleLikeMutation.mutate();
    };

    return (
        <div className="space-y-3">
            <div className="flex gap-3 group">
                <div className="h-8 w-8 rounded-full bg-muted border border-border flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden">
                    {comment.user?.avatarUrl ? (
                        <img src={comment.user.avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                        comment.user?.fullName?.charAt(0) || comment.user?.username?.charAt(0) || "U"
                    )}
                </div>
                <div className="flex-1 space-y-1">
                    <div className="flex items-baseline gap-2">
                        <span className="text-[11px] font-black text-foreground uppercase tracking-tighter">
                            {comment.user?.username || comment.user?.fullName || "User"}
                        </span>
                        {(comment.user?.role === 'super_admin' || comment.user?.role === 'blogger') && (
                            <VerifiedBadge size={10} />
                        )}
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">
                            {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: uz }).replace('avval', '')}
                        </span>
                    </div>
                    <p className="text-[13px] text-foreground/90 leading-snug font-medium">{comment.text}</p>
                    <div className="flex items-center gap-4 mt-1">
                        <button
                            onClick={handleLike}
                            className="flex items-center gap-1.5"
                        >
                            <Heart className={cn("h-3.5 w-3.5 transition-colors", isLiked ? "text-red-500 fill-red-500" : "text-muted-foreground")} />
                            {likesCount > 0 && (
                                <span className="text-[10px] font-black text-muted-foreground">{likesCount}</span>
                            )}
                        </button>
                        <button
                            onClick={onReply}
                            className="text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:text-foreground"
                        >
                            Reply
                        </button>
                        {comment.repliesCount > 0 && (
                            <button
                                onClick={onToggleReplies}
                                className="text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:text-foreground flex items-center gap-1"
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
                    <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2 border border-border">
                        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[10px] overflow-hidden shrink-0">
                            {currentUser?.avatarUrl ? (
                                <img src={currentUser.avatarUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                                currentUser?.name?.charAt(0) || "U"
                            )}
                        </div>
                        <textarea
                            value={replyText}
                            onChange={(e) => {
                                onReplyTextChange(e.target.value);
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    onReplySubmit();
                                }
                            }}
                            placeholder="Javob yozing..."
                            className="flex-1 bg-transparent text-sm shadow-none outline-none placeholder:text-muted-foreground/50 text-foreground resize-none py-1 min-h-[20px] max-h-[120px]"
                            rows={1}
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
                            className="text-muted-foreground text-xs px-2"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Replies List */}
            {showReplies && replies.length > 0 && (
                <div className="ml-11 space-y-3 pt-2 border-l-2 border-border pl-4">
                    {replies.map((reply: any) => (
                        <div key={reply.id} className="flex gap-2">
                            <div className="h-6 w-6 rounded-full bg-muted border border-border flex items-center justify-center text-[10px] font-bold shrink-0 overflow-hidden">
                                {reply.user?.avatarUrl ? (
                                    <img src={reply.user.avatarUrl} alt="" className="h-full w-full object-cover" />
                                ) : (
                                    reply.user?.fullName?.charAt(0) || reply.user?.username?.charAt(0) || "U"
                                )}
                            </div>
                            <div className="flex-1 space-y-0.5">
                                <div className="flex items-baseline gap-2">
                                    <span className="text-[10px] font-black text-foreground/80 uppercase tracking-tighter">
                                        {reply.user?.username || reply.user?.fullName || "User"}
                                    </span>
                                    {(reply.user?.role === 'super_admin' || reply.user?.role === 'blogger') && (
                                        <VerifiedBadge size={8} />
                                    )}
                                    <span className="text-[8px] font-bold text-muted-foreground uppercase">
                                        {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true, locale: uz }).replace('avval', '')}
                                    </span>
                                </div>
                                <p className="text-[12px] text-muted-foreground/90 leading-snug">{reply.text}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
