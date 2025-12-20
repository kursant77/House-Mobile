import { BottomNav } from "@/components/layout/BottomNav";
import { Play, User } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function Home() {
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
      <main className="px-4 py-6">
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

        {/* Coming soon sections */}
        <div className="mt-8 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Coming Soon</h3>
          
          <div className="grid grid-cols-2 gap-3">
            {["Products", "Categories", "Favorites", "Cart"].map((item) => (
              <div
                key={item}
                className="rounded-xl bg-muted p-4 text-center"
              >
                <span className="text-sm font-medium text-muted-foreground">
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
