import { BottomNav } from "@/components/layout/BottomNav";
import { ProductCard } from "@/components/products/ProductCard";
import { useFavoritesStore } from "@/store/favoritesStore";
import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Favorites() {
  const { favorites } = useFavoritesStore();

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="px-4 py-3">
          <h1 className="text-xl font-bold tracking-tight">Favorites</h1>
          <p className="text-sm text-muted-foreground">
            {favorites.length} {favorites.length === 1 ? "item" : "items"}
          </p>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-4">
        {favorites.length > 0 ? (
          <div className="grid grid-cols-2 gap-4">
            {favorites.map((product) => (
              <ProductCard key={product.id} product={product} />
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

      <BottomNav />
    </div>
  );
}
