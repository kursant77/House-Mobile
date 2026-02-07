import { Product } from "@/types/product";
import { SupabaseProductWithRelations, SupabaseProductMedia } from "@/types/api";

/**
 * Map Supabase product with relations to Product type
 * Shared utility to reduce code duplication
 */
export function mapSupabaseProductToProduct(p: SupabaseProductWithRelations): Product {
  const productMedia = Array.isArray(p.product_media) ? p.product_media : (p.product_media ? [p.product_media] : []);

  return {
    id: p.id,
    title: p.title,
    description: p.description,
    price: p.price,
    currency: p.currency,
    category: p.category,
    inStock: p.in_stock,
    rating: p.rating ?? undefined,
    reviewCount: p.review_count ?? undefined,
    sellerId: p.seller_id,
    views: p.views ?? 0,
    createdAt: p.created_at,
    author: p.profiles ? {
      id: p.profiles.id,
      fullName: p.profiles.full_name ?? undefined,
      username: p.profiles.username ?? undefined,
      avatarUrl: p.profiles.avatar_url ?? undefined,
      role: p.profiles.role === 'admin' ? 'super_admin' : p.profiles.role as any,
    } : undefined,
    images: productMedia.filter((m: SupabaseProductMedia) => m.type === 'image').map((m: SupabaseProductMedia) => m.url),
    videoUrl: productMedia.find((m: SupabaseProductMedia) => m.type === 'video')?.url,
  };
}

/**
 * Map array of Supabase products to Product array
 */
export function mapSupabaseProductsToProducts(products: SupabaseProductWithRelations[] | null | undefined): Product[] {
  if (!products || !Array.isArray(products)) {
    return [];
  }
  return products.map(mapSupabaseProductToProduct);
}
