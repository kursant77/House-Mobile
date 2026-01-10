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
    };
}

export const postService = {
    getPosts: async (): Promise<PublicPost[]> => {
        const { data, error } = await supabase
            .from('public_posts')
            .select(`
        *,
        profiles(id, full_name, avatar_url, role)
      `)
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
                role: p.profiles.role
            } : undefined
        }));
    },

    createPost: async (post: {
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
        // Simple rpc or direct update
        await supabase.rpc('increment_post_views', { post_id: postId });
    }
};
