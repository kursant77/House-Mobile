import { create } from "zustand";
import { Product } from "@/types/product";
import { userDataService } from "@/services/api/userData";
import { logger } from "@/lib/logger";
import { toast } from "sonner";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  isLoading: boolean;

  // Actions
  fetchCart: () => Promise<void>;
  addToCart: (product: Product, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  incrementQuantity: (productId: string) => Promise<void>;
  decrementQuantity: (productId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  getItemCount: () => number;
  getTotal: () => number;
  isInCart: (productId: string) => boolean;
  resetCart: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  isLoading: false,

  fetchCart: async () => {
    set({ isLoading: true });
    try {
      const items = await userDataService.getCart();
      set({ items, isLoading: false });
    } catch (error) {
      logger.error('Savatni yuklashda xato:', error);
      set({ items: [], isLoading: false });
      toast.error('Savat ma\'lumotlarini yuklashda xatolik');
    }
  },

  addToCart: async (product, quantity = 1) => {
    try {
      const { items } = get();
      const existingItem = items.find((item) => item.product.id === product.id);

      // Optimistic update
      if (existingItem) {
        set({
          items: items.map((item) =>
            item.product.id === product.id
              ? { ...item, quantity: item.quantity + quantity }
              : item
          ),
        });
      } else {
        set({ items: [...items, { product, quantity }] });
      }

      await userDataService.addToCart(product.id, quantity);
    } catch (error) {
      logger.error('Savatga qo\'shishda xato:', error);
      toast.error('Mahsulotni savatga qo\'shib bo\'lmadi');
      // Revert on error
      await get().fetchCart();
      throw error;
    }
  },

  removeFromCart: async (productId) => {
    try {
      // Optimistic update
      set({ items: get().items.filter((item) => item.product.id !== productId) });

      await userDataService.removeFromCart(productId);
    } catch (error) {
      logger.error('Savatdan o\'chirishda xato:', error);
      toast.error('Mahsulotni o\'chirib bo\'lmadi');
      // Revert on error
      await get().fetchCart();
      throw error;
    }
  },

  updateQuantity: async (productId, quantity) => {
    try {
      if (quantity <= 0) {
        await get().removeFromCart(productId);
        return;
      }

      // Optimistic update
      set({
        items: get().items.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item
        ),
      });

      await userDataService.updateCartQuantity(productId, quantity);
    } catch (error) {
      logger.error('Miqdorni yangilashda xato:', error);
      toast.error('Miqdorni yangilab bo\'lmadi');
      // Revert on error
      await get().fetchCart();
      throw error;
    }
  },

  incrementQuantity: async (productId) => {
    const item = get().items.find((i) => i.product.id === productId);
    if (item) {
      await get().updateQuantity(productId, item.quantity + 1);
    }
  },

  decrementQuantity: async (productId) => {
    const item = get().items.find((i) => i.product.id === productId);
    if (item) {
      await get().updateQuantity(productId, item.quantity - 1);
    }
  },

  clearCart: async () => {
    try {
      // Optimistic update
      set({ items: [] });

      await userDataService.clearCart();
    } catch (error) {
      logger.error('Savatni tozalashda xato:', error);
      toast.error('Savatni tozalab bo\'lmadi');
      // Revert on error
      await get().fetchCart();
      throw error;
    }
  },

  resetCart: () => {
    set({ items: [] });
  },

  getItemCount: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },

  getTotal: () => {
    return get().items.reduce(
      (total, item) => total + item.product.price * item.quantity,
      0
    );
  },

  isInCart: (productId) => {
    return get().items.some((item) => item.product.id === productId);
  },
}));
