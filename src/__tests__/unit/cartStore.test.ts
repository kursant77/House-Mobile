import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useCartStore } from '@/store/cartStore';
import { userDataService } from '@/services/api/userData';

// Mock the service
vi.mock('@/services/api/userData');

describe('CartStore', () => {
  beforeEach(() => {
    // Reset store before each test
    useCartStore.getState().resetCart();
    vi.clearAllMocks();
  });

  it('should add item to cart', async () => {
    const mockProduct = {
      id: '1',
      title: 'Test Product',
      price: 100,
      currency: 'UZS',
      images: [],
      description: 'Test',
      category: 'test',
      inStock: true,
      stock: 10,
      rating: 5,
      reviewsCount: 0,
      createdAt: new Date().toISOString(),
      sellerId: 'user1',
      views: 0,
      sales: 0,
    };

    vi.mocked(userDataService.addToCart).mockResolvedValue();

    await useCartStore.getState().addToCart(mockProduct, 1);

    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].product.id).toBe('1');
    expect(items[0].quantity).toBe(1);
  });

  it('should calculate total correctly', async () => {
    const mockProduct = {
      id: '1',
      title: 'Test Product',
      price: 100,
      currency: 'UZS',
      images: [],
      description: 'Test',
      category: 'test',
      inStock: true,
      stock: 10,
      rating: 5,
      reviewsCount: 0,
      createdAt: new Date().toISOString(),
      sellerId: 'user1',
      views: 0,
      sales: 0,
    };

    vi.mocked(userDataService.addToCart).mockResolvedValue();

    await useCartStore.getState().addToCart(mockProduct, 2);

    const total = useCartStore.getState().getTotal();
    expect(total).toBe(200);
  });

  it('should remove item from cart', async () => {
    const mockProduct = {
      id: '1',
      title: 'Test Product',
      price: 100,
      currency: 'UZS',
      images: [],
      description: 'Test',
      category: 'test',
      inStock: true,
      stock: 10,
      rating: 5,
      reviewsCount: 0,
      createdAt: new Date().toISOString(),
      sellerId: 'user1',
      views: 0,
      sales: 0,
    };

    vi.mocked(userDataService.addToCart).mockResolvedValue();
    vi.mocked(userDataService.removeFromCart).mockResolvedValue();

    await useCartStore.getState().addToCart(mockProduct, 1);
    await useCartStore.getState().removeFromCart('1');

    const items = useCartStore.getState().items;
    expect(items).toHaveLength(0);
  });
});
