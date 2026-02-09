import { Home, ShoppingBag, Film, User, PlusSquare } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  { icon: ShoppingBag, label: "Mahsulotlar", path: "/products", showBadge: true },
  { icon: PlusSquare, label: "Qo'shish", path: "/upload" },
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
  const location = useLocation();

  // Desktopda ko'rinmasin (Sidebar bor)
  if (!isMobile) {
    return null;
  }

  return (
    <nav
      data-bottom-nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-[110] pb-safe pt-2 px-4",
        "flex items-center justify-around",
        "h-[80px] transition-all duration-300",
        isReelsPage
          ? "bg-black/80 text-white border-t border-white/10 backdrop-blur-xl"
          : "bg-white/80 dark:bg-black/80 text-foreground border-t border-zinc-200 dark:border-zinc-800 backdrop-blur-xl shadow-[0_-5px_20px_rgba(0,0,0,0.03)]"
      )}
      aria-label="Asosiy navigatsiya"
      role="navigation"
    >
      {navItems.map((item) => {
        const isActive = location.pathname === item.path;

        return (
          <NavLink
            key={item.path}
            to={item.path}
            aria-label={item.label}
            className="relative flex-1 flex flex-col items-center justify-center gap-1 group"
          >
            {({ isActive }) => (
              <div className="relative flex flex-col items-center justify-center w-full h-full">
                {/* Active Indicator (Glow/Pill) */}
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-indicator"
                    className={cn(
                      "absolute -top-3 w-12 h-1 rounded-full",
                      isReelsPage ? "bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]" : "bg-primary shadow-[0_0_10px_rgba(0,0,0,0.1)]"
                    )}
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}

                {/* Icon with Spring Animation */}
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    y: isActive ? -2 : 0
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="relative p-2 rounded-xl"
                >
                  <item.icon
                    className={cn(
                      "h-6 w-6 transition-all duration-300",
                      isActive
                        ? (isReelsPage ? "text-white stroke-[2.5px]" : "text-primary stroke-[2.5px]")
                        : (isReelsPage ? "text-white/50" : "text-zinc-500 components-neutral-400"),
                      item.path === "/upload" && (isActive ? "text-primary" : "text-primary/70")
                    )}
                  />

                  {/* Notification Badge */}
                  <AnimatePresence>
                    {item.showBadge && cartCount > 0 && (
                      <motion.span
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className={cn(
                          "absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full text-[10px] font-bold border-2",
                          "bg-red-500 text-white",
                          isReelsPage ? "border-black" : "border-white dark:border-black"
                        )}
                      >
                        {cartCount > 99 ? "99+" : cartCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Label */}
                <span className={cn(
                  "text-[10px] font-medium transition-all duration-300",
                  isActive
                    ? (isReelsPage ? "text-white opacity-100" : "text-primary opacity-100")
                    : (isReelsPage ? "text-white/50" : "text-zinc-500")
                )}>
                  {item.label}
                </span>
              </div>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
}
