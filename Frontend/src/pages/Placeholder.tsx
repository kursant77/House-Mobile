import { BottomNav } from "@/components/layout/BottomNav";
import { useLocation } from "react-router-dom";

export default function Placeholder() {
  const location = useLocation();
  const pageName = location.pathname.slice(1) || "home";

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
        <div className="text-center">
          <h1 className="mb-2 text-2xl font-bold capitalize text-foreground">
            {pageName}
          </h1>
          <p className="text-muted-foreground">Coming soon...</p>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}
