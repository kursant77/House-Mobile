import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export type PaymentMethodType = 'payme' | 'click' | 'uzum' | 'cash';

export interface PaymentMethod {
  type: PaymentMethodType;
  cardNumber?: string;
  cardHolder?: string;
}

export interface PaymentRequest {
  orderId: string;
  amount: number;
  method: PaymentMethod;
  currency?: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId?: string;
  paymentUrl?: string;
  error?: string;
}

/**
 * Payment service for Uzbekistan payments
 * Supported: Payme, Click, Uzum Bank, Naqd (Cash on Delivery)
 */
export const paymentService = {
  /**
   * Initialize Payme payment (Uzbekistan)
   * https://developer.help.paycom.uz/initsializatsiya-platezha/
   */
  async initPayme(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const merchantId = import.meta.env.VITE_PAYME_MERCHANT_ID || '64ed9f7833e7208d1f054790';
      const amount = request.amount * 100; // Payme expects amount in tiyins
      const params = `m=${merchantId};ac.order_id=${request.orderId};a=${amount}`;
      const base64Params = btoa(params);
      const paymentUrl = `https://checkout.paycom.uz/${base64Params}`;

      logger.log('Initializing Payme payment:', { orderId: request.orderId, amount });

      return {
        success: true,
        transactionId: `payme_${Date.now()}`,
        paymentUrl,
      };
    } catch (error) {
      logger.error('Payme payment failed:', error);
      return {
        success: false,
        error: 'To\'lov tizimida xatolik',
      };
    }
  },

  /**
   * Initialize Click payment (Uzbekistan)
   * https://docs.click.uz/
   */
  async initClick(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      const merchantId = import.meta.env.VITE_CLICK_MERCHANT_ID || '22543';
      const serviceId = import.meta.env.VITE_CLICK_SERVICE_ID || '29604';
      const amount = request.amount;
      const paymentUrl = `https://my.click.uz/services/pay?service_id=${serviceId}&merchant_id=${merchantId}&amount=${amount}&transaction_param=${request.orderId}`;

      logger.log('Initializing Click payment:', { orderId: request.orderId, amount });

      return {
        success: true,
        transactionId: `click_${Date.now()}`,
        paymentUrl,
      };
    } catch (error) {
      logger.error('Click payment failed:', error);
      return {
        success: false,
        error: 'To\'lov tizimida xatolik',
      };
    }
  },

  /**
   * Initialize Uzum Bank payment (Uzbekistan)
   * Uses Click infrastructure for card payments
   */
  async initUzum(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // Uzum Bank uses its own checkout page
      const merchantId = import.meta.env.VITE_UZUM_MERCHANT_ID || '';
      const amount = request.amount;

      // Fallback to Click if no Uzum merchant ID configured
      if (!merchantId) {
        logger.log('Uzum merchant ID not configured, falling back to Click');
        return this.initClick(request);
      }

      const paymentUrl = `https://www.uzumbank.uz/pay?merchant_id=${merchantId}&amount=${amount}&order_id=${request.orderId}`;

      logger.log('Initializing Uzum Bank payment:', { orderId: request.orderId, amount });

      return {
        success: true,
        transactionId: `uzum_${Date.now()}`,
        paymentUrl,
      };
    } catch (error) {
      logger.error('Uzum Bank payment failed:', error);
      return {
        success: false,
        error: 'To\'lov tizimida xatolik',
      };
    }
  },

  /**
   * Process payment based on method
   */
  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    switch (request.method.type) {
      case 'payme':
        return this.initPayme(request);
      case 'click':
        return this.initClick(request);
      case 'uzum':
        return this.initUzum(request);
      case 'cash':
        return {
          success: true,
          transactionId: `cash_${Date.now()}`,
        };
      default:
        return {
          success: false,
          error: 'Noto\'g\'ri to\'lov usuli',
        };
    }
  },

  /**
   * Verify payment status in database
   */
  async verifyPayment(orderId: string): Promise<boolean> {
    try {
      logger.log('Verifying payment for order:', orderId);

      const { data, error } = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .single();

      if (error) throw error;

      return ['paid', 'confirmed', 'processing', 'shipped', 'delivered'].includes(data.status);
    } catch (error) {
      logger.error('Payment status check failed:', error);
      return false;
    }
  },

  /**
   * Get payment method display info
   */
  getMethodLabel(type: PaymentMethodType): string {
    const labels: Record<PaymentMethodType, string> = {
      cash: 'Naqd pul',
      click: 'Click',
      payme: 'Payme',
      uzum: 'Uzum Bank',
    };
    return labels[type] || type;
  },
};
