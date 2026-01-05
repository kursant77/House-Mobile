import { useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Reels from "./pages/Reels";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Favorites from "./pages/Favorites";
import Cart from "./pages/Cart";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import StoreProfile from "./pages/StoreProfile";
import UploadProduct from "./pages/UploadProduct";
import EditProfile from "./pages/EditProfile";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { Layout } from "./components/layout/Layout";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/services/api/auth";
import { useCartStore } from "@/store/cartStore";
import { useFavoritesStore } from "@/store/favoritesStore";

const queryClient = new QueryClient();

const AppContent = () => {
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();

    // Listen to Supabase auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        const user = session?.user;
        if (user) {
          // Use authApi to get full profile (syncs with profiles table)
          authApi.getProfile().then(userData => {
            if (session.access_token) {
              localStorage.setItem("auth_token", session.access_token);
              localStorage.setItem("user", JSON.stringify(userData));
              useAuthStore.getState().setUser(userData as any);
              useCartStore.getState().fetchCart();
              useFavoritesStore.getState().fetchFavorites();
            }
          }).catch(console.error);
        }
      } else if (event === 'SIGNED_OUT') {
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
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/reels" element={<Reels />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
          <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          <Route path="/search" element={<Products />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/profile/edit" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
          <Route path="/profile/:id" element={<StoreProfile />} />
          <Route path="/upload" element={<ProtectedRoute><UploadProduct /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        </Route>

        <Route path="/auth" element={<Auth />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-center" />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
