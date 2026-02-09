/**
 * Google Analytics 4 wrapper
 * Tracks user events and conversions
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export const analytics = {
  /**
   * Initialize GA4
   */
  init(measurementId: string) {
    if (typeof window === 'undefined') return;

    // Load GA4 script
    const script = document.createElement('script');
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    script.async = true;
    document.head.appendChild(script);

    // Initialize dataLayer
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };

    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      send_page_view: false, // We'll send manually
    });
  },

  /**
   * Track page view
   */
  pageView(path: string, title?: string) {
    if (!window.gtag) return;

    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: title,
    });
  },

  /**
   * Track product view
   */
  viewProduct(productId: string, name: string, price: number, category: string) {
    if (!window.gtag) return;

    window.gtag('event', 'view_item', {
      currency: 'UZS',
      value: price,
      items: [
        {
          item_id: productId,
          item_name: name,
          item_category: category,
          price: price,
        },
      ],
    });
  },

  /**
   * Track add to cart
   */
  addToCart(productId: string, name: string, price: number, quantity: number) {
    if (!window.gtag) return;

    window.gtag('event', 'add_to_cart', {
      currency: 'UZS',
      value: price * quantity,
      items: [
        {
          item_id: productId,
          item_name: name,
          price: price,
          quantity: quantity,
        },
      ],
    });
  },

  /**
   * Track purchase
   */
  purchase(
    transactionId: string,
    value: number,
    items: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
    }>
  ) {
    if (!window.gtag) return;

    window.gtag('event', 'purchase', {
      transaction_id: transactionId,
      currency: 'UZS',
      value: value,
      items: items.map(item => ({
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
      })),
    });
  },

  /**
   * Track search
   */
  search(query: string) {
    if (!window.gtag) return;

    window.gtag('event', 'search', {
      search_term: query,
    });
  },

  /**
   * Track custom event
   */
  event(name: string, params?: Record<string, unknown>) {
    if (!window.gtag) return;

    window.gtag('event', name, params);
  },
};
