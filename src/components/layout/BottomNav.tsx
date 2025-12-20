import { Home, Search, Play, Heart, ShoppingBag } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";

interface NavItem {
  icon: React.ElementType;
  label: string;
  path: string;
  showBadge?: boolean;
}

const navItems: NavItem[] = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Search, label: "Products", path: "/products" },
  { icon: Play, label: "Reels", path: "/reels" },
  { icon: Heart, label: "Favorites", path: "/favorites" },
  { icon: ShoppingBag, label: "Cart", path: "/cart", showBadge: true },
];

interface BottomNavProps {
  isReelsPage?: boolean;
}

export function BottomNav({ isReelsPage = false }: BottomNavProps) {
  const { getItemCount } = useCartStore();
  const cartCount = getItemCount();

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 pb-safe",
        "flex items-center justify-around",
        "h-16 border-t",
        "backdrop-blur-xl transition-colors duration-300",
        isReelsPage
          ? "bg-reels/80 border-reels-foreground/10"
          : "bg-nav/80 border-border"
      )}
    >
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) =>
            cn(
              "relative flex flex-col items-center justify-center gap-0.5 px-3 py-2",
              "transition-all duration-200 ease-out",
              "active:scale-95",
              isActive
                ? isReelsPage
                  ? "text-reels-foreground"
                  : "text-nav-active"
                : isReelsPage
                ? "text-reels-foreground/50"
                : "text-nav-foreground"
            )
          }
        >
          {({ isActive }) => (
            <>
              <div className="relative">
                <item.icon
                  className={cn(
                    "h-6 w-6 transition-transform duration-200",
                    isActive && "scale-110"
                  )}
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
                {item.showBadge && cartCount > 0 && (
                  <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
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
