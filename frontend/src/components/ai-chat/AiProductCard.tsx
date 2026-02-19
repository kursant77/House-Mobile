/**
 * AI Product Card — Product recommendation card embedded in chat
 */

import { motion } from "framer-motion";
import { Star, Zap, Camera, DollarSign, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AiProductCard as AiProductCardType } from "@/services/api/aiChat";

interface Props {
    product: AiProductCardType;
    index?: number;
}

const formatPrice = (price: number, currency: string) => {
    if (currency === "UZS") {
        return new Intl.NumberFormat("uz-UZ").format(price) + " so'm";
    }
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
    }).format(price);
};

const ScoreBar = ({
    label,
    score,
    icon: Icon,
    color,
}: {
    label: string;
    score: number;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
}) => (
    <div className="flex items-center gap-2">
        <Icon className={`w-3.5 h-3.5 ${color}`} />
        <span className="text-[11px] text-muted-foreground w-14 truncate">{label}</span>
        <div className="flex-1 h-1.5 bg-muted/50 rounded-full overflow-hidden">
            <motion.div
                className={`h-full rounded-full ${color.replace("text-", "bg-")}`}
                initial={{ width: 0 }}
                animate={{ width: `${(score / 10) * 100}%` }}
                transition={{ duration: 0.8, delay: 0.2 }}
            />
        </div>
        <span className="text-[11px] font-medium w-6 text-right">{score.toFixed(1)}</span>
    </div>
);

export const AiProductCard = ({ product, index = 0 }: Props) => {
    const specs = product.specs || {};

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            className="min-w-[240px] max-w-[260px] rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden shadow-sm hover:shadow-md transition-shadow"
        >
            {/* Product Image */}
            {product.image_url && (
                <div className="h-32 bg-muted/30 flex items-center justify-center p-3">
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="h-full w-auto object-contain"
                        loading="lazy"
                    />
                </div>
            )}

            <div className="p-3 space-y-2.5">
                {/* Brand & Name */}
                <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                        {product.brand}
                    </p>
                    <h4 className="text-sm font-semibold leading-tight line-clamp-2">
                        {product.name}
                    </h4>
                </div>

                {/* Price */}
                <p className="text-base font-bold text-primary">
                    {formatPrice(product.price, product.currency)}
                </p>

                {/* Score Bars */}
                {product.overall_score > 0 && (
                    <div className="space-y-1.5">
                        <ScoreBar label="Gaming" score={Number(specs.gaming_score) || product.overall_score * 0.9} icon={Zap} color="text-orange-500" />
                        <ScoreBar label="Camera" score={Number(specs.camera_score) || product.overall_score * 0.85} icon={Camera} color="text-blue-500" />
                        <ScoreBar label="Value" score={Number(specs.value_score) || product.overall_score} icon={DollarSign} color="text-green-500" />
                    </div>
                )}

                {/* Best For */}
                {product.best_for && (
                    <div className="flex items-center gap-1.5">
                        <Star className="w-3 h-3 text-amber-500" />
                        <span className="text-[11px] text-muted-foreground">{product.best_for}</span>
                    </div>
                )}

                {/* Strengths */}
                {product.strengths.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {product.strengths.slice(0, 3).map((s, i) => (
                            <Badge
                                key={i}
                                variant="secondary"
                                className="text-[10px] px-1.5 py-0 bg-green-500/10 text-green-700 dark:text-green-400 border-0"
                            >
                                ✓ {s}
                            </Badge>
                        ))}
                    </div>
                )}

                {/* View Link */}
                <button
                    className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 pt-1 transition-colors"
                    onClick={() => {
                        // Navigate to product detail (opens in same window context)
                        window.open(`/products`, "_self");
                    }}
                >
                    <ExternalLink className="w-3 h-3" />
                    Batafsil ko'rish
                </button>
            </div>
        </motion.div>
    );
};
