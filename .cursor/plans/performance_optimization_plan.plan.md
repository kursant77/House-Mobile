## Maqsad

Websaytni juda tez ishlashini ta'minlash, real-time updates qo'shish va authentication persistence muammosini hal qilish.

## Asosiy muammolar

1. **Performance muammolari:**
   - `refetchOnMount: false` - yangi ma'lumotlar ko'rinmaydi
   - `staleTime: 5 minutes` - juda uzoq, yangi ma'lumotlar ko'rinmaydi
   - Real-time subscriptions yo'q (products, posts uchun)
   - Ko'p invalidateQueries ishlatilmoqda (55+ ta)

2. **Authentication muammolari:**
   - Refresh qilganda login qilish kerak bo'lyapti
   - `checkAuth` har safar to'liq profile fetch qiladi
   - Session persistence muammosi

3. **Real-time updates muammolari:**
   - Products va posts uchun real-time subscriptions yo'q
   - Yangi ma'lumotlar sahifani yangilamaguncha ko'rinmaydi

## O'zgarishlar

### 1. React Query cache strategiyasini optimallashtirish

**Fayl:** `src/App.tsx`

- `staleTime` ni qisqartirish: `1000 * 60 * 5` -> `1000 * 60 * 1` (1 daqiqa)
- `refetchOnMount` ni `true` ga o'zgartirish (yangi ma'lumotlar ko'rinishi uchun)
- `refetchOnWindowFocus` ni `true` ga o'zgartirish (background'dan qaytganda yangilash)
- `refetchInterval` qo'shish: `1000 * 60 * 2` (2 daqiqada bir marta background refetch)
- `gcTime` ni optimallashtirish: `1000 * 60 * 30` -> `1000 * 60 * 15` (15 daqiqa)

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 1, // 1 minute - data is fresh for 1 minute
      gcTime: 1000 * 60 * 15, // 15 minutes - cache for 15 minutes
      refetchOnWindowFocus: true, // Refetch on window focus for fresh data
      refetchOnMount: true, // Refetch on mount if data is stale
      refetchOnReconnect: true, // Refetch on reconnect
      refetchInterval: 1000 * 60 * 2, // Refetch every 2 minutes in background
      retry: 1,
      retryDelay: 1000,
    },
    mutations: {
      retry: 0,
    },
  },
});
```

### 2. Real-time subscriptions qo'shish - Products

**Fayl:** `src/pages/Products.tsx`

- Products uchun real-time subscription qo'shish
- Yangi product qo'shilganda yoki o'zgartirilganda avtomatik yangilash

```typescript
useEffect(() => {
  if (!isLoading) {
    const channel = supabase
      .channel('products-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'products'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['products'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}, [isLoading, queryClient]);
```

### 3. Real-time subscriptions qo'shish - Posts

**Fayl:** `src/pages/Home.tsx`

- Posts uchun real-time subscription qo'shish
- Yangi post qo'shilganda yoki o'zgartirilganda avtomatik yangilash

```typescript
useEffect(() => {
  if (!postsLoading) {
    const channel = supabase
      .channel('posts-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts'
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['public-posts'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
}, [postsLoading, queryClient]);
```

### 4. Real-time subscriptions qo'shish - Reels

**Fayl:** `src/pages/Reels.tsx`

- Reels uchun real-time subscription qo'shish
- Yangi reel qo'shilganda avtomatik yangilash

### 5. Authentication persistence yaxshilash

**Fayl:** `src/store/authStore.ts`

- `checkAuth` funksiyasini optimallashtirish:
  - Avval session tekshirish
  - Agar session mavjud bo'lsa, saved user bilan darhol state'ni set qilish
  - Background'da fresh user data fetch qilish
  - Error bo'lsa ham saved user bilan ishlash

```typescript
checkAuth: async () => {
  // Avval session tekshirish
  const isAuthenticated = await authApi.isAuthenticated();
  
  if (isAuthenticated) {
    // Saved user bilan darhol state'ni set qilish (tez UI)
    const savedUser = authApi.getSavedUser();
    if (savedUser) {
      set({ user: savedUser as User, isAuthenticated: true, isLoading: false });
    } else {
      set({ isLoading: true });
    }

    // Background'da fresh data fetch qilish
    authApi.getProfile()
      .then((freshUser) => {
        if (freshUser.isBlocked) {
          authApi.logout();
          set({ user: null, isAuthenticated: false, isLoading: false });
          return;
        }
        set({ user: freshUser as User, isAuthenticated: true, isLoading: false });
        // Save for next time
        const minimalUser = { id: freshUser.id, role: freshUser.role };
        localStorage.setItem("user", JSON.stringify(minimalUser));
        sessionStorageUtil.saveUser(freshUser.id, freshUser.role);
      })
      .catch((e) => {
        // Error bo'lsa ham saved user bilan ishlash
        if (savedUser) {
          set({ user: savedUser as User, isAuthenticated: true, isLoading: false });
        } else {
          set({ user: null, isAuthenticated: false, isLoading: false });
        }
      });
  } else {
    set({ user: null, isAuthenticated: false, isLoading: false });
  }
}
```

### 6. Supabase session persistence yaxshilash

**Fayl:** `src/lib/supabase.ts`

- Supabase client'ni session persistence bilan sozlash
- `autoRefreshToken: true` va `persistSession: true` ni ta'minlash

```typescript
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage, // yoki custom storage
  },
});
```

### 7. Optimistic updates qo'shish

**Fayl:** `src/components/reels/CommentsList.tsx` va boshqa joylar

- Comment qo'shganda optimistic update qo'shish
- Like/Unlike'da optimistic update qo'shish
- Real-time subscription bilan birga ishlashi

### 8. Query invalidation optimallashtirish

**Barcha fayllar**

- `invalidateQueries` o'rniga `setQueryData` ishlatish (optimistic updates)
- Faqat zarur bo'lganda `invalidateQueries` ishlatish
- Background refetch'ni kamaytirish

### 9. Debouncing qo'shish - Search

**Fayl:** `src/components/layout/Header.tsx` va boshqa search joylar

- Search input'lar uchun debouncing qo'shish
- 300ms debounce delay

```typescript
const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearchQuery(searchQuery);
  }, 300);
  return () => clearTimeout(timer);
}, [searchQuery]);
```

### 10. Image lazy loading optimallashtirish

**Fayl:** `src/components/products/ProductCard.tsx` va boshqa joylar

- Native `loading="lazy"` attribute qo'shish
- Intersection Observer API ishlatish (ixtiyoriy)

### 11. Code splitting yaxshilash

**Fayl:** `src/App.tsx`

- Barcha sahifalar allaqachon lazy loaded
- Yana optimallashtirish: heavy component'larni alohida chunk'larga ajratish

### 12. Memoization yaxshilash

**Barcha sahifalar**

- `useMemo` va `useCallback` ishlatishni tekshirish
- Expensive computation'larni memoize qilish
- Component re-render'larni kamaytirish

### 13. Background sync qo'shish

**Fayl:** `src/App.tsx`

- Service Worker qo'shish (ixtiyoriy, PWA uchun)
- Background sync API ishlatish (ixtiyoriy)

### 14. Cache persistence yaxshilash

**Fayl:** `src/App.tsx`

- React Query cache'ni localStorage'ga persist qilish
- `@tanstack/react-query-persist-client` ishlatish (ixtiyoriy)

### 15. Error boundary va retry strategiyasini yaxshilash

**Fayl:** `src/App.tsx`

- Retry strategiyasini optimallashtirish
- Exponential backoff qo'shish

## Qo'shimcha optimallashtirishlar

1. **Bundle size optimallashtirish:**
   - Tree shaking tekshirish
   - Unused dependencies olib tashlash
   - Dynamic imports ishlatish

2. **Network optimallashtirish:**
   - Request batching
   - GraphQL yoki REST optimizatsiyasi
   - Compression

3. **Rendering optimallashtirish:**
   - Virtual scrolling (katta listlar uchun)
   - React.memo ishlatish
   - useTransition ishlatish (heavy updates uchun)

## Test qilish

1. **Performance metrikalari:**
   - First Contentful Paint (FCP)
   - Largest Contentful Paint (LCP)
   - Time to Interactive (TTI)
   - Total Blocking Time (TBT)

2. **Real-time updates test:**
   - Yangi product/post qo'shganda avtomatik ko'rinishi
   - Comment qo'shganda avtomatik ko'rinishi
   - Like/Unlike avtomatik yangilanishi

3. **Authentication test:**
   - Refresh qilganda login qilmasdan ishlashi
   - Session persistence ishlashi
   - Background sync ishlashi
