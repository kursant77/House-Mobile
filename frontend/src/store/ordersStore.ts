import { create } from "zustand";
import { orderService, Order, CreateOrderData, OrderItem } from "@/services/api/orders";

interface OrderWithItems extends Order {
  items?: OrderItem[];
}

interface OrdersState {
  orders: Order[];
  currentOrder: OrderWithItems | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchOrders: () => Promise<void>;
  fetchOrderById: (orderId: string) => Promise<void>;
  createOrder: (data: CreateOrderData) => Promise<Order>;
  cancelOrder: (orderId: string) => Promise<void>;
  
  // Admin actions
  fetchAllOrders: (status?: Order['status']) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order['status']) => Promise<void>;
  
  // Utils
  clearCurrentOrder: () => void;
  clearError: () => void;
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: [],
  currentOrder: null,
  isLoading: false,
  error: null,

  fetchOrders: async () => {
    set({ isLoading: true, error: null });
    try {
      const orders = await orderService.getUserOrders();
      set({ orders, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : "Buyurtmalarni yuklashda xatolik",
        isLoading: false 
      });
    }
  },

  fetchOrderById: async (orderId: string) => {
    set({ isLoading: true, error: null });
    try {
      const order = await orderService.getOrderById(orderId);
      if (order) {
        const items = await orderService.getOrderItems(orderId);
        set({ currentOrder: { ...order, items }, isLoading: false });
      } else {
        set({ currentOrder: null, error: "Buyurtma topilmadi", isLoading: false });
      }
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : "Buyurtmani yuklashda xatolik",
        isLoading: false 
      });
    }
  },

  createOrder: async (data: CreateOrderData) => {
    set({ isLoading: true, error: null });
    try {
      const order = await orderService.createOrder(data);
      set(state => ({ 
        orders: [order, ...state.orders],
        currentOrder: order,
        isLoading: false 
      }));
      return order;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : "Buyurtma yaratishda xatolik",
        isLoading: false 
      });
      throw error;
    }
  },

  cancelOrder: async (orderId: string) => {
    set({ isLoading: true, error: null });
    try {
      await orderService.cancelOrder(orderId);
      set(state => ({
        orders: state.orders.map(o => 
          o.id === orderId ? { ...o, status: 'cancelled' as const } : o
        ),
        currentOrder: state.currentOrder?.id === orderId 
          ? { ...state.currentOrder, status: 'cancelled' as const }
          : state.currentOrder,
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : "Buyurtmani bekor qilishda xatolik",
        isLoading: false 
      });
      throw error;
    }
  },

  fetchAllOrders: async (status?: Order['status']) => {
    set({ isLoading: true, error: null });
    try {
      const orders = await orderService.getAllOrders(status);
      set({ orders, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : "Buyurtmalarni yuklashda xatolik",
        isLoading: false 
      });
    }
  },

  updateOrderStatus: async (orderId: string, status: Order['status']) => {
    set({ isLoading: true, error: null });
    try {
      await orderService.updateOrderStatus(orderId, status);
      set(state => ({
        orders: state.orders.map(o => 
          o.id === orderId ? { ...o, status } : o
        ),
        currentOrder: state.currentOrder?.id === orderId 
          ? { ...state.currentOrder, status }
          : state.currentOrder,
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : "Buyurtma statusini yangilashda xatolik",
        isLoading: false 
      });
      throw error;
    }
  },

  clearCurrentOrder: () => {
    set({ currentOrder: null });
  },

  clearError: () => {
    set({ error: null });
  },
}));
