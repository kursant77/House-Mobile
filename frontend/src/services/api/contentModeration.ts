import { supabase } from "@/lib/supabase";
import { ContentReport, ContentType, ReportReason, ReportStatus } from "@/types/marketing";

export const contentModerationService = {
    /**
     * Report content
     */
    async reportContent(
        contentType: ContentType,
        contentId: string,
        reason: ReportReason,
        details?: string
    ): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { error } = await supabase
            .from("content_reports")
            .insert({
                reporter_id: user.id,
                content_type: contentType,
                content_id: contentId,
                reason,
                details
            });

        if (error) {
            console.error("Error reporting content:", error);
            throw error;
        }
    },

    /**
     * Get all reports (admin)
     */
    async getAllReports(
        status?: ReportStatus,
        page: number = 1,
        pageSize: number = 20
    ): Promise<{
        reports: ContentReport[];
        total: number;
    }> {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase
            .from("content_reports")
            .select(`
                *,
                reporter:reporter_id(full_name, avatar_url)
            `, { count: 'exact' });

        if (status) {
            query = query.eq("status", status);
        }

        const { data, error, count } = await query
            .order("created_at", { ascending: false })
            .range(from, to);

        if (error) {
            console.error("Error fetching reports:", error);
            return { reports: [], total: 0 };
        }

        return {
            reports: data as ContentReport[],
            total: count || 0
        };
    },

    /**
     * Get pending reports count (admin)
     */
    async getPendingCount(): Promise<number> {
        const { count, error } = await supabase
            .from("content_reports")
            .select("id", { count: 'exact', head: true })
            .eq("status", "pending");

        if (error) {
            console.error("Error fetching pending count:", error);
            return 0;
        }

        return count || 0;
    },

    /**
     * Get reports by content type (admin)
     */
    async getReportsByType(contentType: ContentType): Promise<ContentReport[]> {
        const { data, error } = await supabase
            .from("content_reports")
            .select(`
                *,
                reporter:reporter_id(full_name, avatar_url)
            `)
            .eq("content_type", contentType)
            .eq("status", "pending")
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching reports by type:", error);
            return [];
        }

        return data as ContentReport[];
    },

    /**
     * Resolve a report (admin)
     */
    async resolveReport(
        reportId: string,
        status: 'resolved' | 'dismissed',
        notes?: string
    ): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        const { error } = await supabase
            .from("content_reports")
            .update({
                status,
                resolution_notes: notes,
                resolved_by: user.id,
                resolved_at: new Date().toISOString()
            })
            .eq("id", reportId);

        if (error) throw error;
    },

    /**
     * Mark report as reviewed (admin)
     */
    async markAsReviewed(reportId: string): Promise<void> {
        const { error } = await supabase
            .from("content_reports")
            .update({
                status: 'reviewed'
            })
            .eq("id", reportId);

        if (error) throw error;
    },

    /**
     * Delete content and resolve all reports (admin)
     */
    async deleteContentAndResolve(
        contentType: ContentType,
        contentId: string,
        notes: string = "Content deleted"
    ): Promise<void> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");

        // First, delete the content based on type
        const tableMap: Record<ContentType, string> = {
            story: 'stories',
            reel: 'reels',
            review: 'product_comments',
            product: 'products',
            comment: 'public_post_comments',
            user: 'profiles'
        };

        const tableName = tableMap[contentType];

        if (contentType === 'user') {
            // For users, we block instead of delete
            await supabase
                .from(tableName)
                .update({ is_blocked: true })
                .eq("id", contentId);
        } else {
            await supabase
                .from(tableName)
                .delete()
                .eq("id", contentId);
        }

        // Resolve all reports for this content
        await supabase
            .from("content_reports")
            .update({
                status: 'resolved',
                resolution_notes: notes,
                resolved_by: user.id,
                resolved_at: new Date().toISOString()
            })
            .eq("content_type", contentType)
            .eq("content_id", contentId);
    },

    /**
     * Get report statistics (admin dashboard)
     */
    async getReportStats(): Promise<{
        total: number;
        pending: number;
        resolved: number;
        dismissed: number;
        byType: Record<ContentType, number>;
    }> {
        const { data, error } = await supabase
            .from("content_reports")
            .select("status, content_type");

        if (error) {
            console.error("Error fetching report stats:", error);
            return {
                total: 0,
                pending: 0,
                resolved: 0,
                dismissed: 0,
                byType: {} as Record<ContentType, number>
            };
        }

        const stats = {
            total: data.length,
            pending: 0,
            resolved: 0,
            dismissed: 0,
            byType: {} as Record<ContentType, number>
        };

        data.forEach(report => {
            // Count by status
            if (report.status === 'pending') stats.pending++;
            else if (report.status === 'resolved') stats.resolved++;
            else if (report.status === 'dismissed') stats.dismissed++;

            // Count by type
            const type = report.content_type as ContentType;
            stats.byType[type] = (stats.byType[type] || 0) + 1;
        });

        return stats;
    }
};
