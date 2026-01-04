import { useState } from "react";
import { BottomNav } from "@/components/layout/BottomNav";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Settings,
  Bell,
  Heart,
  ShoppingBag,
  Package,
  CreditCard,
  MapPin,
  LogOut,
  Edit,
  Camera,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { useFavoritesStore } from "@/store/favoritesStore";
import { useCartStore } from "@/store/cartStore";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CheckCircle2, ShieldCheck, Zap } from "lucide-react";

export default function Profile() {
  const isMobile = useIsMobile();
  const { user, logout, upgradeToProfessional } = useAuthStore();
  const { favorites } = useFavoritesStore();
  const { items } = useCartStore();
  const [isUpgrading, setIsUpgrading] = useState(false);

  const handleUpgrade = async () => {
    try {
      setIsUpgrading(true);
      await upgradeToProfessional();
      toast.success("Successfully upgraded to Professional account!");
    } catch (error) {
      toast.error("Upgrade failed. Please try again.");
    } finally {
      setIsUpgrading(false);
    }
  };

  const stats = [
    { label: "Favorites", value: favorites.length, icon: Heart, color: "text-red-500" },
    { label: "Cart Items", value: items.length, icon: ShoppingBag, color: "text-blue-500" },
    { label: "Orders", value: 0, icon: Package, color: "text-green-500" },
  ];

  const menuItems = [
    { icon: Settings, label: "Settings", path: "/settings" },
    { icon: Bell, label: "Notifications", path: "/notifications" },
    { icon: MapPin, label: "Addresses", path: "/addresses" },
    { icon: CreditCard, label: "Payment Methods", path: "/payments" },
    { icon: Package, label: "My Orders", path: "/orders" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0 md:pt-16">
      <BottomNav />

      <main className="px-4 py-6 space-y-6 md:container md:mx-auto md:max-w-4xl">
        {/* Profile Header */}
        <Card className="overflow-hidden border-2 animate-fade-in">
          <div className="relative h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-primary/60 p-1 shadow-lg">
                  <div className="h-full w-full rounded-full bg-background flex items-center justify-center">
                    <User className="h-12 w-12 text-primary" />
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="secondary"
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full border-2 border-background"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <CardContent className="pt-16 pb-6">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-2xl font-bold">
                  {user?.name || "Guest User"}
                </h2>
                {user?.isProfessional && (
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 gap-1">
                    <ShieldCheck className="h-3 w-3" />
                    Pro
                  </Badge>
                )}
                <Button size="icon" variant="ghost" className="h-6 w-6">
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-muted-foreground">{user?.email || "guest@example.com"}</p>

              <div className="flex flex-col items-center gap-3 pt-4">
                {user && !user.isProfessional && (
                  <Button
                    onClick={handleUpgrade}
                    disabled={isUpgrading}
                    variant="default"
                    className="bg-gradient-to-r from-primary to-primary/80 hover:shadow-lg transition-all gap-2"
                  >
                    <Zap className="h-4 w-4 fill-current" />
                    {isUpgrading ? "Upgrading..." : "Become Professional"}
                  </Button>
                )}
                {!user && (
                  <Link to="/auth">
                    <Button>Sign In</Button>
                  </Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {stats.map((stat, index) => (
            <Card
              key={stat.label}
              className="text-center animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="pt-6 pb-4">
                <stat.icon className={`h-6 w-6 mx-auto mb-2 ${stat.color}`} />
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Menu Items */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Manage your account settings</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {menuItems.map((item, index) => (
              <div key={item.path}>
                <Link to={item.path}>
                  <div className="flex items-center gap-4 px-6 py-4 hover:bg-accent transition-colors cursor-pointer">
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                    <span className="flex-1 font-medium">{item.label}</span>
                  </div>
                </Link>
                {index < menuItems.length - 1 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Logout */}
        {user && (
          <Card className="animate-fade-in border-destructive/20">
            <CardContent className="p-0">
              <button
                onClick={logout}
                className="flex items-center gap-4 px-6 py-4 w-full hover:bg-destructive/10 transition-colors text-destructive"
              >
                <LogOut className="h-5 w-5" />
                <span className="flex-1 font-medium text-left">Logout</span>
              </button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

