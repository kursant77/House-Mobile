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
}

export interface ReelItem {
  id: string;
  videoUrl: string;
  thumbnailUrl: string;
  product: Product;
  likes: number;
  isLiked: boolean;
  isFavorite: boolean;
}
