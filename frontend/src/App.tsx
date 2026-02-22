import { useEffect } from "react";
import { Analytics as VercelAnalytics } from "@vercel/analytics/react";
import { supabase } from "@/lib/supabase";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { Layout } from "./components/layout/Layout";
import { AdminLayout } from "./components/admin/AdminLayout";
import { SellerLayout } from "./components/seller/SellerLayout";
import { Loader2 } from "lucide-react";

// Lazy load pages for code splitting
const Home = lazy(() => import("./pages/Home"));
const Reels = lazy(() => import("./pages/Reels"));
const Products = lazy(() => import("./pages/Products"));
const SearchIconPage = lazy(() => import("./pages/Search"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const PostDetail = lazy(() => import("./pages/PostDetail"));
const Favorites = lazy(() => import("./pages/Favorites"));
const Cart = lazy(() => import("./pages/Cart"));
const Auth = lazy(() => import("./pages/Auth"));
const Profile = lazy(() => import("./pages/Profile"));
const StoreProfile = lazy(() => import("./pages/StoreProfile"));
const UploadProduct = lazy(() => import("./pages/UploadProduct"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const NotFound = lazy(() => import("./pages/NotFound"));
const History = lazy(() => import("./pages/History"));
const MyVideos = lazy(() => import("./pages/MyVideos"));
const WatchLater = lazy(() => import("./pages/WatchLater"));
const Settings = lazy(() => import("@/pages/Settings"));
const Blocked = lazy(() => import("./pages/Blocked"));
const MyOrders = lazy(() => import("./pages/MyOrders"));
const ApplySeller = lazy(() => import("./pages/ApplySeller"));
const ApplyBlogger = lazy(() => import("./pages/ApplyBlogger"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard"));
const UsersList = lazy(() => import("./pages/admin/UsersList"));
const ProductsList = lazy(() => import("./pages/admin/ProductsList"));
const OrdersAdmin = lazy(() => import("./pages/admin/OrdersAdmin"));
const OrderDetail = lazy(() => import("./pages/admin/OrderDetail"));
const ReelsList = lazy(() => import("./pages/admin/ReelsList"));
const AdminAnalytics = lazy(() => import("./pages/admin/Analytics"));
const NotificationsAdmin = lazy(() => import("./pages/admin/NotificationsAdmin"));
const AdminUserProfile = lazy(() => import("./pages/admin/AdminUserProfile"));
const SupportAdmin = lazy(() => import("./pages/admin/SupportAdmin"));
const AdminNews = lazy(() => import("./pages/admin/AdminNews"));
const ApplicationsAdmin = lazy(() => import("./pages/admin/ApplicationsAdmin"));
const SellerDashboard = lazy(() => import("./pages/admin/SellerDashboard"));
const SellerOrders = lazy(() => import("./pages/admin/SellerOrders"));
const SellerInventory = lazy(() => import("./pages/admin/SellerInventory"));
const SellerFinancial = lazy(() => import("./pages/admin/SellerFinancial"));
const SellerReviews = lazy(() => import("./pages/admin/SellerReviews"));
const SellerPromotions = lazy(() => import("./pages/admin/SellerPromotions"));
const SellerSettings = lazy(() => import("./pages/admin/SellerSettings"));
const SellerAnalytics = lazy(() => import("./pages/admin/SellerAnalytics"));
const MarketingDashboard = lazy(() => import("./pages/admin/MarketingDashboard"));
const ReferralHub = lazy(() => import("./pages/ReferralHub"));
const FeatureFlags = lazy(() => import("./pages/admin/FeatureFlags"));
const BadgesAdmin = lazy(() => import("./pages/admin/BadgesAdmin"));
const ContentModeration = lazy(() => import("./pages/admin/ContentModeration"));
const TelegramHub = lazy(() => import("./pages/TelegramHub"));

// Footer Pages
const About = lazy(() => import("./pages/footer/About"));
const Press = lazy(() => import("./pages/footer/Press"));
const Copyright = lazy(() => import("./pages/footer/Copyright"));
const Contact = lazy(() => import("./pages/footer/Contact"));
const Bloggers = lazy(() => import("./pages/footer/Bloggers"));
const Advertising = lazy(() => import("./pages/footer/Advertising"));

// Loading fallback component

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-muted-foreground">Yuklanmoqda...</p>
    </div>
  </div>
);
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/services/api/auth";
import { useCartStore } from "@/store/cartStore";
import { useFavoritesStore } from "@/store/favoritesStore";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import {
  REACT_QUERY_GC_TIME_MS,
  REACT_QUERY_RETRY_DELAY_MS,
  REACT_QUERY_STALE_TIME_MS,
} from "@/lib/config";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: REACT_QUERY_STALE_TIME_MS,
      gcTime: REACT_QUERY_GC_TIME_MS,
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: true,
      refetchInterval: false,
      retry: 1,
      retryDelay: REACT_QUERY_RETRY_DELAY_MS,
    },
    mutations: {
      retry: 0,
    },
  },
});

const AppContent = () => {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();

    // Listen to Supabase auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        const user = session?.user;
        if (user) {
          // Use authApi to get full profile (syncs with profiles table)
          authApi.getProfile().then(async (userData) => {
            // Check if user is blocked
            if (userData.isBlocked) {
              // Logout immediately
              supabase.auth.signOut();
              return;
            }

            if (session.access_token) {
              // Save minimal data to sessionStorage
              const { sessionStorage: sessionStorageUtil } = await import('@/lib/sessionStorage');
              sessionStorageUtil.saveUser(userData.id, userData.role);
              // Store minimal non-sensitive data in localStorage for backward compatibility
              const minimalUser = { id: userData.id, role: userData.role };
              localStorage.setItem("user", JSON.stringify(minimalUser));
              useAuthStore.getState().setUser(userData);
              useCartStore.getState().fetchCart();
              useFavoritesStore.getState().fetchFavorites();
            }
          }).catch(async (error) => {
            const { handleError } = await import('@/lib/errorHandler');
            handleError(error, 'App.authStateChange');
          });
        }
      } else if (event === 'SIGNED_OUT') {
        // Clear sessionStorage
        const { sessionStorage: sessionStorageUtil } = await import('@/lib/sessionStorage');
        sessionStorageUtil.clear();
        // Clear legacy localStorage
        localStorage.removeItem("auth_token");
        localStorage.removeItem("user");
        useAuthStore.getState().setUser(null);
        useCartStore.getState().resetCart();
        useFavoritesStore.getState().clearFavorites();
      }
    });

    return () => subscription.unsubscribe();
  }, [checkAuth]);

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/reels" element={<Reels />} />
            <Route path="/products" element={<Products />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/post/:id" element={<PostDetail />} />
            <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
            <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
            <Route path="/search" element={<SearchIconPage />} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
            <Route path="/profile/:id" element={<StoreProfile />} />
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
            <Route path="/my-orders" element={<ProtectedRoute><MyOrders /></ProtectedRoute>} />
            <Route path="/apply/seller" element={<ProtectedRoute><ApplySeller /></ProtectedRoute>} />
            <Route path="/apply/blogger" element={<ProtectedRoute><ApplyBlogger /></ProtectedRoute>} />

            <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
            <Route path="/my-videos" element={<ProtectedRoute><MyVideos /></ProtectedRoute>} />
            <Route path="/watch-later" element={<ProtectedRoute><WatchLater /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/upload-product" element={<ProtectedRoute><UploadProduct /></ProtectedRoute>} />
            <Route path="/referral" element={<ProtectedRoute><ReferralHub /></ProtectedRoute>} />
            <Route path="/telegram" element={<ProtectedRoute><TelegramHub /></ProtectedRoute>} />

            {/* Footer Pages */}
            <Route path="/about" element={<About />} />
            <Route path="/press" element={<Press />} />
            <Route path="/copyright" element={<Copyright />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/bloggers" element={<Bloggers />} />
            <Route path="/advertising" element={<Advertising />} />
          </Route>

          {/* Seller Routes */}
          <Route path="/seller" element={
            <ProtectedRoute role={['blogger', 'seller', 'super_admin']}>
              <SellerLayout />
            </ProtectedRoute>
          }>
            <Route index element={<SellerDashboard />} />
            <Route path="dashboard" element={<SellerDashboard />} />
            <Route path="orders" element={<SellerOrders />} />
            <Route path="inventory" element={<SellerInventory />} />
            <Route path="financial" element={<SellerFinancial />} />
            <Route path="reviews" element={<SellerReviews />} />
            <Route path="promotions" element={<SellerPromotions />} />
            <Route path="analytics" element={<SellerAnalytics />} />
            <Route path="settings" element={<SellerSettings />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute role={['super_admin']}>
              <AdminLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<UsersList />} />
            <Route path="users/:id" element={<AdminUserProfile />} />
            <Route path="news" element={<AdminNews />} />
            <Route path="products" element={<ProductsList />} />
            <Route path="orders" element={<OrdersAdmin />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="applications" element={<ApplicationsAdmin />} />
            <Route path="reels" element={<ReelsList />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="marketing" element={<MarketingDashboard />} />
            <Route path="feature-flags" element={<FeatureFlags />} />
            <Route path="badges" element={<BadgesAdmin />} />
            <Route path="moderation" element={<ContentModeration />} />
            <Route path="notifications" element={<NotificationsAdmin />} />
            <Route path="messages" element={<SupportAdmin type="messages" />} />
            <Route path="email" element={<SupportAdmin type="email" />} />
            <Route path="support" element={<SupportAdmin type="support" />} />
            <Route path="settings" element={<SupportAdmin type="settings" />} />
          </Route>

          <Route path="/auth" element={<Auth />} />
          <Route path="/blocked" element={<Blocked />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

const App = () => (
  <ErrorBoundary>
    <HelmetProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner position="top-center" />
            <AppContent />
            <VercelAnalytics />
          </TooltipProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </HelmetProvider>
  </ErrorBoundary>
);

export default App;
