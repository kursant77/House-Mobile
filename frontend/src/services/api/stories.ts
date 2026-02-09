import { supabase } from "@/lib/supabase";
import { Story, StoryView } from "@/types/marketing";

export const storiesService = {
    /**
     * Get all active stories (not expired)
     */
    async getActiveStories(): Promise<Story[]> {
        const { data: { user } } = await supabase.auth.getUser();

        const { data, error } = await supabase
            .from("stories")
            .select(`
                *,
                user:user_id(full_name, avatar_url, role)
            `)
            .eq("is_active", true)
            .gt("expires_at", new Date().toISOString())
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching active stories:", error);
            return [];
        }

        // If user is logged in, check which stories they've viewed
        if (user && data) {
            const { data: views } = await supabase
                .from("story_views")
                .select("story_id")
                .eq("viewer_id", user.id);

            const viewedIds = new Set(views?.map(v => v.story_id) || []);

            return data.map(story => ({
                ...story,
                is_viewed: viewedIds.has(story.id)
            })) as Story[];
        }

        return data as Story[];
    },

    /**
     * Get stories grouped by user
     */
    async getStoriesGroupedByUser(): Promise<Map<string, Story[]>> {
        const stories = await this.getActiveStories();
        const grouped = new Map<string, Story[]>();

        stories.forEach(story => {
            const existing = grouped.get(story.user_id) || [];
            existing.push(story);
            grouped.set(story.user_id, existing);
        });

        return grouped;
    },

    /**
     * Get featured stories
     */
    async getFeaturedStories(): Promise<Story[]> {
        const { data, error } = await supabase
            .from("stories")
            .select(`
                *,
                user:user_id(full_name, avatar_url, role)
            `)
            .eq("is_active", true)
            .eq("is_featured", true)
            .gt("expires_at", new Date().toISOString())
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching featured stories:", error);
            return [];
        }

        return data as Story[];
    },

    /**
     * Get user's own stories
     */
    async getMyStories(): Promise<Story[]> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from("stories")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching my stories:", error);
            return [];
        }

        return data as Story[];
    },

    /**
     * Create a new story
     */
    async createStory(story: {
        media_url: string;
        media_type: 'image' | 'video';
        thumbnail_url?: string;
        caption?: string;
        link_url?: string;
        link_product_id?: string;
    }): Promise<Story | null> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // Stories expire in 24 hours
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        const { data, error } = await supabase
            .from("stories")
            .insert({
                ...story,
                user_id: user.id,
                expires_at: expiresAt.toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error("Error creating story:", error);
            throw error;
        }

        return data as Story;
    },

    /**
     * Delete a story
     */
    async deleteStory(storyId: string): Promise<void> {
        const { error } = await supabase
            .from("stories")
            .delete()
            .eq("id", storyId);

        if (error) throw error;
    },

    /**
     * Mark story as viewed
     */
    async viewStory(storyId: string): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Use the database function
        await supabase.rpc("increment_story_views", {
            p_story_id: storyId,
            p_viewer_id: user.id
        });
    },

    /**
     * Get story viewers (for story owner)
     */
    async getStoryViewers(storyId: string): Promise<StoryView[]> {
        const { data, error } = await supabase
            .from("story_views")
            .select(`
                *,
                viewer:viewer_id(full_name, avatar_url)
            `)
            .eq("story_id", storyId)
            .order("viewed_at", { ascending: false });

        if (error) {
            console.error("Error fetching story viewers:", error);
            return [];
        }

        return data as StoryView[];
    },

    /**
     * Upload story media to storage
     */
    async uploadMedia(file: File): Promise<string> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from("product-media")
            .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
            .from("product-media")
            .getPublicUrl(fileName);

        return data.publicUrl;
    },

    // Admin functions

    /**
     * Get all stories (admin)
     */
    async getAllStories(includeExpired: boolean = false): Promise<Story[]> {
        let query = supabase
            .from("stories")
            .select(`
                *,
                user:user_id(full_name, avatar_url, role)
            `)
            .order("created_at", { ascending: false });

        if (!includeExpired) {
            query = query.gt("expires_at", new Date().toISOString());
        }

        const { data, error } = await query;

        if (error) {
            console.error("Error fetching all stories:", error);
            return [];
        }

        return data as Story[];
    },

    /**
     * Feature/unfeature a story (admin)
     */
    async toggleFeatured(storyId: string, featured: boolean): Promise<void> {
        const { error } = await supabase
            .from("stories")
            .update({ is_featured: featured })
            .eq("id", storyId);

        if (error) throw error;
    },

    /**
     * Deactivate a story (admin moderation)
     */
    async deactivateStory(storyId: string): Promise<void> {
        const { error } = await supabase
            .from("stories")
            .update({ is_active: false })
            .eq("id", storyId);

        if (error) throw error;
    },

    /**
     * Get story statistics (admin)
     */
    async getStoryStats(): Promise<{
        total: number;
        active: number;
        featured: number;
        totalViews: number;
    }> {
        const { data, error } = await supabase
            .from("stories")
            .select("is_active, is_featured, view_count, expires_at");

        if (error) {
            console.error("Error fetching story stats:", error);
            return { total: 0, active: 0, featured: 0, totalViews: 0 };
        }

        const now = new Date();
        return {
            total: data.length,
            active: data.filter(s => s.is_active && new Date(s.expires_at) > now).length,
            featured: data.filter(s => s.is_featured).length,
            totalViews: data.reduce((sum, s) => sum + (s.view_count || 0), 0)
        };
    }
};
