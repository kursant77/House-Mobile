import { Home, Search, Heart, ShoppingBag, Film, User, PlusSquare, Repeat } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { useIsMobile } from "@/hooks/use-mobile";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  showBadge?: boolean;
}

const navItems: NavItem[] = [
  { icon: Home, label: "Asosiy", path: "/" },
  { icon: ShoppingBag, label: "Mahsulotlar", path: "/products" },
  { icon: PlusSquare, label: "E'lon", path: "/upload" },
  { icon: Film, label: "Reels", path: "/reels" },
  { icon: User, label: "Profil", path: "/profile" },
];

interface BottomNavProps {
  isReelsPage?: boolean;
}

export function BottomNav({ isReelsPage = false }: BottomNavProps) {
  const { getItemCount } = useCartStore();
  const cartCount = getItemCount();
  const isMobile = useIsMobile();

  // Desktopda ko'rinmasin (Sidebar bor)
  if (!isMobile) {
    return null;
  }

  // Mobile uchun pastda navbar (Uzum Market style)
  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[110] pb-safe pt-2",
        "flex items-center justify-around",
        "h-auto border-t backdrop-blur-lg transition-colors duration-300",
        isReelsPage
          ? "bg-black/60 border-white/10 text-white"
          : "bg-background/95 border-border text-foreground"
      )}
    >
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            cn(
              "relative flex flex-col items-center justify-center gap-1 px-2 py-1 flex-1",
              "transition-colors duration-200",
              isActive
                ? (isReelsPage ? "text-white" : "text-primary")
                : (isReelsPage ? "text-white/40 hover:text-white" : "text-muted-foreground hover:text-foreground")
            )
          }
        >
          {({ isActive }) => (
            <>
              <div className="relative">
                <item.icon
                  className={cn(
                    "h-6 w-6 mb-0.5",
                    isActive && "fill-current"
                  )}
                  strokeWidth={2}
                />
                {item.showBadge && cartCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white border-2 border-background">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
