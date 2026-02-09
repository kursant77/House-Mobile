export interface TelegramUser {
    id: string;
    user_id: string;
    telegram_chat_id: number;
    telegram_username?: string;
    first_name?: string;
    last_name?: string;
    photo_url?: string;
    is_blocked: boolean;
    notification_settings: {
        orders: boolean;
        marketing: boolean;
        security: boolean;
    };
    created_at: string;
    updated_at: string;
}

export interface Referral {
    id: string;
    referrer_id: string;
    referred_user_id: string | null;
    referral_code: string;
    status: 'pending' | 'registered' | 'completed';
    reward_amount: number;
    reward_currency: string;
    first_order_id?: string;
    created_at: string;
    completed_at?: string;
    referrer?: {
        full_name: string;
        avatar_url: string;
    };
    referred_user?: {
        full_name: string;
        avatar_url: string;
    };
}

export interface ReferralSettings {
    id: string;
    reward_type: 'fixed' | 'percentage';
    reward_value: number;
    min_purchase_amount: number;
    max_rewards_per_user: number;
    is_active: boolean;
    updated_at: string;
    updated_by?: string;
}

export interface Badge {
    id: string;
    name: string;
    name_uz?: string;
    description?: string;
    description_uz?: string;
    icon_url?: string;
    color: string;
    criteria?: BadgeCriteria;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface BadgeCriteria {
    type: 'order_count' | 'review_count' | 'account_age_days' | 'sales_count' | 'manual';
    value: number | null;
}

export interface UserBadge {
    id: string;
    user_id: string;
    badge_id: string;
    awarded_at: string;
    awarded_by?: string;
    badge?: Badge;
}

export interface Story {
    id: string;
    user_id: string;
    media_url: string;
    media_type: 'image' | 'video';
    thumbnail_url?: string;
    caption?: string;
    link_url?: string;
    link_product_id?: string;
    view_count: number;
    is_active: boolean;
    is_featured: boolean;
    expires_at: string;
    created_at: string;
    user?: {
        full_name: string;
        avatar_url: string;
        is_verified?: boolean;
        role?: string;
    };
    is_viewed?: boolean;
}

export interface StoryView {
    id: string;
    story_id: string;
    viewer_id: string;
    viewed_at: string;
}

// Feature Flags
export interface FeatureFlag {
    id: string;
    key: string;
    name: string;
    name_uz?: string;
    description?: string;
    is_enabled: boolean;
    config: Record<string, unknown>;
    updated_at: string;
    updated_by?: string;
}

export type FeatureFlagKey =
    | 'stories'
    | 'referrals'
    | 'telegram_bot'
    | 'push_notifications'
    | 'voice_search'
    | 'one_click_checkout'
    | 'gamification'
    | 'smart_search';

// Push Notifications
export interface PushSubscription {
    id: string;
    user_id: string;
    fcm_token: string;
    device_type: 'web' | 'android' | 'ios';
    device_info?: Record<string, unknown>;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface PushCampaign {
    id: string;
    title: string;
    body: string;
    image_url?: string;
    link_url?: string;
    target_audience: 'all' | 'active' | 'inactive' | 'buyers' | 'sellers';
    target_filter?: {
        inactive_days?: number;
        min_orders?: number;
        has_cart?: boolean;
    };
    status: 'draft' | 'scheduled' | 'sent' | 'cancelled';
    scheduled_at?: string;
    sent_at?: string;
    sent_count: number;
    open_count: number;
    click_count: number;
    created_by?: string;
    created_at: string;
}

// Content Moderation
export type ContentType = 'story' | 'reel' | 'review' | 'product' | 'comment' | 'user';
export type ReportReason = 'spam' | 'inappropriate' | 'harassment' | 'fake' | 'copyright' | 'other';
export type ReportStatus = 'pending' | 'reviewed' | 'resolved' | 'dismissed';

export interface ContentReport {
    id: string;
    reporter_id: string;
    content_type: ContentType;
    content_id: string;
    reason: ReportReason;
    details?: string;
    status: ReportStatus;
    resolution_notes?: string;
    resolved_by?: string;
    resolved_at?: string;
    created_at: string;
    reporter?: {
        full_name: string;
        avatar_url: string;
    };
}

// Marketing Stats
export interface MarketingStats {
    totalReferrals: number;
    totalBotUsers: number;
    activeStories: number;
    totalOrders: number;
    completedReferrals?: number;
    pendingReferrals?: number;
    totalRewardsGiven?: number;
    pushSubscriptions?: number;
    pendingReports?: number;
}

// Price History
export interface ProductPriceHistory {
    id: string;
    product_id: string;
    old_price: number;
    new_price: number;
    changed_at: string;
}
