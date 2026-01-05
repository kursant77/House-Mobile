import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: string;
        positive: boolean;
    };
    description?: string;
    color?: "primary" | "blue" | "green" | "purple" | "orange";
}

const colorMap = {
    primary: "bg-primary/10 text-primary border-primary/20 shadow-primary/5",
    blue: "bg-blue-500/10 text-blue-500 border-blue-500/20 shadow-blue-500/5",
    green: "bg-green-500/10 text-green-500 border-green-500/20 shadow-green-500/5",
    purple: "bg-purple-500/10 text-purple-500 border-purple-500/20 shadow-purple-500/5",
    orange: "bg-orange-500/10 text-orange-500 border-orange-500/20 shadow-orange-500/5",
};

export const StatsCard = ({ title, value, icon: Icon, trend, description, color = "primary" }: StatsCardProps) => {
    return (
        <div className="bg-zinc-950/40 border border-zinc-900 p-6 rounded-2xl hover:border-zinc-800 transition-all hover:bg-zinc-900/40 group shadow-lg">
            <div className="flex items-start justify-between mb-4">
                <div className={cn("p-3 rounded-xl border transition-transform group-hover:scale-110 duration-300 shadow-xl", colorMap[color])}>
                    <Icon className="h-6 w-6" />
                </div>
                {trend && (
                    <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                        trend.positive
                            ? "bg-green-500/10 text-green-500 border-green-500/20"
                            : "bg-red-500/10 text-red-500 border-red-500/20"
                    )}>
                        {trend.positive ? "+" : "-"}{trend.value}
                    </span>
                )}
            </div>

            <div className="space-y-1">
                <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-widest">{title}</h3>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-white tracking-tighter">{value}</span>
                </div>
                {description && <p className="text-[10px] text-zinc-600 font-medium">{description}</p>}
            </div>
        </div>
    );
};
