// API Response Types
export interface SupabaseProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: 'user' | 'blogger' | 'super_admin' | 'admin' | 'seller';
  is_professional: boolean;
  is_blocked: boolean;
  bio: string | null;
  address: string | null;
  telegram: string | null;
  instagram: string | null;
  facebook: string | null;
  youtube: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SupabaseProduct {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  category: string;
  in_stock: boolean;
  rating: number | null;
  review_count: number | null;
  views: number | null;
  created_at: string;
  updated_at: string;
}

export interface SupabaseProductMedia {
  id: string;
  product_id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail_url: string | null;
  order_index: number;
}

export interface SupabaseProductWithRelations extends SupabaseProduct {
  product_media: SupabaseProductMedia[];
  profiles?: SupabaseProfile;
}

export interface SupabasePublicPost {
  id: string;
  author_id: string;
  title: string | null;
  content: string;
  media_url: string | null;
  media_type: 'image' | 'video' | null;
  category: string;
  views: number;
  created_at: string;
  updated_at: string;
}

export interface SupabasePublicPostWithAuthor extends SupabasePublicPost {
  profiles?: SupabaseProfile;
}

export interface SupabaseComment {
  id: string;
  post_id?: string;
  product_id?: string;
  user_id: string;
  content: string;
  text?: string; // For product comments
  parent_id?: string | null;
  parent_comment_id?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupabaseCommentWithUser extends SupabaseComment {
  profiles?: SupabaseProfile;
}

export interface SupabaseFollow {
  follower_id: string;
  following_id: string;
  created_at: string;
}

export interface SupabaseProductLike {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

export interface SupabaseCommentLike {
  id: string;
  user_id: string;
  comment_id: string;
  created_at: string;
}

export interface SupabaseViewHistory {
  id: string;
  user_id: string;
  content_type: 'reel' | 'post' | 'product';
  content_id: string;
  viewed_at: string;
}

export interface SupabaseWatchLater {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
}

export interface SupabaseNotification {
  id: string;
  created_at: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  target: 'all' | 'admin' | 'seller' | 'user';
  read_by: string[];
  user_id: string | null;
  sender_id: string | null;
}

export interface SupabaseSupportTicket {
  id: string;
  ticket_number: string;
  user_id: string;
  issue_title: string;
  issue_description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'pending' | 'resolved' | 'closed';
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface SupabaseAdminMessage {
  id: string;
  from_user_id: string;
  to_user_id: string;
  message: string;
  status: 'unread' | 'read' | 'replied' | 'pending';
  created_at: string;
  updated_at: string;
}

export interface SupabaseEmailCampaign {
  id: string;
  title: string;
  content: string;
  target_audience: 'all' | 'admin' | 'seller' | 'premium';
  status: 'draft' | 'sent' | 'scheduled';
  sent_count: number;
  sent_at: string | null;
  created_at: string;
  created_by: string | null;
}

export interface SupabasePlatformSetting {
  id: string;
  setting_key: string;
  setting_value: Record<string, unknown>;
  category: string;
  description: string | null;
  is_enabled: boolean;
  updated_at: string;
  updated_by: string | null;
}
