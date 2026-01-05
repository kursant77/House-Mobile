import { create } from "zustand";
import { Product } from "@/types/product";
import { userDataService } from "@/services/api/userData";

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
      console.error("Failed to fetch cart", error);
      set({ isLoading: false });
    }
  },

  addToCart: async (product, quantity = 1) => {
    const { items } = get();
    const existingItem = items.find((item) => item.product.id === product.id);

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
  },

  removeFromCart: async (productId) => {
    set({ items: get().items.filter((item) => item.product.id !== productId) });
    await userDataService.removeFromCart(productId);
  },

  updateQuantity: async (productId, quantity) => {
    if (quantity <= 0) {
      await get().removeFromCart(productId);
      return;
    }
    set({
      items: get().items.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      ),
    });
    await userDataService.updateCartQuantity(productId, quantity);
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
    set({ items: [] });
    await userDataService.clearCart();
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
