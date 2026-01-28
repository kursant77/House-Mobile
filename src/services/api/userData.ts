import { supabase } from "@/lib/supabase";
import { Product } from "@/types/product";
import { SupabaseCartItem, SupabaseFavoriteItem } from "@/types/cart";
import { mapSupabaseProductToProduct } from "@/lib/productMapper";
import { SupabaseProductWithRelations } from "@/types/api";

export const userDataService = {
    // --- Favorites ---
    getFavorites: async (): Promise<Product[]> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('favorites')
            .select(`
        product_id,
        products (
          *,
          product_media (*)
        )
      `)
            .eq('user_id', user.id);

        if (error) throw error;

        return (data as SupabaseFavoriteItem[]).map(item => 
            mapSupabaseProductToProduct(item.products as SupabaseProductWithRelations)
        );
    },

    addFavorite: async (productId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase.from('favorites').insert([{ user_id: user.id, product_id: productId }]);
    },

    removeFavorite: async (productId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase.from('favorites').delete().eq('user_id', user.id).eq('product_id', productId);
    },

    // --- Cart ---
    getCart: async (): Promise<{ product: Product; quantity: number }[]> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('cart')
            .select(`
        quantity,
        products (
          *,
          product_media (*)
        )
      `)
            .eq('user_id', user.id);

        if (error) throw error;

        return (data as SupabaseCartItem[]).map(item => ({
            quantity: item.quantity,
            product: mapSupabaseProductToProduct(item.products as SupabaseProductWithRelations)
        }));
    },

    addToCart: async (productId: string, quantity: number = 1) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: existing } = await supabase
            .from('cart')
            .select('quantity')
            .eq('user_id', user.id)
            .eq('product_id', productId)
            .single();

        if (existing) {
            await supabase
                .from('cart')
                .update({ quantity: existing.quantity + quantity })
                .eq('user_id', user.id)
                .eq('product_id', productId);
        } else {
            await supabase
                .from('cart')
                .insert([{ user_id: user.id, product_id: productId, quantity }]);
        }
    },

    updateCartQuantity: async (productId: string, quantity: number) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        if (quantity <= 0) {
            await supabase.from('cart').delete().eq('user_id', user.id).eq('product_id', productId);
        } else {
            await supabase
                .from('cart')
                .update({ quantity })
                .eq('user_id', user.id)
                .eq('product_id', productId);
        }
    },

    removeFromCart: async (productId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase.from('cart').delete().eq('user_id', user.id).eq('product_id', productId);
    },

    clearCart: async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await supabase.from('cart').delete().eq('user_id', user.id);
    }
};
