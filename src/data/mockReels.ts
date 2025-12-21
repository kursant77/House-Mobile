import { ReelItem } from "@/types/product";

// Mock video URLs (using sample tech/generic videos)
const sampleVideos = [
  "https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-smart-phone-with-a-green-screen-1111-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-hands-typing-on-a-laptop-4788-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-man-putting-on-headphones-in-the-studio-41487-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-woman-checking-her-smart-watch-outside-43431-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-top-aerial-shot-of-a-man-working-on-his-laptop-279-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-smartphone-in-hand-with-green-screen-5314-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-person-using-a-tablet-with-a-green-screen-5315-large.mp4",
  "https://assets.mixkit.co/videos/preview/mixkit-close-up-of-hands-typing-on-keyboard-4789-large.mp4",
];

// Product images (matching mockProducts)
const productImages = [
  "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=500&fit=crop", // iPhone
  "https://images.unsplash.com/photo-1592750437668-53240f813547?w=400&h=500&fit=crop", // Samsung
  "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=500&fit=crop", // Headphones
  "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400&h=500&fit=crop", // Watch
  "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=500&fit=crop", // Headphones 2
  "https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&h=500&fit=crop", // Watch 2
  "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=400&h=500&fit=crop", // Charger
  "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400&h=500&fit=crop", // Phone case
  "https://images.unsplash.com/photo-1572635196243-4dd75fbdbd7f?w=400&h=500&fit=crop", // Airpods
  "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=400&h=500&fit=crop", // Phone 3
  "https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=400&h=500&fit=crop", // iPhone white
  "https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=400&h=500&fit=crop", // Xiaomi
];

export const mockReels: ReelItem[] = [
  {
    id: "reel-1",
    videoUrl: sampleVideos[0],
    thumbnailUrl: productImages[0],
    product: {
      id: "p1",
      title: "iPhone 15 Pro Max - Titanium",
      description: "🔥 Yangi Titanium dizayn! A17 Pro chip bilan eng kuchli iPhone. 256GB xotira, 5x Zoom kamera!",
      price: 18500000,
      originalPrice: 20000000,
      currency: "UZS",
      images: [productImages[0], productImages[10]],
      category: "smartphones",
      inStock: true,
      rating: 4.9,
      reviewCount: 1245,
    },
    likes: 12470,
    isLiked: false,
    isFavorite: false,
  },
  {
    id: "reel-2",
    videoUrl: sampleVideos[1],
    thumbnailUrl: productImages[1],
    product: {
      id: "p2",
      title: "Samsung Galaxy S24 Ultra",
      description: "✨ Galaxy AI bu yerda! Titanium korpus, yangi Telephoto kamera. Eng kuchli Galaxy!",
      price: 17200000,
      originalPrice: 18500000,
      currency: "UZS",
      images: [productImages[1]],
      category: "smartphones",
      inStock: true,
      rating: 4.8,
      reviewCount: 980,
    },
    likes: 8920,
    isLiked: false,
    isFavorite: false,
  },
  {
    id: "reel-3",
    videoUrl: sampleVideos[2],
    thumbnailUrl: productImages[2],
    product: {
      id: "p4",
      title: "AirPods Pro 2nd Generation",
      description: "🎧 Noise cancellation ajoyib! Spatial Audio, 30 soat quvvat. Eng yaxshi quloqchin!",
      price: 3200000,
      originalPrice: 3800000,
      currency: "UZS",
      images: [productImages[2], productImages[8]],
      category: "audio",
      inStock: true,
      rating: 4.7,
      reviewCount: 2100,
    },
    likes: 23410,
    isLiked: false,
    isFavorite: false,
  },
  {
    id: "reel-4",
    videoUrl: sampleVideos[3],
    thumbnailUrl: productImages[3],
    product: {
      id: "p5",
      title: "Apple Watch Series 9",
      description: "⌚ Double tap gesturasi! Ekran yanada yorqin. Sog'ligingizni nazorat qiling!",
      price: 5400000,
      originalPrice: 6000000,
      currency: "UZS",
      images: [productImages[3], productImages[5]],
      category: "watches",
      inStock: true,
      rating: 4.6,
      reviewCount: 890,
    },
    likes: 18760,
    isLiked: false,
    isFavorite: false,
  },
  {
    id: "reel-5",
    videoUrl: sampleVideos[4],
    thumbnailUrl: productImages[4],
    product: {
      id: "p8",
      title: "Sony WH-1000XM5 Wireless",
      description: "🎵 Professional noise canceling! Crystal clear ovoz. 30 soat quvvat. Premium sifat!",
      price: 4800000,
      originalPrice: 5500000,
      currency: "UZS",
      images: [productImages[4]],
      category: "audio",
      inStock: true,
      rating: 4.8,
      reviewCount: 1200,
    },
    likes: 15230,
    isLiked: false,
    isFavorite: false,
  },
  {
    id: "reel-6",
    videoUrl: sampleVideos[5],
    thumbnailUrl: productImages[10],
    product: {
      id: "p9",
      title: "iPhone 14 Pro - 256GB",
      description: "💎 Dynamic Island! 48MP kamera, A16 Bionic chip. Ajoyib narx-sifat nisbati!",
      price: 14500000,
      originalPrice: 16000000,
      currency: "UZS",
      images: [productImages[10]],
      category: "smartphones",
      inStock: true,
      rating: 4.7,
      reviewCount: 2340,
    },
    likes: 9870,
    isLiked: false,
    isFavorite: false,
  },
  {
    id: "reel-7",
    videoUrl: sampleVideos[6],
    thumbnailUrl: productImages[11],
    product: {
      id: "p10",
      title: "Xiaomi 14 Pro - 512GB",
      description: "🚀 Snapdragon 8 Gen 3! Leica kamera, 120W tez quvvatlash. Top narx!",
      price: 8900000,
      originalPrice: 9900000,
      currency: "UZS",
      images: [productImages[11]],
      category: "smartphones",
      inStock: true,
      rating: 4.6,
      reviewCount: 780,
    },
    likes: 11200,
    isLiked: false,
    isFavorite: false,
  },
  {
    id: "reel-8",
    videoUrl: sampleVideos[7],
    thumbnailUrl: productImages[6],
    product: {
      id: "p11",
      title: "Anker 100W GaN Fast Charger",
      description: "⚡ 100W super tez quvvatlash! Uchta port, ixcham dizayn. Laptop va telefon uchun!",
      price: 450000,
      originalPrice: 550000,
      currency: "UZS",
      images: [productImages[6]],
      category: "accessories",
      inStock: true,
      rating: 4.9,
      reviewCount: 3400,
    },
    likes: 7650,
    isLiked: false,
    isFavorite: false,
  },
  {
    id: "reel-9",
    videoUrl: sampleVideos[0],
    thumbnailUrl: productImages[7],
    product: {
      id: "p12",
      title: "Premium Phone Case - MagSafe",
      description: "📱 MagSafe mos! Premium materiallar, to'liq himoya. Turli ranglar!",
      price: 280000,
      currency: "UZS",
      images: [productImages[7]],
      category: "accessories",
      inStock: true,
      rating: 4.5,
      reviewCount: 890,
    },
    likes: 5430,
    isLiked: false,
    isFavorite: false,
  },
  {
    id: "reel-10",
    videoUrl: sampleVideos[2],
    thumbnailUrl: productImages[8],
    product: {
      id: "p13",
      title: "AirPods 3rd Generation",
      description: "🎧 Spatial Audio, 30 soat quvvat! Sweat & water resistant. Ajoyib narx!",
      price: 2400000,
      currency: "UZS",
      images: [productImages[8]],
      category: "audio",
      inStock: true,
      rating: 4.6,
      reviewCount: 1560,
    },
    likes: 14320,
    isLiked: false,
    isFavorite: false,
  },
  {
    id: "reel-11",
    videoUrl: sampleVideos[3],
    thumbnailUrl: productImages[5],
    product: {
      id: "p14",
      title: "Samsung Galaxy Watch 6 Classic",
      description: "⌚ Premium dizayn! Health tracking, 40mm korpus. Ajoyib smartwatch!",
      price: 3900000,
      originalPrice: 4500000,
      currency: "UZS",
      images: [productImages[5]],
      category: "watches",
      inStock: true,
      rating: 4.5,
      reviewCount: 670,
    },
    likes: 8900,
    isLiked: false,
    isFavorite: false,
  },
  {
    id: "reel-12",
    videoUrl: sampleVideos[1],
    thumbnailUrl: productImages[9],
    product: {
      id: "p15",
      title: "OnePlus 12 - 16GB RAM",
      description: "💪 16GB RAM, 512GB xotira! Hasselblad kamera, 100W tez quvvatlash. Beast!",
      price: 9500000,
      originalPrice: 10500000,
      currency: "UZS",
      images: [productImages[9]],
      category: "smartphones",
      inStock: true,
      rating: 4.7,
      reviewCount: 540,
    },
    likes: 10200,
    isLiked: false,
    isFavorite: false,
  },
];

// Get reel by ID
export const getReelById = (id: string): ReelItem | undefined => {
  return mockReels.find((r) => r.id === id);
};

// Get reels by product category
export const getReelsByCategory = (category: string): ReelItem[] => {
  if (category === "all") return mockReels;
  return mockReels.filter((r) => r.product.category === category);
};
