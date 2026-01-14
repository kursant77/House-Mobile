import { supabase } from "@/lib/supabase";

export interface PublicPost {
    id: string;
    author_id: string;
    content: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'video';
    category: string;
    views: number;
    created_at: string;
    author?: {
        id: string;
        fullName: string;
        avatarUrl: string;
        role: string;
        telegram?: string;
        instagram?: string;
        facebook?: string;
        youtube?: string;
    };
    title?: string;
}

export const postService = {
    getPosts: async (page = 1, limit = 20): Promise<PublicPost[]> => {
        const from = (page - 1) * limit;
        const to = from + limit - 1;

        const { data, error } = await supabase
            .from('public_posts')
            .select(`
        *,
        profiles!author_id(id, full_name, avatar_url, role, telegram, instagram, facebook, youtube)
      `)
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) throw error;

        return data.map((p: any) => ({
            ...p,
            authorId: p.author_id,
            mediaUrl: p.media_url,
            mediaType: p.media_type,
            author: p.profiles ? {
                id: p.profiles.id,
                fullName: p.profiles.full_name,
                avatarUrl: p.profiles.avatar_url,
                role: p.profiles.role,
                telegram: p.profiles.telegram,
                instagram: p.profiles.instagram,
                facebook: p.profiles.facebook,
                youtube: p.profiles.youtube
            } : undefined
        }));
    },

    getPostsByUserId: async (userId: string): Promise<PublicPost[]> => {
        const { data, error } = await supabase
            .from('public_posts')
            .select(`
                *,
                profiles!author_id(id, full_name, avatar_url, role, telegram, instagram, facebook, youtube)
            `)
            .eq('author_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return data.map((p: any) => ({
            ...p,
            authorId: p.author_id,
            mediaUrl: p.media_url,
            mediaType: p.media_type,
            author: p.profiles ? {
                id: p.profiles.id,
                fullName: p.profiles.full_name,
                avatarUrl: p.profiles.avatar_url,
                role: p.profiles.role,
                telegram: p.profiles.telegram,
                instagram: p.profiles.instagram,
                facebook: p.profiles.facebook,
                youtube: p.profiles.youtube
            } : undefined
        }));
    },

    createPost: async (post: {
        title?: string;
        content: string;
        mediaUrl?: string;
        mediaType?: 'image' | 'video';
        category?: string;
    }) => {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error("Auth required");

        const { data, error } = await supabase
            .from('public_posts')
            .insert([{
                author_id: userData.user.id,
                title: post.title,
                content: post.content,
                media_url: post.mediaUrl,
                media_type: post.mediaType,
                category: post.category || 'general'
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    incrementViews: async (postId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.rpc('increment_post_view_unique', {
            p_post_id: postId,
            p_user_id: user?.id || null
        });
    },

    getSavedPosts: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('public_post_saved')
            .select(`
                post_id,
                public_posts (
                    *,
                    profiles!author_id (id, full_name, avatar_url, role)
                )
            `)
            .eq('user_id', user.id);

        if (error) {
            console.error("Error fetching saved posts:", error);
            return [];
        }

        return (data || [])
            .filter(item => item.public_posts)
            .map(item => {
                const p = item.public_posts as any;
                return {
                    ...p,
                    authorId: p.author_id,
                    mediaUrl: p.media_url,
                    mediaType: p.media_type,
                    author: p.profiles ? {
                        id: p.profiles.id,
                        fullName: p.profiles.full_name,
                        avatarUrl: p.profiles.avatar_url,
                        role: p.profiles.role
                    } : undefined
                };
            }) as PublicPost[];
    },

    updatePost: async (postId: string, updates: Partial<PublicPost>) => {
        const { data, error } = await supabase
            .from('public_posts')
            .update({
                title: updates.title,
                content: updates.content,
                media_url: updates.mediaUrl,
                media_type: updates.mediaType,
                category: updates.category
            })
            .eq('id', postId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    deletePost: async (postId: string) => {
        const { error } = await supabase
            .from('public_posts')
            .delete()
            .eq('id', postId);

        if (error) throw error;
    },

    getComments: async (postId: string) => {
        // Use RPC to get comments with like status and count
        const { data, error } = await supabase
            .rpc('get_comments_with_stats', { p_post_id: postId });

        if (error) {
            // Fallback if RPC doesn't exist yet (for transition)
            console.error("RPC Error, falling back to basic fetch:", error);
            const { data: fallbackData, error: fallbackError } = await supabase
                .from('public_post_comments')
                .select(`
                    *,
                    profiles!user_id(id, full_name, avatar_url, role)
                `)
                .eq('post_id', postId)
                .order('created_at', { ascending: false });

            if (fallbackError) throw fallbackError;
            return fallbackData.map((c: any) => ({
                ...c,
                author: c.profiles ? {
                    id: c.profiles.id,
                    fullName: c.profiles.full_name,
                    avatarUrl: c.profiles.avatar_url,
                    role: c.profiles.role
                } : undefined,
                likes_count: 0,
                has_liked: false,
                children: []
            }));
        }

        // Return formatted data structure
        return data.map((c: any) => ({
            id: c.id,
            post_id: c.post_id,
            content: c.content,
            created_at: c.created_at,
            parent_id: c.parent_id,
            likes_count: c.likes_count,
            has_liked: c.has_liked,
            author: c.author_json,
            children: [] // Will be populated in UI
        }));
    },

    addComment: async (postId: string, content: string, parentId?: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Auth required");

        const { data, error } = await supabase
            .from('public_post_comments')
            .insert([{
                post_id: postId,
                user_id: user.id,
                content,
                parent_id: parentId
            }])
            .select(`
                *,
                profiles!user_id(id, full_name, avatar_url, role)
            `)
            .single();

        if (error) throw error;
        return {
            ...data,
            author: data.profiles ? {
                id: data.profiles.id,
                fullName: data.profiles.full_name,
                avatarUrl: data.profiles.avatar_url,
                role: data.profiles.role
            } : undefined
        };
    },

    deleteComment: async (commentId: string) => {
        const { error } = await supabase
            .from('public_post_comments')
            .delete()
            .eq('id', commentId);
        if (error) throw error;
    },

    toggleCommentLike: async (commentId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Avtorizatsiya zarur");

        // Check if already liked
        const { data: existingLike, error: fetchError } = await supabase
            .from('public_post_comment_likes')
            .select('id')
            .eq('user_id', user.id)
            .eq('comment_id', commentId)
            .maybeSingle();

        if (fetchError) throw fetchError;

        if (existingLike) {
            const { error: deleteError } = await supabase
                .from('public_post_comment_likes')
                .delete()
                .eq('id', existingLike.id);
            if (deleteError) throw deleteError;
            return false;
        } else {
            const { error: insertError } = await supabase
                .from('public_post_comment_likes')
                .insert([{
                    user_id: user.id,
                    comment_id: commentId
                }]);
            if (insertError) throw insertError;
            return true;
        }
    },

    // Post Stats & Interactions
    getPostStats: async (postId: string) => {
        const { data, error } = await supabase
            .rpc('get_post_stats', { p_post_id: postId });

        if (error) {
            console.error("Error fetching post stats:", error);
            return { likes_count: 0, has_liked: false, has_disliked: false, has_saved: false };
        }
        return data as { likes_count: number; has_liked: boolean; has_disliked: boolean; has_saved: boolean };
    },

    togglePostLike: async (postId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Auth required");

        // First, remove dislike if exists (YouTube behavior)
        await supabase.from('public_post_dislikes').delete().eq('user_id', user.id).eq('post_id', postId);

        const { data: existingLike } = await supabase
            .from('public_post_likes')
            .select('id')
            .eq('user_id', user.id)
            .eq('post_id', postId)
            .maybeSingle();

        if (existingLike) {
            await supabase.from('public_post_likes').delete().eq('id', existingLike.id);
            return false;
        } else {
            await supabase.from('public_post_likes').insert([{ user_id: user.id, post_id: postId }]);
            return true;
        }
    },

    togglePostDislike: async (postId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Auth required");

        // Remove like if exists
        await supabase.from('public_post_likes').delete().eq('user_id', user.id).eq('post_id', postId);

        const { data: existingDislike } = await supabase
            .from('public_post_dislikes')
            .select('id')
            .eq('user_id', user.id)
            .eq('post_id', postId)
            .maybeSingle();

        if (existingDislike) {
            await supabase.from('public_post_dislikes').delete().eq('id', existingDislike.id);
            return false;
        } else {
            await supabase.from('public_post_dislikes').insert([{ user_id: user.id, post_id: postId }]);
            return true;
        }
    },

    togglePostSave: async (postId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Auth required");

        const { data: existingSave } = await supabase
            .from('public_post_saved')
            .select('id')
            .eq('user_id', user.id)
            .eq('post_id', postId)
            .maybeSingle();

        if (existingSave) {
            await supabase.from('public_post_saved').delete().eq('id', existingSave.id);
            return false;
        } else {
            await supabase.from('public_post_saved').insert([{ user_id: user.id, post_id: postId }]);
            return true;
        }
    }
};
