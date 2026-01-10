import { PublicPost } from "@/services/api/posts";
import { VerifiedBadge } from "@/components/ui/VerifiedBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Eye, Clock, MessageSquare, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface PostCardProps {
    post: PublicPost;
}

export const PostCard = ({ post }: PostCardProps) => {
    return (
        <Card className="overflow-hidden border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-0">
                {/* Author Header */}
                <div className="p-4 flex items-center justify-between">
                    <Link to={`/profile/${post.author?.id}`} className="flex items-center gap-3 group">
                        <Avatar className="h-10 w-10 border border-zinc-100 dark:border-zinc-800">
                            <AvatarImage src={post.author?.avatarUrl} />
                            <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                                {post.author?.fullName?.charAt(0)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-1.5">
                                <span className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-primary transition-colors">
                                    {post.author?.fullName}
                                </span>
                                {(post.author?.role === 'super_admin' || post.author?.role === 'blogger') && (
                                    <VerifiedBadge size={14} />
                                )}
                            </div>
                            <span className="text-[10px] text-zinc-500 font-medium">
                                {post.author?.role === 'blogger' ? 'Blogger' : 'Admin'}
                            </span>
                        </div>
                    </Link>
                    <div className="flex items-center gap-1 text-zinc-400">
                        <Clock className="h-3 w-3" />
                        <span className="text-[10px] font-medium">{new Date(post.created_at).toLocaleDateString()}</span>
                    </div>
                </div>

                {/* Post Content */}
                <div className="px-4 pb-3">
                    <p className="text-sm text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">
                        {post.content}
                    </p>
                </div>

                {/* Media Content */}
                {post.mediaUrl && (
                    <div className="relative aspect-video bg-zinc-100 dark:bg-zinc-950 overflow-hidden border-y border-zinc-100 dark:border-zinc-800">
                        {post.mediaType === 'video' ? (
                            <video
                                src={post.mediaUrl}
                                className="w-full h-full object-cover"
                                controls
                                poster={post.mediaUrl + "#t=0.1"}
                            />
                        ) : (
                            <img
                                src={post.mediaUrl}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                                alt="post media"
                            />
                        )}
                    </div>
                )}

                {/* Footer Actions */}
                <div className="p-4 flex items-center justify-between border-t border-zinc-50 dark:border-zinc-800/50">
                    <div className="flex items-center gap-4">
                        <button className="flex items-center gap-1.5 text-zinc-500 hover:text-primary transition-colors">
                            <Eye className="h-4 w-4" />
                            <span className="text-xs font-bold">{post.views || 0}</span>
                        </button>
                        <button className="flex items-center gap-1.5 text-zinc-500 hover:text-primary transition-colors">
                            <MessageSquare className="h-4 w-4" />
                            <span className="text-xs font-bold">0</span>
                        </button>
                    </div>
                    <button className="p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
                        <Share2 className="h-4 w-4" />
                    </button>
                </div>
            </CardContent>
        </Card>
    );
};
