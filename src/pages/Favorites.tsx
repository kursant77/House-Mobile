import { BottomNav } from "@/components/layout/BottomNav";
import { ProductCard } from "@/components/products/ProductCard";
import { useFavoritesStore } from "@/store/favoritesStore";
import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";

export default function Favorites() {
  const { favorites } = useFavoritesStore();
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Sidebar />
      <div className="min-h-screen bg-background pb-20 md:pb-0 md:pt-16">
        <BottomNav />
        {/* Header - faqat mobile uchun */}
        {isMobile && (
          <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
            <div className="px-4 py-3">
              <h1 className="text-xl font-bold tracking-tight">Favorites</h1>
              <p className="text-sm text-muted-foreground">
                {favorites.length} {favorites.length === 1 ? "item" : "items"}
              </p>
            </div>
          </header>
        )}

        {/* Desktop Header */}
        {!isMobile && (
          <div className="container mx-auto px-4 py-6 max-w-6xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">Favorites</h1>
                <p className="text-muted-foreground">
                  {favorites.length} {favorites.length === 1 ? "item" : "items"} saved
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        <main className="px-4 py-4 md:container md:mx-auto md:max-w-6xl">
          {favorites.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {favorites.map((product, index) => (
                <div
                  key={product.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 rounded-full bg-muted p-4">
                <Heart className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="mb-2 text-lg font-semibold">No favorites yet</h2>
              <p className="mb-6 text-muted-foreground max-w-xs">
                Start adding products you love by tapping the heart icon
              </p>
              <Link to="/products">
                <Button className="rounded-xl">Browse Products</Button>
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
