import { create } from "zustand";
import { persist } from "zustand/middleware";
import { productService } from "@/services/api/products";
import { Product } from "@/types/product";

export type SortOption = "newest" | "oldest" | "price_asc" | "price_desc" | "popular" | "rating";

export interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
  searchQuery?: string;
}

interface ProductsState {
  products: Product[];
  filteredProducts: Product[];
  filters: ProductFilters;
  sortBy: SortOption;
  isLoading: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;
  pageSize: number;

  // Actions
  fetchProducts: () => Promise<void>;
  fetchMoreProducts: () => Promise<void>;
  setFilters: (filters: ProductFilters) => void;
  setSortBy: (sortBy: SortOption) => void;
  clearFilters: () => void;
  applyFiltersAndSort: () => void;
  resetPagination: () => void;
}

const defaultFilters: ProductFilters = {};

export const useProductsStore = create<ProductsState>()(
  persist(
    (set, get) => ({
      products: [],
      filteredProducts: [],
      filters: defaultFilters,
      sortBy: "newest",
      isLoading: false,
      error: null,
      page: 1,
      hasMore: true,
      pageSize: 20,

      fetchProducts: async () => {
        set({ isLoading: true, error: null });
        try {
          const { products } = await productService.getProducts();
          set({ products, isLoading: false });
          get().applyFiltersAndSort();
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Mahsulotlarni yuklashda xatolik",
            isLoading: false,
          });
        }
      },

      fetchMoreProducts: async () => {
        const { isLoading, hasMore, page, pageSize, filteredProducts } = get();
        if (isLoading || !hasMore) return;

        set({ isLoading: true });
        try {
          // Simulate pagination - in real app, API would handle this
          const startIndex = page * pageSize;
          const endIndex = startIndex + pageSize;
          const moreProducts = get().products.slice(startIndex, endIndex);

          if (moreProducts.length === 0) {
            set({ hasMore: false, isLoading: false });
          } else {
            set({
              filteredProducts: [...filteredProducts, ...moreProducts],
              page: page + 1,
              hasMore: moreProducts.length === pageSize,
              isLoading: false,
            });
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Ko'proq mahsulotlarni yuklashda xatolik",
            isLoading: false,
          });
        }
      },

      setFilters: (filters: ProductFilters) => {
        set({ filters: { ...get().filters, ...filters } });
        get().resetPagination();
        get().applyFiltersAndSort();
      },

      setSortBy: (sortBy: SortOption) => {
        set({ sortBy });
        get().applyFiltersAndSort();
      },

      clearFilters: () => {
        set({ filters: defaultFilters });
        get().resetPagination();
        get().applyFiltersAndSort();
      },

      resetPagination: () => {
        set({ page: 1, hasMore: true });
      },

      applyFiltersAndSort: () => {
        const { products, filters, sortBy, pageSize } = get();

        let filtered = [...products];

        // Apply filters
        if (filters.category) {
          filtered = filtered.filter((p) => p.category === filters.category);
        }
        if (filters.minPrice !== undefined) {
          filtered = filtered.filter((p) => p.price >= filters.minPrice!);
        }
        if (filters.maxPrice !== undefined) {
          filtered = filtered.filter((p) => p.price <= filters.maxPrice!);
        }
        if (filters.minRating !== undefined) {
          filtered = filtered.filter((p) => (p.rating || 0) >= filters.minRating!);
        }
        if (filters.inStock) {
          filtered = filtered.filter((p) => p.inStock);
        }
        if (filters.searchQuery) {
          const query = filters.searchQuery.toLowerCase();
          filtered = filtered.filter(
            (p) =>
              p.title.toLowerCase().includes(query) ||
              p.description.toLowerCase().includes(query)
          );
        }

        // Apply sorting
        switch (sortBy) {
          case "newest":
            filtered.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
            break;
          case "oldest":
            filtered.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
            break;
          case "price_asc":
            filtered.sort((a, b) => a.price - b.price);
            break;
          case "price_desc":
            filtered.sort((a, b) => b.price - a.price);
            break;
          case "popular":
            filtered.sort((a, b) => (b.views || 0) - (a.views || 0));
            break;
          case "rating":
            filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            break;
        }

        // Paginate
        const paginatedProducts = filtered.slice(0, pageSize);

        set({
          filteredProducts: paginatedProducts,
          hasMore: filtered.length > pageSize,
        });
      },
    }),
    {
      name: "products-store",
      partialize: (state) => ({
        filters: state.filters,
        sortBy: state.sortBy,
      }),
    }
  )
);
