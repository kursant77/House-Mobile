import { supabase } from "@/lib/supabase";
import { Product } from "@/types/product";
import { SupabaseCartItem, SupabaseFavoriteItem } from "@/types/cart";
import { mapSupabaseProductToProduct } from "@/lib/productMapper";
import { SupabaseProductWithRelations } from "@/types/api";
import { logger } from "@/lib/logger";

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
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError) throw authError;
            if (!user) throw new Error('Foydalanuvchi topilmadi');

            const { error } = await supabase
                .from('favorites')
                .insert([{ user_id: user.id, product_id: productId }]);

            if (error) throw error;
        } catch (error) {
            logger.error('Sevimligalrga qo\'shishda xato:', error);
            throw error;
        }
    },

    removeFavorite: async (productId: string) => {
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError) throw authError;
            if (!user) throw new Error('Foydalanuvchi topilmadi');

            const { error } = await supabase
                .from('favorites')
                .delete()
                .eq('user_id', user.id)
                .eq('product_id', productId);

            if (error) throw error;
        } catch (error) {
            logger.error('Sevimlilardan o\'chirishda xato:', error);
            throw error;
        }
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
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError) throw authError;
            if (!user) throw new Error('Foydalanuvchi topilmadi');

            const { data: existing, error: selectError } = await supabase
                .from('cart')
                .select('quantity')
                .eq('user_id', user.id)
                .eq('product_id', productId)
                .single();

            if (selectError && selectError.code !== 'PGRST116') {
                throw selectError;
            }

            if (existing) {
                const { error } = await supabase
                    .from('cart')
                    .update({ quantity: existing.quantity + quantity })
                    .eq('user_id', user.id)
                    .eq('product_id', productId);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('cart')
                    .insert([{ user_id: user.id, product_id: productId, quantity }]);

                if (error) throw error;
            }
        } catch (error) {
            logger.error('Savatga qo\'shishda xato:', error);
            throw error;
        }
    },

    updateCartQuantity: async (productId: string, quantity: number) => {
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError) throw authError;
            if (!user) throw new Error('Foydalanuvchi topilmadi');

            if (quantity <= 0) {
                const { error } = await supabase
                    .from('cart')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('product_id', productId);

                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('cart')
                    .update({ quantity })
                    .eq('user_id', user.id)
                    .eq('product_id', productId);

                if (error) throw error;
            }
        } catch (error) {
            logger.error('Savat miqdorini yangilashda xato:', error);
            throw error;
        }
    },

    removeFromCart: async (productId: string) => {
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError) throw authError;
            if (!user) throw new Error('Foydalanuvchi topilmadi');

            const { error } = await supabase
                .from('cart')
                .delete()
                .eq('user_id', user.id)
                .eq('product_id', productId);

            if (error) throw error;
        } catch (error) {
            logger.error('Savatdan o\'chirishda xato:', error);
            throw error;
        }
    },

    clearCart: async () => {
        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (authError) throw authError;
            if (!user) throw new Error('Foydalanuvchi topilmadi');

            const { error } = await supabase
                .from('cart')
                .delete()
                .eq('user_id', user.id);

            if (error) throw error;
        } catch (error) {
            logger.error('Savatni tozalashda xato:', error);
            throw error;
        }
    }
};
