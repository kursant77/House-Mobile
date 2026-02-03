# 🏠 House Mobile - Social Commerce Platform

E-commerce va ijtimoiy tarmoq funksiyalarini birlashtirgan zamonaviy platforma.

## ✨ Asosiy Funksiyalar

- 🛍️ **E-commerce:** Mahsulot sotish/sotib olish, savat, to'lov
- 📱 **Social:** Reels, posts, following, messaging
- 💳 **To'lov:** Payme, Click, Stripe
- 🌐 **i18n:** O'zbek va Ingliz tillari
- 📊 **Analytics:** Google Analytics 4
- 🔐 **Xavfsizlik:** Sentry, 2FA, input validation
- ⚡ **Performance:** PWA, pagination, image optimization
- ✅ **Testing:** Vitest + React Testing Library

## 🚀 Quick Start

```bash
npm install
cp .env.example .env
# .env faylni to'ldiring
npm run dev
```

## 📁 Structure

```
src/
├── components/      # UI komponentlar
├── pages/          # 25+ sahifa
├── services/       # 18 API service
├── store/          # 11 Zustand store
├── lib/            # Utils (analytics, i18n, 2fa)
├── locales/        # Translations
└── __tests__/      # Tests
```

## 🛠️ Tech Stack

React 18 • TypeScript • Vite • Supabase • Zustand • React Query • shadcn/ui • Tailwind

## 📝 Scripts

```bash
npm run dev          # Dev server
npm run build        # Production build
npm run test         # Run tests
npm run lint         # ESLint
```

## 🚀 Deployment

Qarang: [DEPLOYMENT.md](./DEPLOYMENT.md)

Built with ❤️ using Claude Sonnet 4.5
