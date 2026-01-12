import { useState } from "react";
import { ProductCard } from "@/components/products/ProductCard";
import { PostCard } from "@/components/social/PostCard";
import { useFavoritesStore } from "@/store/favoritesStore";
import { Heart, PlaySquare, ShoppingBag, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { postService } from "@/services/api/posts";
import { useQuery } from "@tanstack/react-query";

export default function Favorites() {
  const { favorites } = useFavoritesStore();
  const [activeTab, setActiveTab] = useState("products");

  const { data: savedPosts = [], isLoading: postsLoading } = useQuery({
    queryKey: ["saved-posts"],
    queryFn: () => postService.getSavedPosts(),
    enabled: activeTab === "posts",
  });

  return (
    <div className="w-full h-full animate-fade-in">
      <div className="max-w-[1600px] mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">Sevimlilar</h1>
            <p className="text-muted-foreground mt-2 font-medium">
              Sizga yoqqan va saqlangan barcha narsalar bir joyda.
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full md:w-auto">
            <TabsList className="grid grid-cols-2 w-full md:w-[400px] h-12 p-1.5 bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl border border-border/50">
              <TabsTrigger
                value="products"
                className="rounded-xl gap-2.5 font-bold text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:shadow-md transition-all"
              >
                <ShoppingBag className="h-4.5 w-4.5" />
                <span>Mahsulotlar</span>
                {favorites.length > 0 && (
                  <span className="ml-1 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md">
                    {favorites.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="posts"
                className="rounded-xl gap-2.5 font-bold text-sm data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-700 data-[state=active]:shadow-md transition-all"
              >
                <PlaySquare className="h-4.5 w-4.5" />
                <span>Yangiliklar</span>
                {!postsLoading && savedPosts.length > 0 && (
                  <span className="ml-1 text-[10px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded-md">
                    {savedPosts.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <main className="min-h-[400px]">
          {activeTab === "products" ? (
            favorites.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-6 gap-5 md:gap-7">
                {favorites.map((product, index) => (
                  <div key={product.id} className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Heart}
                title="Yoqtirilgan mahsulotlar hozircha yo'q"
                description="Sizga yoqqan mahsulotlarni yurakcha belgisini bosish orqali shu yerga saqlab qo'yishingiz mumkin."
                link="/products"
                cta="Mahsulotlarni ko'rish"
              />
            )
          ) : (
            postsLoading ? (
              <div className="flex flex-col items-center justify-center py-32 space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary opacity-50" />
                <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground animate-pulse">Yuklanmoqda...</p>
              </div>
            ) : savedPosts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-y-12 gap-x-8">
                {savedPosts.map((post, index) => (
                  <div key={post.id} className="animate-fade-in" style={{ animationDelay: `${index * 80}ms` }}>
                    <PostCard post={post} />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={PlaySquare}
                title="Saqlangan yangiliklar yo'q"
                description="Sizga yoqqan videolarni 'Saqlash' tugmasini bosish orqali shu yerga qo'shishingiz mumkin."
                link="/"
                cta="Videolarni ko'rish"
              />
            )
          )}
        </main>
      </div>
    </div>
  );
}

interface EmptyStateProps {
  icon: any;
  title: string;
  description: string;
  link: string;
  cta: string;
}

function EmptyState({ icon: Icon, title, description, link, cta }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center bg-zinc-50/50 dark:bg-zinc-900/40 rounded-[2.5rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800 transition-colors">
      <div className="h-24 w-24 rounded-full bg-primary/5 flex items-center justify-center mb-8 ring-8 ring-primary/[0.02]">
        <Icon className="h-12 w-12 text-primary" />
      </div>
      <h2 className="text-2xl font-black mb-4 uppercase tracking-tighter">{title}</h2>
      <p className="text-muted-foreground max-w-sm mx-auto mb-10 text-base font-medium leading-relaxed px-6">
        {description}
      </p>
      <Link to={link}>
        <Button className="rounded-full px-10 h-14 font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all">
          {cta}
        </Button>
      </Link>
    </div>
  );
}
