import { supabase } from "@/lib/supabase";
import { handleError } from "@/lib/errorHandler";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rateLimiter";

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
  currency: string;
}

export interface OrderItemWithProduct extends OrderItem {
  id: string;
  product: {
    title: string;
    image: string | null;
  } | null;
}

export interface CreateOrderData {
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  notes?: string;
  items: OrderItem[];
  totalAmount: number;
  currency: string;
  paymentMethod?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  notes?: string;
  totalAmount: number;
  currency: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  user?: {
    fullName: string;
    avatarUrl: string;
    username?: string;
  };
}

export const orderService = {
  /**
   * Create a new order with items
   */
  createOrder: async (orderData: CreateOrderData): Promise<Order> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Avtorizatsiya zarur");
    }

    // Rate limiting for order creation
    checkRateLimit(`create-order:${user.id}`, RATE_LIMITS.FORM_SUBMIT);

    // Build notes with payment method info
    const paymentNote = orderData.paymentMethod ? `To'lov usuli: ${orderData.paymentMethod}` : '';
    const combinedNotes = [orderData.notes, paymentNote].filter(Boolean).join('. ') || null;

    // 1. Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{
        user_id: user.id,
        customer_name: orderData.customerName,
        customer_phone: orderData.customerPhone,
        customer_address: orderData.customerAddress,
        notes: combinedNotes,
        total_amount: orderData.totalAmount,
        currency: orderData.currency,
        status: 'pending',
      }])
      .select()
      .single();

    if (orderError) {
      const appError = handleError(orderError, 'createOrder');
      throw new Error(appError.message);
    }

    // 2. Create order items
    const orderItems = orderData.items.map(item => ({
      order_id: order.id,
      product_id: item.productId,
      quantity: item.quantity,
      price: item.price,
      currency: item.currency,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      // Rollback order if items insert fails
      await supabase.from('orders').delete().eq('id', order.id);
      const appError = handleError(itemsError, 'createOrderItems');
      throw new Error(appError.message);
    }

    return {
      id: order.id,
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      customerAddress: order.customer_address,
      notes: order.notes ?? undefined,
      totalAmount: Number(order.total_amount),
      currency: order.currency,
      status: order.status as Order['status'],
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    };
  },

  /**
   * Get user's orders
   */
  getUserOrders: async (): Promise<Order[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      const appError = handleError(error, 'getUserOrders');
      throw new Error(appError.message);
    }

    return (data || []).map(order => ({
      id: order.id,
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      customerAddress: order.customer_address,
      notes: order.notes ?? undefined,
      totalAmount: Number(order.total_amount),
      currency: order.currency,
      status: order.status as Order['status'],
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    }));
  },

  /**
   * Get order by ID
   */
  getOrderById: async (orderId: string): Promise<Order | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error) {
      handleError(error, 'getOrderById');
      return null;
    }

    // Check if user owns this order or is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'super_admin';
    if (data.user_id !== user.id && !isAdmin) {
      return null;
    }

    return {
      id: data.id,
      orderNumber: data.order_number,
      customerName: data.customer_name,
      customerPhone: data.customer_phone,
      customerAddress: data.customer_address,
      notes: data.notes ?? undefined,
      totalAmount: Number(data.total_amount),
      currency: data.currency,
      status: data.status as Order['status'],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  },

  /**
   * Get order items for an order
   */
  getOrderItems: async (orderId: string): Promise<OrderItem[]> => {
    const { data, error } = await supabase
      .from('order_items')
      .select(`
        *,
        products(id, title, price, currency)
      `)
      .eq('order_id', orderId);

    if (error) {
      handleError(error, 'getOrderItems');
      return [];
    }

    return (data || []).map(item => ({
      productId: item.product_id,
      quantity: item.quantity,
      price: item.price,
      currency: item.currency,
    }));
  },

  /**
   * Cancel an order (user can only cancel pending orders)
   */
  cancelOrder: async (orderId: string): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Avtorizatsiya zarur");
    }

    // Check if order belongs to user and is still pending
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('user_id, status')
      .eq('id', orderId)
      .single();

    if (fetchError || !order) {
      throw new Error("Buyurtma topilmadi");
    }

    if (order.user_id !== user.id) {
      throw new Error("Bu buyurtma sizga tegishli emas");
    }

    if (order.status !== 'pending') {
      throw new Error("Faqat kutilayotgan buyurtmalarni bekor qilish mumkin");
    }

    const { error } = await supabase
      .from('orders')
      .update({
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (error) {
      const appError = handleError(error, 'cancelOrder');
      throw new Error(appError.message);
    }
  },

  /**
   * Admin: Get all orders
   */
  getAllOrders: async (status?: Order['status']): Promise<Order[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'super_admin') {
      throw new Error("Sizda bu amalni bajarish uchun ruxsat yo'q");
    }

    const query = supabase
      .from('orders')
      .select(`
        *,
        profiles!user_id(full_name, avatar_url, username)
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      const appError = handleError(error, 'getAllOrders');
      throw new Error(appError.message);
    }

    return (data || []).map(order => ({
      id: order.id,
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      customerAddress: order.customer_address,
      notes: order.notes ?? undefined,
      totalAmount: Number(order.total_amount),
      currency: order.currency,
      status: order.status as Order['status'],
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      // Pass through user profile info if available
      user: order.profiles ? {
        fullName: order.profiles.full_name,
        avatarUrl: order.profiles.avatar_url,
        username: order.profiles.username,
      } : undefined
    }));
  },

  /**
   * Admin: Get order with full details including items
   */
  getOrderWithDetails: async (orderId: string): Promise<Order & { items: OrderItemWithProduct[], userProfile: any }> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Avtorizatsiya zarur");

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        profiles!user_id(id, full_name, avatar_url, username, phone),
        order_items(
          *,
          products(
            id, 
            title, 
            price, 
            currency,
            product_media(url, type)
          )
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError) {
      const appError = handleError(orderError, 'getOrderWithDetails');
      throw new Error(appError.message);
    }

    return {
      id: order.id,
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerPhone: order.customer_phone,
      customerAddress: order.customer_address,
      notes: order.notes ?? undefined,
      totalAmount: Number(order.total_amount),
      currency: order.currency,
      status: order.status as Order['status'],
      createdAt: order.created_at,
      updatedAt: order.updated_at,
      items: (order.order_items || []).map((item: any) => ({
        id: item.id,
        productId: item.product_id,
        quantity: item.quantity,
        price: item.price,
        currency: item.currency,
        product: item.products ? {
          title: item.products.title,
          image: item.products.product_media && Array.isArray(item.products.product_media)
            ? item.products.product_media.find((m: any) => m.type === 'image')?.url || null
            : null
        } : null
      })),
      userProfile: order.profiles ? {
        id: order.profiles.id,
        fullName: order.profiles.full_name,
        avatarUrl: order.profiles.avatar_url,
        username: order.profiles.username,
        phone: order.profiles.phone
      } : null
    };
  },

  /**
   * Admin: Update order status
   */
  updateOrderStatus: async (orderId: string, status: Order['status']): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Avtorizatsiya zarur");
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'super_admin') {
      throw new Error("Sizda bu amalni bajarish uchun ruxsat yo'q");
    }

    const { error } = await supabase
      .from('orders')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (error) {
      const appError = handleError(error, 'updateOrderStatus');
      throw new Error(appError.message);
    }
  },

  /**
   * Get order statistics (for admin dashboard)
   */
  getOrderStats: async (): Promise<{
    total: number;
    pending: number;
    processing: number;
    delivered: number;
    cancelled: number;
    totalRevenue: number;
  }> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { total: 0, pending: 0, processing: 0, delivered: 0, cancelled: 0, totalRevenue: 0 };
    }

    const { data, error } = await supabase
      .from('orders')
      .select('status, total_amount');

    if (error) {
      return { total: 0, pending: 0, processing: 0, delivered: 0, cancelled: 0, totalRevenue: 0 };
    }

    const stats = {
      total: data?.length || 0,
      pending: 0,
      processing: 0,
      delivered: 0,
      cancelled: 0,
      totalRevenue: 0,
    };

    data?.forEach(order => {
      if (order.status === 'pending') stats.pending++;
      if (order.status === 'processing' || order.status === 'confirmed' || order.status === 'shipped') stats.processing++;
      if (order.status === 'delivered') stats.delivered++;
      if (order.status === 'cancelled') stats.cancelled++;
      if (order.status !== 'cancelled') {
        stats.totalRevenue += Number(order.total_amount) || 0;
      }
    });

    return stats;
  },
};
