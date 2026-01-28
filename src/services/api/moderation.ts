import { supabase } from "@/lib/supabase";
import { handleError } from "@/lib/errorHandler";

export type ReportType = "product" | "post" | "user" | "comment" | "message";
export type ReportReason = 
  | "spam"
  | "inappropriate"
  | "harassment"
  | "violence"
  | "fake"
  | "copyright"
  | "other";

export type ReportStatus = "pending" | "reviewed" | "resolved" | "dismissed";

export interface Report {
  id: string;
  reporterId: string;
  targetType: ReportType;
  targetId: string;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  reporter?: {
    id: string;
    fullName: string;
    avatarUrl?: string;
  };
  target?: {
    title?: string;
    content?: string;
    userId?: string;
  };
}

export const moderationService = {
  /**
   * Submit a report
   */
  submitReport: async (data: {
    targetType: ReportType;
    targetId: string;
    reason: ReportReason;
    description?: string;
  }): Promise<Report | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Avtorizatsiya zarur");

      // Check if user already reported this target
      const { data: existing } = await supabase
        .from("reports")
        .select("id")
        .eq("reporter_id", user.id)
        .eq("target_type", data.targetType)
        .eq("target_id", data.targetId)
        .maybeSingle();

      if (existing) {
        throw new Error("Siz bu kontentni allaqachon shikoyat qilgansiz");
      }

      const { data: report, error } = await supabase
        .from("reports")
        .insert([{
          reporter_id: user.id,
          target_type: data.targetType,
          target_id: data.targetId,
          reason: data.reason,
          description: data.description,
          status: "pending",
        }])
        .select()
        .single();

      if (error) throw error;

      return {
        id: report.id,
        reporterId: report.reporter_id,
        targetType: report.target_type,
        targetId: report.target_id,
        reason: report.reason,
        description: report.description,
        status: report.status,
        createdAt: report.created_at,
      };
    } catch (error) {
      handleError(error, "submitReport");
      throw error;
    }
  },

  /**
   * Get all reports (admin only)
   */
  getReports: async (status?: ReportStatus): Promise<Report[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Check if user is admin
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "super_admin") {
        throw new Error("Sizda bu amalni bajarish uchun ruxsat yo'q");
      }

      let query = supabase
        .from("reports")
        .select(`
          *,
          reporter:profiles!reporter_id(id, full_name, avatar_url)
        `)
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(report => ({
        id: report.id,
        reporterId: report.reporter_id,
        targetType: report.target_type,
        targetId: report.target_id,
        reason: report.reason,
        description: report.description,
        status: report.status,
        reviewedBy: report.reviewed_by,
        reviewedAt: report.reviewed_at,
        createdAt: report.created_at,
        reporter: report.reporter ? {
          id: report.reporter.id,
          fullName: report.reporter.full_name,
          avatarUrl: report.reporter.avatar_url,
        } : undefined,
      }));
    } catch (error) {
      handleError(error, "getReports");
      return [];
    }
  },

  /**
   * Get report statistics (admin only)
   */
  getReportStats: async (): Promise<{
    pending: number;
    reviewed: number;
    resolved: number;
    dismissed: number;
    total: number;
  }> => {
    try {
      const { data, error } = await supabase
        .from("reports")
        .select("status");

      if (error) throw error;

      const stats = {
        pending: 0,
        reviewed: 0,
        resolved: 0,
        dismissed: 0,
        total: data?.length || 0,
      };

      data?.forEach(report => {
        if (report.status === "pending") stats.pending++;
        if (report.status === "reviewed") stats.reviewed++;
        if (report.status === "resolved") stats.resolved++;
        if (report.status === "dismissed") stats.dismissed++;
      });

      return stats;
    } catch (error) {
      handleError(error, "getReportStats");
      return { pending: 0, reviewed: 0, resolved: 0, dismissed: 0, total: 0 };
    }
  },

  /**
   * Update report status (admin only)
   */
  updateReportStatus: async (
    reportId: string,
    status: ReportStatus
  ): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Avtorizatsiya zarur");

      const { error } = await supabase
        .from("reports")
        .update({
          status,
          reviewed_by: user.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", reportId);

      if (error) throw error;
      return true;
    } catch (error) {
      handleError(error, "updateReportStatus");
      return false;
    }
  },

  /**
   * Block a user (admin only)
   */
  blockUser: async (userId: string, reason: string): Promise<boolean> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Avtorizatsiya zarur");

      // Update user's blocked status
      const { error } = await supabase
        .from("profiles")
        .update({
          is_blocked: true,
          blocked_reason: reason,
          blocked_at: new Date().toISOString(),
          blocked_by: user.id,
        })
        .eq("id", userId);

      if (error) throw error;
      return true;
    } catch (error) {
      handleError(error, "blockUser");
      return false;
    }
  },

  /**
   * Unblock a user (admin only)
   */
  unblockUser: async (userId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          is_blocked: false,
          blocked_reason: null,
          blocked_at: null,
          blocked_by: null,
        })
        .eq("id", userId);

      if (error) throw error;
      return true;
    } catch (error) {
      handleError(error, "unblockUser");
      return false;
    }
  },

  /**
   * Get blocked users (admin only)
   */
  getBlockedUsers: async (): Promise<Array<{
    id: string;
    fullName: string;
    email?: string;
    blockedReason?: string;
    blockedAt?: string;
  }>> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, blocked_reason, blocked_at")
        .eq("is_blocked", true)
        .order("blocked_at", { ascending: false });

      if (error) throw error;

      return (data || []).map(user => ({
        id: user.id,
        fullName: user.full_name,
        blockedReason: user.blocked_reason,
        blockedAt: user.blocked_at,
      }));
    } catch (error) {
      handleError(error, "getBlockedUsers");
      return [];
    }
  },

  /**
   * Hide/remove content (admin only)
   */
  hideContent: async (
    targetType: ReportType,
    targetId: string
  ): Promise<boolean> => {
    try {
      let tableName = "";
      
      switch (targetType) {
        case "product":
          tableName = "products";
          break;
        case "post":
          tableName = "posts";
          break;
        case "comment":
          tableName = "comments";
          break;
        default:
          throw new Error("Noto'g'ri kontent turi");
      }

      const { error } = await supabase
        .from(tableName)
        .update({ is_hidden: true })
        .eq("id", targetId);

      if (error) throw error;
      return true;
    } catch (error) {
      handleError(error, "hideContent");
      return false;
    }
  },
};
