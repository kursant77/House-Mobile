import { Product } from "./product";

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface SupabaseCartItem {
  id: string;
  user_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  products: {
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
    product_media: Array<{
      id: string;
      product_id: string;
      type: 'image' | 'video';
      url: string;
      thumbnail_url: string | null;
      order_index: number;
    }>;
  };
}

export interface SupabaseFavoriteItem {
  product_id: string;
  products: {
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
    product_media: Array<{
      id: string;
      product_id: string;
      type: 'image' | 'video';
      url: string;
      thumbnail_url: string | null;
      order_index: number;
    }>;
  };
}
