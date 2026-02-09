# House Mobile - Supabase Qo'llanmasi

Ushbu loyiha endi Node.js (Express) beckendidan to'liq voz kechdi va **Supabase** bilan integratsiya qilindi. Bu loyihani boshqarishni yanada osonlashtiradi.

## O'zgarishlar

### Texnologik o'zgarishlar
- **Beckend o'chirildi**: Node.js serveri va PostgreSQL bazasi o'rniga Supabase ishlatilmoqda.
- **Supabase Auth**: Ro'yxatdan o'tish, login va seanslar Supabase orqali boshqariladi.
- **Profil**: Foydalanuvchi ma'lumotlari Supabase `user_metadata` dagi saqlanadi.

## Sozlash bo'yicha ko'rsatma

1. **Supabase loyihasini yarating**:
   - [Supabase](https://supabase.com/) sahifasida yangi loyiha oching.
   - Project Settings -> API bo'limidan **URL** va **Anon Key** ni nusxalab oling.

2. **Frontend sozlamalari (`Frontend/.env`)**:
   - `Frontend/.env` faylida quyidagi ma'lumotlarni kiriting:
     ```env
     VITE_SUPABASE_URL=Sizning_URL
     VITE_SUPABASE_ANON_KEY=Sizning_Anon_Key
     ```

3. **Loyihani ishga tushirish**:
   ```bash
   cd Frontend
   npm run dev
   ```

## Asosiy funksiyalar
- **Login/Register**: To'g'ridan-to'g'ri Supabase Auth bilan ishlaydi.
- **Pro Status**: Profil sahifasidagi "Become Professional" tugmasi Supabase foydalanuvchi ma'lumotlarini (`metadata`) yangilaydi. Ism yonida "Pro" belgisi paydo bo'ladi.

> [!NOTE]
> Eski `Beckend` papkasini o'chirib tashlaysiz. Endi loyiha faqat `Frontend` papkasida ishlaydi.
