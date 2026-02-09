## Maqsad

Bildirishnoma tizimini mukammal qilish: Header'ga professional bildirishnoma dropdown qo'shish, real-time updates, animatsiyalar, mark as read funksiyalari va chiroyli dizayn.

## O'zgarishlar

### 1. Header'ga bildirishnoma Bell icon va dropdown qo'shish

**Fayl:** `src/components/layout/Header.tsx`

- Bell icon qo'shish (ThemeToggle va Post tugmasi orasiga, 346-qatordan keyin):
  - Unread count badge ko'rsatish
  - Hover effektlari
  - Animatsiyalar (pulse yoki bounce unread bo'lsa)
- DropdownMenu yaratish:
  - Header va max-height bilan (masalan, max-h-[500px])
  - Scroll qilinadigan ro'yxat
  - Empty state (bildirishnoma yo'q bo'lsa)
  - Loading state

### 2. Bildirishnoma ro'yxatini ko'rsatish

**Fayl:** `src/components/layout/Header.tsx`

- Har bir bildirishnoma uchun item:
  - Type'ga qarab rang (info, success, warning, error)
  - Icon (type'ga qarab: Info, CheckCircle, AlertTriangle, X)
  - Title va message
  - Time ago (formatDistanceToNow ishlatish)
  - Unread indicator (chap tomonda rangli chiziq yoki nuqta)
  - Hover effektlari
- Click handler:
  - Mark as read
  - Navigate (agar link bo'lsa)

### 3. Mark as read funksiyalari

**Fayl:** `src/components/layout/Header.tsx`

- Har bir bildirishnoma uchun mark as read:
  - Click qilinganda markAsRead chaqirish
  - Visual feedback (fade out yoki rang o'zgarishi)
- "Barchasini o'qildi deb belgilash" tugmasi:
  - Dropdown footer'da
  - markAllAsRead funksiyasini chaqirish
  - notificationService.markAllAsRead ishlatish

### 4. Notification store'ga markAllAsRead qo'shish

**Fayl:** `src/store/notificationStore.ts`

- markAllAsRead funksiyasini qo'shish:
  - notificationService.markAllAsRead chaqirish
  - Barcha bildirishnomalarni read_by ga qo'shish
  - unreadCount ni 0 ga o'rnatish

### 5. Dizayn va animatsiyalar

**Fayl:** `src/components/layout/Header.tsx`

- Bell icon:
  - Hover'da scale yoki glow effekt
  - Unread bo'lsa pulse animatsiya
  - Badge dizayni (red background, white text, ring)
- Dropdown:
  - Smooth slide-in animatsiya
  - Shadow va backdrop blur
  - Border radius (rounded-xl)
  - Width (masalan, w-80 yoki w-96)
- Bildirishnoma itemlar:
  - Hover'da background o'zgarishi
  - Smooth transitions
  - Type'ga qarab ranglar:
    - info: blue (bg-blue-50, border-blue-200, text-blue-700)
    - success: green (bg-green-50, border-green-200, text-green-700)
    - warning: yellow/amber (bg-amber-50, border-amber-200, text-amber-700)
    - error: red (bg-red-50, border-red-200, text-red-700)
  - Unread indicator: chap tomonda rangli chiziq (border-l-4)
- Empty state:
  - Icon (Bell yoki Inbox)
  - Matn: "Bildirishnomalar yo'q"
  - Chiroyli dizayn

### 6. Real-time updates

**Fayl:** `src/components/layout/Header.tsx`

- useEffect'da subscribe funksiyasini chaqirish (allaqachon mavjud, 89-95 qatorlar)
- Yangi bildirishnoma kelganda:
  - Badge yangilanishi
  - Dropdown'da yangi item ko'rinishi (agar ochiq bo'lsa)
  - Animatsiya (slide-in yoki fade-in)

### 7. Mobile versiyada ham qo'shish

**Fayl:** `src/components/layout/Header.tsx`

- Mobile versiyada ham Bell icon ko'rsatish
- Dropdown mobile uchun ham responsive qilish

## Qo'shimcha tekshiruvlar

- Bell icon to'g'ri ko'rsatilishini tekshirish
- Unread count badge to'g'ri ishlashini tekshirish
- Dropdown ochilish/yopilish animatsiyalari
- Bildirishnoma itemlarida mark as read ishlashini tekshirish
- "Barchasini o'qildi deb belgilash" funksiyasi
- Real-time updates ishlashini tekshirish
- Empty state to'g'ri ko'rsatilishini tekshirish
- Type'ga qarab ranglar to'g'ri ko'rsatilishini tekshirish
- Mobile va desktop versiyalarda to'g'ri ishlashini tekshirish
