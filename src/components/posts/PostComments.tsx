import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { postService } from "@/services/api/posts";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuthStore } from "@/store/authStore";
import { Loader2, Trash2, Send, Heart, Reply } from "lucide-react";
import { cn } from "@/lib/utils";

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

const CommentItem = ({ comment, onReply, onLike, onDelete, currentUserId, isReplying, replyForm }: CommentItemProps) => (
    <div className="flex gap-4 group">
        <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={comment.author?.avatar_url || comment.author?.avatarUrl} />
            <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800 font-bold">
                {comment.author?.full_name?.charAt(0) || comment.author?.fullName?.charAt(0) || "?"}
            </AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
                <span className="font-bold text-[13px]">{comment.author?.full_name || comment.author?.fullName}</span>
                <span className="text-[12px] text-muted-foreground">
                    {new Date(comment.created_at).toLocaleDateString()}
                </span>
            </div>
            <p className="text-[14px] text-zinc-800 dark:text-zinc-200 leading-relaxed">
                {comment.content}
            </p>
            <div className="flex items-center gap-4 mt-1">
                <button
                    onClick={() => onLike(comment.id)}
                    className={cn(
                        "flex items-center gap-1.5 text-xs font-medium p-1 rounded-full transition-colors",
                        comment.has_liked
                            ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                            : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    )}
                >
                    <Heart className={cn("h-4 w-4", comment.has_liked && "fill-current")} />
                    {comment.likes_count || 0}
                </button>
                <button
                    onClick={() => onReply(comment)}
                    className="text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 px-3 py-1 rounded-full transition-colors"
                >
                    Javob berish
                </button>
            </div>

            {/* Reply Form */}
            {isReplying && replyForm}

            {/* Nested Comments (Children) */}
            {comment.children && comment.children.length > 0 && (
                <div className="mt-4 space-y-4 pl-4 border-l-2 border-zinc-100 dark:border-zinc-800">
                    {comment.children.map((child: any) => (
                        <CommentItem
                            key={child.id}
                            comment={child}
                            onReply={onReply}
                            onLike={onLike}
                            onDelete={onDelete}
                            currentUserId={currentUserId}
                            isReplying={false}
                        // Deep nesting reply form logic can be complex, simplifying to 1 level for UI or handling via main form
                        // For true reddit/youtube style, each can reply.
                        // We can let the parent handle the reply form rendering by passing state down if needed, 
                        // but usually single active reply form is enough.
                        />
                    ))}
                </div>
            )}
        </div>
        {currentUserId === comment.user_id && (
            <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 h-8 w-8 text-muted-foreground hover:text-destructive transition-all"
                onClick={() => onDelete(comment.id)}
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        )}
    </div>
);

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
        onSuccess: () => {
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
        const [replyContent, setReplyContent] = useState(`@${parentComment.author?.full_name || parentComment.author?.fullName} `);

        return (
            <form
                onSubmit={(e) => handleSubmit(e, replyContent, parentComment.id)}
                className="mt-4 flex gap-3 animate-in fade-in slide-in-from-top-2"
            >
                <div className="flex-1 flex flex-col gap-2">
                    <Textarea
                        placeholder="Javob yozing..."
                        className="bg-transparent border-0 border-b border-zinc-200 dark:border-zinc-800 rounded-none focus-visible:ring-0 focus-visible:border-primary px-0 py-1 min-h-[40px] resize-none text-sm"
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        autoFocus
                    />
                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="rounded-full h-7 px-3 text-xs"
                            onClick={() => setReplyingTo(null)}
                        >
                            Bekor qilish
                        </Button>
                        <Button
                            type="submit"
                            size="sm"
                            className="rounded-full h-7 px-4 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={!replyContent.trim()}
                        >
                            Javob berish
                        </Button>
                    </div>
                </div>
            </form>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <h3 className="font-bold text-lg">{rawComments?.length || 0} ta izoh</h3>
            </div>

            {/* Main Add Comment Form */}
            <form onSubmit={(e) => handleSubmit(e, newComment)} className="flex gap-4">
                <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={user?.avatarUrl} />
                    <AvatarFallback className="bg-zinc-100 dark:bg-zinc-800">
                        {user?.name?.charAt(0) || "?"}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 flex flex-col gap-2">
                    <Textarea
                        placeholder="Izoh qoldiring..."
                        className="bg-transparent border-0 border-b border-zinc-200 dark:border-zinc-800 rounded-none focus-visible:ring-0 focus-visible:border-primary px-0 py-1 min-h-[40px] resize-none"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                    />
                    <div className="flex justify-end gap-2">
                        {newComment && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="rounded-full font-bold"
                                onClick={() => setNewComment("")}
                            >
                                Bekor qilish
                            </Button>
                        )}
                        <Button
                            type="submit"
                            size="sm"
                            className="rounded-full font-bold bg-blue-600 hover:bg-blue-700 text-white"
                            disabled={!newComment.trim() || addCommentMutation.isPending}
                        >
                            {addCommentMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Izoh qoldirish"}
                        </Button>
                    </div>
                </div>
            </form>

            {/* List Comments */}
            <div className="space-y-6 mt-8">
                {isLoading ? (
                    <div className="flex justify-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : commentsTree?.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4 italic">
                        Hali birorta ham izoh yo'q. Birinchi bo'lib izoh qoldiring!
                    </p>
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
        </div>
    );
}
