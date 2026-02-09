/**
 * User-friendly error messages in Uzbek
 * Centralized error message dictionary
 */

export const ERROR_MESSAGES = {
  // Authentication
  AUTH_REQUIRED: 'Iltimos, avval tizimga kiring',
  AUTH_FAILED: 'Kirishda xatolik yuz berdi',
  AUTH_BLOCKED: 'Sizning akkauntingiz adminlar tomonidan bloklangan',
  AUTH_INVALID: 'Email yoki parol noto\'g\'ri',
  
  // Registration
  REGISTER_FAILED: 'Ro\'yxatdan o\'tishda xatolik',
  USERNAME_TAKEN: 'Bu username allaqachon olingan',
  EMAIL_TAKEN: 'Bu email allaqachon ishlatilmoqda',
  
  // Products
  PRODUCT_NOT_FOUND: 'Mahsulot topilmadi',
  PRODUCT_CREATE_FAILED: 'Mahsulot yaratishda xatolik',
  PRODUCT_UPDATE_FAILED: 'Mahsulot yangilashda xatolik',
  PRODUCT_DELETE_FAILED: 'Mahsulot o\'chirishda xatolik',
  
  // Files
  FILE_TOO_LARGE: 'Fayl hajmi juda katta',
  FILE_INVALID_TYPE: 'Fayl formati qo\'llab-quvvatlanmaydi',
  FILE_UPLOAD_FAILED: 'Fayl yuklashda xatolik',
  IMAGE_REQUIRED: 'Iltimos, kamida bitta rasm yuklang',
  VIDEO_REQUIRED: 'Video yuklash majburiy',
  
  // Network
  NETWORK_ERROR: 'Internet aloqasi yo\'q. Iltimos, qayta urinib ko\'ring',
  TIMEOUT: 'So\'rov vaqti tugadi',
  SERVER_ERROR: 'Server xatoligi. Iltimos, keyinroq qayta urinib ko\'ring',
  
  // Validation
  VALIDATION_FAILED: 'Ma\'lumotlar noto\'g\'ri',
  REQUIRED_FIELD: 'Bu maydon to\'ldirilishi shart',
  INVALID_EMAIL: 'Email noto\'g\'ri formatda',
  INVALID_PHONE: 'Telefon raqam noto\'g\'ri formatda',
  INVALID_USERNAME: 'Username noto\'g\'ri formatda',
  PASSWORD_TOO_SHORT: 'Parol kamida 6 belgidan iborat bo\'lishi kerak',
  
  // General
  UNKNOWN_ERROR: 'Noma\'lum xatolik yuz berdi',
  OPERATION_FAILED: 'Amal bajarilmadi',
  PERMISSION_DENIED: 'Sizda bu amalni bajarish uchun ruxsat yo\'q',
  
  // Comments
  COMMENT_CREATE_FAILED: 'Komentariya yozishda xatolik',
  COMMENT_DELETE_FAILED: 'Komentariya o\'chirishda xatolik',
  
  // Posts
  POST_NOT_FOUND: 'Post topilmadi',
  POST_CREATE_FAILED: 'Post yaratishda xatolik',
  
  // Cart
  CART_ADD_FAILED: 'Savatchaga qo\'shishda xatolik',
  CART_EMPTY: 'Savatcha bo\'sh',
  
  // Profile
  PROFILE_UPDATE_FAILED: 'Profil yangilashda xatolik',
  PROFILE_NOT_FOUND: 'Profil topilmadi',
} as const;

/**
 * Get error message by key
 */
export const getError = (key: keyof typeof ERROR_MESSAGES): string => {
  return ERROR_MESSAGES[key];
};

/**
 * Format error message with additional context
 */
export const formatError = (key: keyof typeof ERROR_MESSAGES, ...args: string[]): string => {
  let message = ERROR_MESSAGES[key];
  args.forEach((arg, index) => {
    message = message.replace(`{${index}}`, arg);
  });
  return message;
};
