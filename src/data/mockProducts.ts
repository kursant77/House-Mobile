import { Product } from "@/types/product";

// Product categories
export const categories = [
  { id: "all", name: "All", icon: "Grid3X3" },
  { id: "dresses", name: "Dresses", icon: "Shirt" },
  { id: "summer", name: "Summer", icon: "Sun" },
  { id: "beauty", name: "Beauty", icon: "Sparkles" },
  { id: "party", name: "Party", icon: "PartyPopper" },
  { id: "sports", name: "Sports", icon: "Dumbbell" },
];

// Product images
const productImages = [
  "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1485968579169-a6e9dc7c117f?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=500&fit=crop",
];

export const mockProducts: Product[] = [
  {
    id: "p1",
    title: "Elegant Red Dress",
    description: "A stunning red evening dress perfect for special occasions. Made with premium silk fabric that drapes beautifully. Features a flattering A-line silhouette and delicate detailing.",
    price: 299000,
    originalPrice: 450000,
    currency: "UZS",
    images: [productImages[0], productImages[1]],
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-woman-modeling-on-a-turntable-in-a-red-outfit-41750-large.mp4",
    category: "dresses",
    inStock: true,
    rating: 4.8,
    reviewCount: 124,
  },
  {
    id: "p2",
    title: "Summer Orange Collection",
    description: "Light and breezy summer dress in vibrant orange. Perfect for beach days and casual outings. Made with breathable cotton blend.",
    price: 189000,
    currency: "UZS",
    images: [productImages[1], productImages[2]],
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-young-woman-in-orange-dress-posing-for-camera-39875-large.mp4",
    category: "summer",
    inStock: true,
    rating: 4.6,
    reviewCount: 89,
  },
  {
    id: "p3",
    title: "Silver Glamour Set",
    description: "Complete makeup set with silver metallic finish. Includes eyeshadow palette, lipstick, and highlighter. Professional quality for stunning looks.",
    price: 459000,
    originalPrice: 599000,
    currency: "UZS",
    images: [productImages[2], productImages[3]],
    category: "beauty",
    inStock: true,
    rating: 4.9,
    reviewCount: 256,
  },
  {
    id: "p4",
    title: "Neon Night Outfit",
    description: "Stand out with this glowing neon-inspired outfit. Perfect for parties and night events. Includes top and matching accessories.",
    price: 379000,
    currency: "UZS",
    images: [productImages[3], productImages[4]],
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-1232-large.mp4",
    category: "party",
    inStock: true,
    rating: 4.7,
    reviewCount: 167,
  },
  {
    id: "p5",
    title: "Sport Elite Collection",
    description: "Premium athletic wear for peak performance. Moisture-wicking fabric keeps you cool and dry. Ergonomic design for maximum comfort.",
    price: 249000,
    originalPrice: 320000,
    currency: "UZS",
    images: [productImages[4], productImages[5]],
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-woman-running-above-the-camera-on-a-running-track-32807-large.mp4",
    category: "sports",
    inStock: true,
    rating: 4.5,
    reviewCount: 312,
  },
  {
    id: "p6",
    title: "Classic Black Dress",
    description: "Timeless little black dress for any occasion. Versatile design that can be dressed up or down. Premium quality fabric.",
    price: 359000,
    currency: "UZS",
    images: [productImages[5], productImages[6]],
    category: "dresses",
    inStock: true,
    rating: 4.9,
    reviewCount: 445,
  },
  {
    id: "p7",
    title: "Beach Vibes Set",
    description: "Complete summer beach set including swimsuit and cover-up. UV protection fabric. Trendy tropical print.",
    price: 279000,
    originalPrice: 350000,
    currency: "UZS",
    images: [productImages[6], productImages[7]],
    category: "summer",
    inStock: false,
    rating: 4.4,
    reviewCount: 78,
  },
  {
    id: "p8",
    title: "Luxury Skincare Kit",
    description: "Complete skincare routine in one kit. Includes cleanser, toner, serum, and moisturizer. Suitable for all skin types.",
    price: 599000,
    currency: "UZS",
    images: [productImages[7], productImages[0]],
    category: "beauty",
    inStock: true,
    rating: 4.8,
    reviewCount: 198,
  },
];

// Get product by ID
export const getProductById = (id: string): Product | undefined => {
  return mockProducts.find((p) => p.id === id);
};

// Get products by category
export const getProductsByCategory = (category: string): Product[] => {
  if (category === "all") return mockProducts;
  return mockProducts.filter((p) => p.category === category);
};
