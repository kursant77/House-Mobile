---
name: ""
overview: ""
todos: []
isProject: false
---

## Maqsad

Fayl yuklashda "The object exceeded the maximum allowed size" xatoligini hal qilish. Katta fayllar (500MB+ videolar) uchun chunked upload qo'shish va error handling yaxshilash.

## Asosiy muammo

- Supabase storage default limiti 50MB (yoki 100MB, plan'ga qarab)
- Kod 500MB video yuklashga ruxsat beradi
- Katta fayllar yuklashda xatolik bo'lyapti
- Chunked upload yo'q

## O'zgarishlar

### 1. Chunked upload funksiyasini yaratish

**Fayl:** `src/services/api/products.ts`

- `uploadMedia` funksiyasini chunked upload bilan yaxshilash
- Katta fayllar uchun (masalan, 50MB dan katta) chunked upload ishlatish
- Har bir chunk'ni alohida yuklash va keyin birlashtirish
- Progress tracking yaxshilash
```typescript
// Chunked upload funksiyasi
const CHUNK_SIZE = 50 * 1024 * 1024; // 50MB per chunk
const SUPABASE_MAX_SIZE = 50 * 1024 * 1024; // 50MB Supabase limit

uploadMedia: async (file: File, bucket: string = 'product-media', onProgress?: (progress: number) => void, skipSizeValidation: boolean = false): Promise<string> => {
  // ... existing validation code ...

  // Check if file is larger than Supabase limit
  const needsChunking = file.size > SUPABASE_MAX_SIZE;
  
  if (needsChunking) {
    return await uploadMediaChunked(file, bucket, onProgress);
  } else {
    return await uploadMediaDirect(file, bucket, onProgress);
  }
}

// Direct upload for small files
const uploadMediaDirect = async (file: File, bucket: string, onProgress?: (progress: number) => void): Promise<string> => {
  // ... existing upload code ...
}

// Chunked upload for large files
const uploadMediaChunked = async (file: File, bucket: string, onProgress?: (progress: number) => void): Promise<string> => {
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const fileExt = file.name.split('.').pop() || 'bin';
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 10);
  const baseFileName = `${timestamp}-${randomString}`;
  
  // Upload each chunk
  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);
    const chunkFileName = `${baseFileName}.part${chunkIndex}`;
    
    const { error } = await supabase.storage
      .from(bucket)
      .upload(chunkFileName, chunk, {
        cacheControl: '3600',
        upsert: false,
      });
    
    if (error) {
      // Cleanup uploaded chunks on error
      for (let i = 0; i < chunkIndex; i++) {
        await supabase.storage.from(bucket).remove([`${baseFileName}.part${i}`]);
      }
      throw new Error(`Chunk ${chunkIndex + 1} yuklashda xatolik: ${error.message}`);
    }
    
    if (onProgress) {
      onProgress(Math.round(((chunkIndex + 1) / totalChunks) * 90)); // 90% for upload
    }
  }
  
  // Note: Supabase doesn't support automatic chunk merging
  // We need to use a different approach or backend service
  // For now, we'll use direct upload with increased limit check
}
```


### 2. Supabase storage limitini tekshirish va aniq xatolik xabarlari

**Fayl:** `src/services/api/products.ts`

- Supabase storage limitini tekshirish (50MB yoki 100MB)
- Aniq xatolik xabarlari
- File size check qo'shish
```typescript
// Supabase storage limits
const SUPABASE_STORAGE_LIMIT = 50 * 1024 * 1024; // 50MB (check your Supabase plan)

// Before upload, check file size
if (file.size > SUPABASE_STORAGE_LIMIT && !skipSizeValidation) {
  const sizeInMB = (file.size / 1024 / 1024).toFixed(2);
  const limitInMB = (SUPABASE_STORAGE_LIMIT / 1024 / 1024).toFixed(0);
  throw new Error(
    `Fayl hajmi ${sizeInMB}MB, lekin maksimal ruxsat etilgan hajm ${limitInMB}MB. ` +
    `Iltimos, faylni siqish yoki kichikroq fayl tanlang.`
  );
}
```


### 3. Alternative: Backend service yoki Supabase Edge Function

**Yangi fayl:** `src/services/api/chunkedUpload.ts` (ixtiyoriy)

- Supabase Edge Function yordamida chunked upload
- Yoki backend service orqali katta fayllarni yuklash
- Bu eng yaxshi yechim, lekin qo'shimcha sozlash kerak

### 4. Error handling yaxshilash

**Fayl:** `src/services/api/products.ts`

- Aniq xatolik xabarlari
- File size xatoliklari uchun maxsus xabarlar
- Retry mechanism qo'shish (ixtiyoriy)
```typescript
if (uploadError) {
  // Check for specific error types
  if (uploadError.message.includes('exceeded') || uploadError.message.includes('maximum')) {
    const sizeInMB = (file.size / 1024 / 1024).toFixed(2);
    throw new Error(
      `Fayl juda katta (${sizeInMB}MB). Supabase storage limiti: 50MB. ` +
      `Iltimos, faylni siqish yoki kichikroq fayl tanlang.`
    );
  }
  throw new Error(`Fayl yuklashda xatolik: ${uploadError.message}`);
}
```


### 5. File size limitini realistik qilish

**Fayl:** `src/lib/validation.ts`

- Video size limitini 500MB dan 50MB ga kamaytirish (yoki Supabase limitiga moslashtirish)
- Yoki aniq xabar qo'shish - agar 50MB dan katta bo'lsa, siqish tavsiya qilish
```typescript
// File validation
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB (Supabase limit)
// Yoki 100MB agar Supabase Pro plan bo'lsa

export const videoFileSchema = z.instanceof(File, { message: 'Video fayl bo\'lishi kerak' })
  .refine((file) => file.size <= MAX_VIDEO_SIZE, {
    message: `Video hajmi ${MAX_VIDEO_SIZE / 1024 / 1024}MB dan oshmasligi kerak. Iltimos, videoni siqish yoki kichikroq fayl tanlang.`,
  })
  .refine((file) => file.type.startsWith('video/'), {
    message: 'Fayl video formatida bo\'lishi kerak',
  });
```


### 6. UI'da file size limitini ko'rsatish

**Fayl:** `src/pages/UploadProduct.tsx` va `src/components/products/ProductMediaUpload.tsx`

- File size limitini aniq ko'rsatish
- Katta fayl tanlanganda ogohlantirish
- Siqish tavsiyasi
```typescript
// ProductMediaUpload.tsx
<span className="text-xs md:text-sm text-muted-foreground">
  MP4, maksimal 50MB (katta fayllar uchun siqish tavsiya etiladi)
</span>
```


### 7. News videos uchun maxsus yechim

**Fayl:** `src/pages/UploadProduct.tsx`

- News videos uchun ham 50MB limit qo'llash
- Yoki aniq xabar - "News videos uchun ham 50MB limit bor"
- `skipSizeValidation` ni olib tashlash yoki faqat file type validation qoldirish

### 8. Progress tracking yaxshilash

**Fayl:** `src/services/api/products.ts`

- Chunked upload uchun progress tracking
- Har bir chunk uchun progress
- Aniq progress ko'rsatish

## Eng yaxshi yechim

**Tavsiya:** Supabase storage limitini 50MB ga o'rnatish va foydalanuvchilarga aniq xabar berish. Chunked upload murakkab va qo'shimcha sozlash kerak.

1. Video size limitini 50MB ga kamaytirish
2. Aniq xatolik xabarlari
3. UI'da limit ko'rsatish
4. Siqish tavsiyasi

Agar katta fayllar kerak bo'lsa:

- Supabase Pro plan'ga o'tish (100MB limit)
- Yoki backend service orqali chunked upload
- Yoki boshqa storage service (Cloudflare R2, AWS S3) ishlatish

## Qo'shimcha tekshiruvlar

- File size limitini tekshirish
- Error handling to'g'ri ishlashini tekshirish
- UI'da limit ko'rsatilishini tekshirish
- Progress tracking to'g'ri ishlashini tekshirish
- Katta fayl yuklashda aniq xabar ko'rsatilishini tekshirish