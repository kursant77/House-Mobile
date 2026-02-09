# 🚀 Deployment Guide

## Production Checklist

### 1. Environment Variables
Quyidagi o'zgaruvchilarni production server'ga qo'shing:

```bash
# Supabase
VITE_SUPABASE_URL=your_production_url
VITE_SUPABASE_ANON_KEY=your_production_key

# Sentry (Error Tracking)
VITE_SENTRY_DSN=your_sentry_dsn

# Google Analytics
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### 2. Supabase Setup

1. **Database Migration**
   - Barcha jadvallar yaratilgan
   - RLS (Row Level Security) yoqilgan
   - Indexlar qo'shilgan

2. **Storage Buckets**
   - `products` - Mahsulot rasmlari
   - `avatars` - Foydalanuvchi avatarlari
   - `videos` - Reels videolar

3. **API Rate Limiting**
   - Supabase Edge Functions
   - Rate limit: 100 req/min per user

### 3. Security

✅ **Bajarilgan:**
- Environment variables validation
- Sentry error tracking
- Type safety (no `as any`)
- Error handling (all APIs)
- Input sanitization
- XSS protection

⚠️ **Qo'shimcha (ixtiyoriy):**
- 2FA implementation (TOTP ready)
- Session limits (3 devices max)
- File upload malware scan
- CAPTCHA for auth forms

### 4. Performance

✅ **Optimizatsiya qilingan:**
- Server-side pagination
- Image compression (2MB max)
- Code splitting (7 vendor chunks)
- Lazy loading
- PWA caching

### 5. Testing

```bash
# Unit testlar
npm run test

# Coverage
npm run test:coverage

# Build test
npm run build
```

### 6. CI/CD

GitHub Actions workflow yaratilgan:
- `.github/workflows/ci.yml`
- Har commit'da test + lint
- Main branch'da auto-deploy

**GitHub Secrets qo'shing:**
1. Settings > Secrets > Actions
2. Quyidagilarni qo'shing:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_SENTRY_DSN`
   - `VITE_GA_MEASUREMENT_ID`

### 7. Deployment Platforms

#### Option 1: Vercel (Tavsiya)
```bash
npm install -g vercel
vercel login
vercel --prod
```

#### Option 2: Netlify
```bash
npm install -g netlify-cli
netlify deploy --prod
```

#### Option 3: Custom Server
```bash
npm run build
# dist/ fayllarni serverga yuklang
```

### 8. Post-Deployment

1. **Monitoring**
   - Sentry'da xatolarni tekshiring
   - Google Analytics'da trafficni ko'ring
   - Lighthouse score tekshiring (90+)

2. **Database Backup**
   - Supabase auto-backup yoqing
   - Haftalik manual backup

3. **SSL Certificate**
   - HTTPS yoqilganligini tekshiring
   - Auto-renewal sozlang

### 9. Maintenance

```bash
# Dependencies update
npm audit
npm update

# Security patches
npm audit fix

# Build size check
npm run build
# dist/ hajmini tekshiring (<2MB)
```

### 10. Roll-back Plan

Agar muammo bo'lsa:
```bash
# Git'da oldingi versiyaga qaytish
git revert HEAD
git push

# Vercel'da oldingi deployment
vercel rollback
```

---

## 🎯 Production Launch Checklist

- [ ] Barcha env variables sozlandi
- [ ] Supabase credentials yangilandi
- [ ] Sentry sozlandi va ishlayapti
- [ ] Google Analytics ishlayapti
- [ ] SSL certificate bormi
- [ ] Domain sozlandi
- [ ] Testlar o'tdi (100%)
- [ ] Performance test (Lighthouse 90+)
- [ ] SEO optimizatsiya
- [ ] robots.txt va sitemap.xml
- [ ] 404 sahifa
- [ ] Error handling tekshirildi
- [ ] Mobile responsive (100%)
- [ ] Browser compatibility
- [ ] Backup strategiyasi
- [ ] Monitoring sozlandi

---

## 📞 Support

Muammo bo'lsa:
1. Sentry'da xatolarni tekshiring
2. Supabase logs'ni ko'ring
3. Browser console'ni tekshiring
