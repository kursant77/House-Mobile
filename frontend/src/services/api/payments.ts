import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export interface PaymentMethod {
  type: 'payme' | 'click' | 'stripe' | 'cash';
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
 * Payment service for Uzbekistan and international payments
 */
export const paymentService = {
  /**
   * Initialize Payme payment (Uzbekistan)
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
   * Initialize Stripe payment (International)
   */
  async initStripe(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      // TODO: Implement Stripe integration
      // https://stripe.com/docs/api

      logger.log('Initializing Stripe payment:', request);

      // Placeholder - replace with actual Stripe API call
      return {
        success: true,
        transactionId: `stripe_${Date.now()}`,
        paymentUrl: 'https://checkout.stripe.com/',
      };
    } catch (error) {
      logger.error('Stripe payment failed:', error);
      return {
        success: false,
        error: 'Payment system error',
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
      case 'stripe':
        return this.initStripe(request);
      case 'cash':
        return {
          success: true,
          transactionId: `cash_${Date.now()}`,
        };
      default:
        return {
          success: false,
          error: 'Invalid payment method',
        };
    }
  },

  /**
   * Verify payment status in database
   */
  async verifyPayment(orderId: string): Promise<boolean> {
    try {
      logger.log('Verifying payment for order:', orderId);

      // In a real app, the provider calls our webhook which updates the DB
      // Here we just fetch the order to see if it's marked as paid/confirmed
      const { data, error } = await supabase
        .from('orders')
        .select('status')
        .eq('id', orderId)
        .single();

      if (error) throw error;

      // If status is 'paid', 'confirmed', or 'processing', we consider it successful
      return ['paid', 'confirmed', 'processing', 'shipped', 'delivered'].includes(data.status);
    } catch (error) {
      logger.error('Payment status check failed:', error);
      return false;
    }
  },
};
