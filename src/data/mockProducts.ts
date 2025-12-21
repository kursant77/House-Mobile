import { Product } from "@/types/product";

// Product images (Tech/Phone related)
const productImages = [
  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=500&fit=crop", // iPhone
  "https://images.unsplash.com/photo-1592750437668-53240f813547?w=400&h=500&fit=crop", // Samsung
  "https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=400&h=500&fit=crop", // Mobile holding
  "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=400&h=500&fit=crop", // Laptop
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=500&fit=crop", // Headphones
  "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400&h=500&fit=crop", // Smart Watch
  "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=400&h=500&fit=crop", // Tech setup
  "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=400&h=500&fit=crop", // Charger/Accessory
];

export const mockProducts: Product[] = [
  {
    id: "p1",
    title: "iPhone 15 Pro Max",
    description: "The ultimate iPhone with Titanium design, A17 Pro chip, and our most advanced camera system ever.",
    price: 18500000,
    originalPrice: 20000000,
    currency: "UZS",
    images: [productImages[0], productImages[2]],
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-smart-phone-with-a-green-screen-1111-large.mp4",
    category: "smartphones",
    inStock: true,
    rating: 4.9,
    reviewCount: 1245,
  },
  {
    id: "p2",
    title: "Samsung Galaxy S24 Ultra",
    description: "Galaxy AI is here. Epic titanium design. New Telephoto camera. The most powerful Galaxy ever.",
    price: 17200000,
    currency: "UZS",
    images: [productImages[1], productImages[2]],
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-hands-typing-on-a-laptop-4788-large.mp4",
    category: "smartphones",
    inStock: true,
    rating: 4.8,
    reviewCount: 980,
  },
  {
    id: "p3",
    title: "MacBook Air M3",
    description: "Supercharged by M3. Impossibly thin and light. Up to 18 hours of battery life.",
    price: 19500000,
    originalPrice: 22000000,
    currency: "UZS",
    images: [productImages[3], productImages[6]],
    category: "laptops",
    inStock: true,
    rating: 4.9,
    reviewCount: 456,
  },
  {
    id: "p4",
    title: "AirPods Pro (2nd Gen)",
    description: "Rich audio. Active Noise Cancellation. Transparency mode. Personalized Spatial Audio.",
    price: 3200000,
    currency: "UZS",
    images: [productImages[4], productImages[6]],
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-man-putting-on-headphones-in-the-studio-41487-large.mp4",
    category: "audio",
    inStock: true,
    rating: 4.7,
    reviewCount: 2100,
  },
  {
    id: "p5",
    title: "Apple Watch Series 9",
    description: "Smarter. Brighter. Mightier. Double tap gesture. A healthy leap ahead.",
    price: 5400000,
    originalPrice: 6000000,
    currency: "UZS",
    images: [productImages[5], productImages[6]],
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-woman-checking-her-smart-watch-outside-43431-large.mp4",
    category: "watches",
    inStock: true,
    rating: 4.6,
    reviewCount: 890,
  },
  {
    id: "p6",
    title: "Anker USB-C Fast Charger",
    description: "High-speed charging for phones, tablets, and laptops. Compact and durable design.",
    price: 350000,
    currency: "UZS",
    images: [productImages[7]],
    category: "accessories",
    inStock: true,
    rating: 4.9,
    reviewCount: 3400,
  },
  {
    id: "p7",
    title: "iPad Pro 12.9\"",
    description: "The ultimate iPad experience with M2 chip, XDR display, and wireless connectivity.",
    price: 14500000,
    originalPrice: 16000000,
    currency: "UZS",
    images: [productImages[6], productImages[3]],
    category: "tablets",
    inStock: false,
    rating: 4.8,
    reviewCount: 560,
  },
  {
    id: "p8",
    title: "Sony WH-1000XM5",
    description: "Industry-leading noise canceling headphones with premium sound and crystal clear calls.",
    price: 4800000,
    currency: "UZS",
    images: [productImages[4], productImages[0]],
    category: "audio",
    inStock: true,
    rating: 4.8,
    reviewCount: 1200,
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

// Product categories
export const categories = [
  { id: "all", name: "All", icon: "Grid3X3", count: mockProducts.length },
  { id: "smartphones", name: "Smartphones", icon: "Smartphone", count: mockProducts.filter(p => p.category === "smartphones").length },
  { id: "laptops", name: "Laptops", icon: "Laptop", count: mockProducts.filter(p => p.category === "laptops").length },
  { id: "audio", name: "Audio", icon: "Headphones", count: mockProducts.filter(p => p.category === "audio").length },
  { id: "watches", name: "Watches", icon: "Watch", count: mockProducts.filter(p => p.category === "watches").length },
  { id: "accessories", name: "Accessories", icon: "Cable", count: mockProducts.filter(p => p.category === "accessories").length },
  { id: "tablets", name: "Tablets", icon: "Tablet", count: mockProducts.filter(p => p.category === "tablets").length },
];
