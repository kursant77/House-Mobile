import { BottomNav } from "@/components/layout/BottomNav";
import { Play, ShoppingBag, User } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/products/ProductCard";
import { mockProducts } from "@/data/mockProducts";

export default function Home() {
  const featuredProducts = mockProducts.slice(0, 4);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold tracking-tight">House Mobile</h1>
          <Link to="/auth">
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 py-6 space-y-8">
        {/* Hero - Go to Reels */}
        <Link
          to="/reels"
          className="group relative block overflow-hidden rounded-2xl bg-primary p-6 transition-transform active:scale-[0.98]"
        >
          <div className="relative z-10">
            <div className="mb-4 inline-flex rounded-full bg-primary-foreground/20 p-3">
              <Play className="h-8 w-8 text-primary-foreground" />
            </div>
            <h2 className="mb-2 text-2xl font-bold text-primary-foreground">
              Discover Products
            </h2>
            <p className="text-primary-foreground/70">
              Watch short videos and shop instantly
            </p>
          </div>
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary-foreground/10" />
          <div className="absolute -bottom-4 -right-4 h-24 w-24 rounded-full bg-primary-foreground/5" />
        </Link>

        {/* Featured Products */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Featured Products</h2>
            <Link
              to="/products"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              See all
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        {/* Shop by Category */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Shop by Category</h2>
          <Link
            to="/products"
            className="block rounded-2xl bg-muted p-6 transition-transform active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-background p-3">
                <ShoppingBag className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold">All Categories</h3>
                <p className="text-sm text-muted-foreground">
                  Browse our full collection
                </p>
              </div>
            </div>
          </Link>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
