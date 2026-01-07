import { supabase } from "@/lib/supabase";

export interface EmailCampaign {
    id: string;
    title: string;
    content: string;
    target_audience: 'all' | 'admin' | 'seller' | 'premium';
    status: 'draft' | 'sent' | 'scheduled';
    sent_count: number;
    sent_at?: string;
    created_at: string;
    created_by?: string;
}

export const emailCampaignsApi = {
    // Get all campaigns
    async getCampaigns() {
        const { data, error } = await supabase
            .from('email_campaigns')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as EmailCampaign[];
    },

    // Create campaign
    async createCampaign(campaign: {
        title: string;
        content: string;
        target_audience: EmailCampaign['target_audience'];
    }) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { data, error } = await supabase
            .from('email_campaigns')
            .insert({
                ...campaign,
                created_by: user.id,
                status: 'draft'
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Send campaign
    async sendCampaign(campaignId: string) {
        // Get campaign
        const { data: campaign, error: fetchError } = await supabase
            .from('email_campaigns')
            .select('*')
            .eq('id', campaignId)
            .single();

        if (fetchError) throw fetchError;

        // Get target users
        let query = supabase.from('profiles').select('email');

        if (campaign.target_audience === 'admin') {
            query = query.eq('role', 'super_admin');
        } else if (campaign.target_audience === 'seller') {
            query = query.eq('role', 'seller');
        }
        // 'all' and 'premium' - fetch all for now

        const { data: users, error: usersError } = await query;
        if (usersError) throw usersError;

        const recipientCount = users?.length || 0;

        // Update campaign status
        const { data, error } = await supabase
            .from('email_campaigns')
            .update({
                status: 'sent',
                sent_count: recipientCount,
                sent_at: new Date().toISOString()
            })
            .eq('id', campaignId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Update campaign
    async updateCampaign(
        campaignId: string,
        updates: Partial<Pick<EmailCampaign, 'title' | 'content' | 'target_audience'>>
    ) {
        const { data, error } = await supabase
            .from('email_campaigns')
            .update(updates)
            .eq('id', campaignId)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    // Delete campaign
    async deleteCampaign(campaignId: string) {
        const { error } = await supabase
            .from('email_campaigns')
            .delete()
            .eq('id', campaignId);

        if (error) throw error;
    }
};
