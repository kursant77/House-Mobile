import { supabase } from "@/lib/supabase";
import { handleError } from "@/lib/errorHandler";
import { RoleApplication, CreateApplicationData } from "@/types/application";

export const applicationService = {
    /**
     * Submit a new application
     */
    submitApplication: async (data: CreateApplicationData): Promise<void> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Avtorizatsiya zarur");

        // Check if user already has a pending application of this type
        const { data: existing } = await supabase
            .from('role_applications')
            .select('id')
            .eq('user_id', user.id)
            .eq('type', data.type)
            .eq('status', 'pending');

        if (existing && existing.length > 0) {
            throw new Error(`Sizda allaqachon kutilayotgan ${data.type === 'seller' ? 'sotuvchi' : 'blogger'}lik arizasi mavjud`);
        }

        const { error } = await supabase
            .from('role_applications')
            .insert([{
                user_id: user.id,
                type: data.type,
                full_name: data.fullName,
                phone: data.phone,
                email: data.email,
                telegram: data.telegram,
                instagram: data.instagram,
                business_name: data.businessName,
                business_description: data.businessDescription,
                content_theme: data.contentTheme,
                audience_size: data.audienceSize,
                reason: data.reason,
                status: 'pending'
            }]);

        if (error) {
            const appError = handleError(error, 'submitApplication');
            throw new Error(appError.message);
        }
    },

    /**
     * Get user's applications
     */
    getUserApplications: async (): Promise<RoleApplication[]> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('role_applications')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            handleError(error, 'getUserApplications');
            return [];
        }

        return (data || []).map(app => applicationService.mapApplication(app));
    },

    /**
     * Admin: Get all applications
     */
    getAllApplications: async (): Promise<RoleApplication[]> => {
        const { data, error } = await supabase
            .from('role_applications')
            .select(`
                *,
                profiles(full_name, avatar_url, username)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            const appError = handleError(error, 'getAllApplications');
            throw new Error(appError.message);
        }

        return (data || []).map(app => ({
            ...applicationService.mapApplication(app),
            user: app.profiles ? {
                fullName: app.profiles.full_name,
                avatarUrl: app.profiles.avatar_url,
                username: app.profiles.username
            } : undefined
        }));
    },

    /**
     * Admin: Update application status
     */
    updateApplicationStatus: async (id: string, status: 'approved' | 'rejected'): Promise<void> => {
        const { data: application, error: fetchError } = await supabase
            .from('role_applications')
            .select('user_id, type')
            .eq('id', id)
            .single();

        if (fetchError || !application) throw new Error("Ariza topilmadi");

        const { error } = await supabase
            .from('role_applications')
            .update({
                status,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) {
            const appError = handleError(error, 'updateApplicationStatus');
            throw new Error(appError.message);
        }

        // If approved, update user role
        if (status === 'approved') {
            const { error: roleError } = await supabase
                .from('profiles')
                .update({ role: application.type })
                .eq('id', application.user_id);

            if (roleError) {
                console.error("Failed to update user role after application approval:", roleError);
                // We don't throw here to avoid inconsistency if the application status was updated
            }
        }
    },

    mapApplication: (app: any): RoleApplication => ({
        id: app.id,
        userId: app.user_id,
        type: app.type,
        status: app.status,
        fullName: app.full_name,
        phone: app.phone,
        email: app.email,
        telegram: app.telegram,
        instagram: app.instagram,
        businessName: app.business_name,
        businessDescription: app.business_description,
        contentTheme: app.content_theme,
        audienceSize: app.audience_size,
        reason: app.reason,
        createdAt: app.created_at,
        updatedAt: app.updated_at
    })
};
