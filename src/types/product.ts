export interface Profile {
  id: string;
  fullName?: string;
  avatarUrl?: string;
  bio?: string;
  address?: string;
  telegram?: string;
  instagram?: string;
  facebook?: string;
  sellerRating?: number;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  originalPrice?: number;
  currency: string;
  images: string[];
  videoUrl?: string;
  category: string;
  inStock: boolean;
  rating?: number;
  reviewCount?: number;
  sellerId: string;
  views?: number;
  author?: Profile;
}

export interface ReelItem {
  id: string;
  videoUrl: string;
  thumbnailUrl: string;
  product: Product;
  likes: number;
  commentCount: number;
  author?: Profile;
  isLiked: boolean;
  isFavorite: boolean;
}
