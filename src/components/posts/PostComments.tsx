import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { postService } from "@/services/api/posts";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { Loader2, Trash2, Send, Heart, Reply, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { formatDistanceToNow } from "date-fns";
import { uz } from "date-fns/locale";

interface PostCommentsProps {
    postId: string;
}

interface CommentItemProps {
    comment: any;
    onReply: (comment: any) => void;
    onLike: (id: string) => void;
    onDelete: (id: string) => void;
    currentUserId?: string;
    isReplying?: boolean;
    replyForm?: React.ReactNode;
}

const CommentItem = ({
    comment,
    onReply,
    onLike,
    onDelete,
    currentUserId,
    isReplying,
    replyForm
}: CommentItemProps) => {
    const isAuthor = currentUserId === comment.user_id;

    return (
        <div className="space-y-3">
            <div className="flex gap-3 group">
                <Avatar size="sm" className="shrink-0">
                    <AvatarImage src={comment.author?.avatar_url || comment.author?.avatarUrl} />
                    <AvatarFallback>
                        {comment.author?.full_name?.charAt(0) || comment.author?.fullName?.charAt(0) || "?"}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                    <div className="flex items-baseline gap-2">
                        <span className="text-[11px] font-black text-foreground uppercase tracking-tighter">
                            {comment.author?.full_name || comment.author?.fullName}
                        </span>
                        {(comment.author?.role === 'super_admin' || comment.author?.role === 'blogger') && (
                            <VerifiedBadge size={10} />
                        )}
                        <span className="text-[9px] font-bold text-muted-foreground uppercase">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: uz }).replace('avval', '')}
                        </span>
                    </div>
                    <p className="text-[13px] text-foreground/90 leading-snug font-medium">{comment.content}</p>
                    <div className="flex items-center gap-4 mt-1">
                        <button
                            onClick={() => onLike(comment.id)}
                            className="flex items-center gap-1.5"
                        >
                            <Heart className={cn(
                                "h-3.5 w-3.5 transition-colors",
                                comment.has_liked ? "text-red-500 fill-red-500" : "text-muted-foreground"
                            )} />
                            {comment.likes_count > 0 && (
                                <span className="text-[10px] font-black text-muted-foreground">{comment.likes_count}</span>
                            )}
                        </button>
                        <button
                            onClick={() => onReply(comment)}
                            className="text-[10px] font-black text-muted-foreground uppercase tracking-widest hover:text-foreground"
                        >
                            Reply
                        </button>
                        {isAuthor && (
                            <button
                                onClick={() => onDelete(comment.id)}
                                className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest hover:text-destructive transition-colors ml-auto opacity-0 group-hover:opacity-100"
                            >
                                Delete
                            </button>
                        )}
                    </div>

                </div>
            </div>

            {/* Reply Form */}
            {isReplying && (
                <div className="ml-11">
                    {replyForm}
                </div>
            )}

            {/* Nested Comments (Children) */}
            {comment.children && comment.children.length > 0 && (
                <div className="ml-11 mt-3 space-y-4 pl-4 border-l-2 border-border/50">
                    {comment.children.map((child: any) => (
                        <CommentItem
                            key={child.id}
                            comment={child}
                            onReply={onReply}
                            onLike={onLike}
                            onDelete={onDelete}
                            currentUserId={currentUserId}
                            isReplying={false}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export function PostComments({ postId }: PostCommentsProps) {
    const [newComment, setNewComment] = useState("");
    const [replyingTo, setReplyingTo] = useState<any | null>(null);
    const { user, isAuthenticated } = useAuthStore();
    const queryClient = useQueryClient();

    const { data: rawComments, isLoading } = useQuery({
        queryKey: ["post-comments", postId],
        queryFn: () => postService.getComments(postId),
    });

    // Build Thread Tree
    const commentsTree = useMemo(() => {
        if (!rawComments) return [];
        const map = new Map();
        const roots: any[] = [];

        // First pass: create nodes
        rawComments.forEach((c: any) => {
            map.set(c.id, { ...c, children: [] });
        });

        // Second pass: link children
        rawComments.forEach((c: any) => {
            if (c.parent_id) {
                const parent = map.get(c.parent_id);
                if (parent) {
                    parent.children.push(map.get(c.id));
                } else {
                    roots.push(map.get(c.id)); // Orphan or parent not found (shouldn't happen with valid data)
                }
            } else {
                roots.push(map.get(c.id));
            }
        });

        return roots;
    }, [rawComments]);

    const addCommentMutation = useMutation({
        mutationFn: (data: { content: string; parentId?: string }) =>
            postService.addComment(postId, data.content, data.parentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["post-comments", postId] });
            setNewComment("");
            setReplyingTo(null);
            toast.success("Kommentariya qo'shildi");
        },
        onError: (error: any) => {
            toast.error("Xatolik: " + error.message);
        }
    });

    const toggleLikeMutation = useMutation({
        mutationFn: (commentId: string) => postService.toggleCommentLike(commentId),
        onMutate: async (commentId) => {
            // Cancel any outgoing refetches (so they don't overwrite our optimistic update)
            await queryClient.cancelQueries({ queryKey: ["post-comments", postId] });

            // Snapshot the previous value
            const previousComments = queryClient.getQueryData(["post-comments", postId]);

            // Optimistically update to the new value
            queryClient.setQueryData(["post-comments", postId], (old: any) => {
                if (!old) return old;
                return old.map((c: any) => {
                    if (c.id === commentId) {
                        const newHasLiked = !c.has_liked;
                        return {
                            ...c,
                            has_liked: newHasLiked,
                            likes_count: newHasLiked ? (c.likes_count || 0) + 1 : Math.max(0, (c.likes_count || 0) - 1)
                        };
                    }
                    return c;
                });
            });

            return { previousComments };
        },
        onError: (err, commentId, context) => {
            if (context?.previousComments) {
                queryClient.setQueryData(["post-comments", postId], context.previousComments);
            }
            toast.error("Xatolik yuz berdi");
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ["post-comments", postId] });
        }
    });

    const deleteCommentMutation = useMutation({
        mutationFn: (commentId: string) => postService.deleteComment(commentId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["post-comments", postId] });
            toast.success("Kommentariya o'chirildi");
        }
    });

    const handleSubmit = (e: React.FormEvent, content: string, parentId?: string) => {
        e.preventDefault();
        if (!isAuthenticated) {
            toast.error("Komment qoldirish uchun tizimga kiring");
            return;
        }
        if (!content.trim()) return;
        addCommentMutation.mutate({ content: content.trim(), parentId });
    };

    const ReplyForm = ({ parentComment }: { parentComment: any }) => {
        const [replyContent, setReplyContent] = useState("");

        return (
            <div className="mt-3 space-y-2 animate-in fade-in slide-in-from-top-1">
                <div className="flex items-center gap-2 bg-muted/30 rounded-lg px-2 py-1.5 border border-border/50">
                    <textarea
                        placeholder="Javob yozing..."
                        className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground/40 text-foreground resize-none py-1 min-h-[20px] max-h-[120px]"
                        rows={1}
                        value={replyContent}
                        onChange={(e) => {
                            setReplyContent(e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        autoFocus
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e as any, replyContent, parentComment.id);
                            }
                        }}
                    />
                    <div className="flex items-center gap-1">
                        <button
                            onClick={(e) => handleSubmit(e as any, replyContent, parentComment.id)}
                            disabled={!replyContent.trim()}
                            className={cn("text-blue-500 font-bold text-[11px] px-2 py-1 hover:bg-blue-500/10 rounded-md transition-colors", !replyContent.trim() && "opacity-30")}
                        >
                            Post
                        </button>
                        <button
                            onClick={() => setReplyingTo(null)}
                            className="text-muted-foreground/60 font-medium text-[11px] px-2 py-1 hover:bg-muted rounded-md transition-colors"
                        >
                            Bekor
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-background text-foreground transition-colors duration-300">
            {/* Header with count */}
            <div className="flex items-center gap-4 mb-6 shrink-0">
                <h3 className="text-[14px] font-black uppercase tracking-widest text-muted-foreground">
                    {rawComments?.length || 0} ta izoh
                </h3>
            </div>

            {/* Scrollable List Comments */}
            <div className="flex-1 overflow-y-auto space-y-6 min-h-0 pr-2 scrollbar-thin scrollbar-thumb-border pb-24">
                {isLoading ? (
                    <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <p className="text-xs">Yuklanmoqda...</p>
                    </div>
                ) : commentsTree?.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                        <p className="text-sm font-medium text-foreground">Hali izohlar yo'q</p>
                        <p className="text-xs mt-1">Birinchi bo'lib izoh qoldiring!</p>
                    </div>
                ) : (
                    commentsTree.map((comment: any) => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            onReply={(c) => setReplyingTo(c)}
                            onLike={(id) => toggleLikeMutation.mutate(id)}
                            onDelete={(id) => deleteCommentMutation.mutate(id)}
                            currentUserId={user?.id}
                            isReplying={replyingTo?.id === comment.id}
                            replyForm={replyingTo?.id === comment.id ? <ReplyForm parentComment={comment} /> : null}
                        />
                    ))
                )}
            </div>

            {/* Fixed Main Add Comment Form at Bottom (Instagram Style) */}
            <div className="shrink-0 bg-background border-t border-border pt-4 pb-8 md:pb-4 px-0">
                <div className="flex items-center gap-3 bg-muted/50 rounded-full px-4 py-2 border border-border focus-within:border-primary/20">
                    <Avatar size="sm" className="shrink-0">
                        <AvatarImage src={user?.avatarUrl} />
                        <AvatarFallback>
                            {user?.name?.charAt(0) || "?"}
                        </AvatarFallback>
                    </Avatar>
                    <textarea
                        placeholder="Izoh qoldiring..."
                        className="flex-1 bg-transparent border-none focus:ring-0 p-0 text-sm placeholder:text-muted-foreground/50 text-foreground outline-none resize-none py-1 min-h-[20px] max-h-[150px]"
                        rows={1}
                        value={newComment}
                        onChange={(e) => {
                            setNewComment(e.target.value);
                            e.target.style.height = 'auto';
                            e.target.style.height = e.target.scrollHeight + 'px';
                        }}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e as any, newComment);
                            }
                        }}
                    />
                    <button
                        type="button"
                        onClick={(e) => handleSubmit(e as any, newComment)}
                        disabled={!newComment.trim() || addCommentMutation.isPending}
                        className={cn(
                            "text-sm font-black transition-all",
                            addCommentMutation.isPending ? "text-muted-foreground" : "text-blue-500 hover:scale-105 active:scale-95",
                            !newComment.trim() && "opacity-0 pointer-events-none"
                        )}
                    >
                        {addCommentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Post"}
                    </button>
                </div>
            </div>
        </div>
    );
}
