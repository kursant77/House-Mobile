import { z } from 'zod';
import { MAX_IMAGE_SIZE, MAX_VIDEO_SIZE, SUPABASE_STORAGE_LIMIT } from "@/lib/config";

/**
 * Validation schemas for all forms and inputs
 */

// Auth validation schemas
export const loginSchema = z.object({
  email: z.string().email('Email noto\'g\'ri formatda').min(1, 'Email kiritilishi shart'),
  password: z.string().min(6, 'Parol kamida 6 belgidan iborat bo\'lishi kerak'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Ism kamida 2 belgidan iborat bo\'lishi kerak').max(100, 'Ism juda uzun'),
  username: z.string()
    .min(3, 'Username kamida 3 belgidan iborat bo\'lishi kerak')
    .max(30, 'Username juda uzun')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username faqat harflar, raqamlar va _ belgisidan iborat bo\'lishi kerak'),
  phone: z.string()
    .regex(/^\+998\d{9}$|^998\d{9}$|^\d{9}$/, 'Telefon raqam noto\'g\'ri formatda (masalan: +998901234567)'),
  email: z.string().email('Email noto\'g\'ri formatda').min(1, 'Email kiritilishi shart'),
  password: z.string().min(6, 'Parol kamida 6 belgidan iborat bo\'lishi kerak').max(100, 'Parol juda uzun'),
  referral_code: z.string().optional(),
});

// Profile validation schemas
export const profileUpdateSchema = z.object({
  name: z.string().min(2, 'Ism kamida 2 belgidan iborat bo\'lishi kerak').max(100, 'Ism juda uzun').optional(),
  bio: z.string().min(5, 'Bio kamida 5 belgidan iborat bo\'lishi kerak').max(500, 'Bio juda uzun').optional(),
  username: z.string()
    .min(3, 'Username kamida 3 belgidan iborat bo\'lishi kerak')
    .max(30, 'Username juda uzun')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username faqat harflar, raqamlar va _ belgisidan iborat bo\'lishi kerak')
    .optional(),
  phone: z.string()
    .regex(/^\+998\d{9}$|^998\d{9}$|^\d{9}$/, 'Telefon raqam noto\'g\'ri formatda')
    .optional(),
  address: z.string().min(5, 'Manzil kamida 5 belgidan iborat bo\'lishi kerak').max(200, 'Manzil juda uzun').optional(),
  telegram: z.string().url('Telegram link noto\'g\'ri formatda').optional().or(z.literal('')),
  instagram: z.string().url('Instagram link noto\'g\'ri formatda').optional().or(z.literal('')),
  facebook: z.string().url('Facebook link noto\'g\'ri formatda').optional().or(z.literal('')),
  youtube: z.string().url('YouTube link noto\'g\'ri formatda').optional().or(z.literal('')),
});

// Product validation schemas
export const productSchema = z.object({
  title: z.string().min(3, 'Nomi kamida 3 belgidan iborat bo\'lishi kerak').max(200, 'Nomi juda uzun'),
  description: z.string().min(10, 'Tavsif kamida 10 belgidan iborat bo\'lishi kerak').max(5000, 'Tavsif juda uzun'),
  price: z.number().positive('Narx musbat son bo\'lishi kerak').max(1000000000, 'Narx juda katta'),
  category: z.string().min(1, 'Kategoriya tanlanishi shart'),
  currency: z.string().min(1, 'Valyuta tanlanishi shart'),
  inStock: z.boolean(),
});

// Post validation schemas
export const postSchema = z.object({
  title: z.string().min(3, 'Sarlavha kamida 3 belgidan iborat bo\'lishi kerak').max(200, 'Sarlavha juda uzun').optional(),
  content: z.string().min(5, 'Kontent kamida 5 belgidan iborat bo\'lishi kerak').max(10000, 'Kontent juda uzun'),
  mediaUrl: z.string().url('Media URL noto\'g\'ri formatda').optional().or(z.literal('')),
  mediaType: z.enum(['image', 'video']).optional(),
  category: z.string().default('general'),
});

// Comment validation schemas
export const commentSchema = z.object({
  content: z.string().min(1, 'Komentariya bo\'sh bo\'lmasligi kerak').max(1000, 'Komentariya juda uzun'),
  parentId: z.string().uuid('Parent ID noto\'g\'ri formatda').optional(),
});

export const imageFileSchema = z.instanceof(File, { message: 'Rasm fayl bo\'lishi kerak' })
  .refine((file) => file.size <= MAX_IMAGE_SIZE, {
    message: `Rasm hajmi ${MAX_IMAGE_SIZE / 1024 / 1024}MB dan oshmasligi kerak. Iltimos, rasmni siqish yoki kichikroq fayl tanlang.`,
  })
  .refine((file) => file.type.startsWith('image/'), {
    message: 'Fayl rasm formatida bo\'lishi kerak',
  });

export const videoFileSchema = z.instanceof(File, { message: 'Video fayl bo\'lishi kerak' })
  .refine((file) => file.size <= MAX_VIDEO_SIZE, {
    message: `Video hajmi ${MAX_VIDEO_SIZE / 1024 / 1024}MB dan oshmasligi kerak. Iltimos, videoni siqish yoki kichikroq fayl tanlang.`,
  })
  .refine((file) => file.type.startsWith('video/'), {
    message: 'Fayl video formatida bo\'lishi kerak',
  });

// Export Supabase limit for use in upload functions
export { SUPABASE_STORAGE_LIMIT };

// Checkout validation
export const checkoutSchema = z.object({
  name: z.string().min(2, 'Ism kamida 2 belgidan iborat bo\'lishi kerak').max(100, 'Ism juda uzun'),
  phone: z.string()
    .regex(/^\+998\d{9}$|^998\d{9}$|^\d{9}$/, 'Telefon raqam noto\'g\'ri formatda'),
  address: z.string().min(5, 'Manzil kamida 5 belgidan iborat bo\'lishi kerak').max(200, 'Manzil juda uzun'),
  notes: z.string().max(500, 'Eslatma juda uzun').optional(),
});

// Search validation
export const searchSchema = z.object({
  query: z.string().min(1, 'Qidiruv so\'zi kiritilishi shart').max(100, 'Qidiruv so\'zi juda uzun'),
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type PostInput = z.infer<typeof postSchema>;
export type CommentInput = z.infer<typeof commentSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type SearchInput = z.infer<typeof searchSchema>;
