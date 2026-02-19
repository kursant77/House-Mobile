/**
 * AI Comparison Table — Side-by-side product comparison in chat
 */

import { motion } from "framer-motion";
import { Trophy, ArrowRight } from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { AiComparisonTable as AiComparisonTableType } from "@/services/api/aiChat";

interface Props {
    comparison: AiComparisonTableType;
}

export const AiComparisonTable = ({ comparison }: Props) => {
    const { products, rows, final_recommendation, reasoning } = comparison;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full rounded-xl border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden shadow-sm"
        >
            {/* Header */}
            <div className="px-3 py-2.5 bg-primary/5 border-b border-border/30">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    Solishtirish
                </h4>
            </div>

            {/* Table */}
            <ScrollArea className="w-full">
                <div className="min-w-[300px]">
                    {/* Product Names Header */}
                    <div className="grid border-b border-border/30" style={{ gridTemplateColumns: `120px repeat(${products.length}, 1fr)` }}>
                        <div className="px-3 py-2 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                            Xususiyat
                        </div>
                        {products.map((name, i) => (
                            <div
                                key={i}
                                className="px-3 py-2 text-xs font-semibold text-center border-l border-border/20"
                            >
                                {name}
                            </div>
                        ))}
                    </div>

                    {/* Comparison Rows */}
                    {rows.map((row, i) => (
                        <div
                            key={i}
                            className="grid border-b border-border/20 last:border-0"
                            style={{ gridTemplateColumns: `120px repeat(${products.length}, 1fr)` }}
                        >
                            <div className="px-3 py-2 text-[11px] font-medium text-muted-foreground bg-muted/20">
                                {row.category}
                            </div>
                            {products.map((name, j) => {
                                const isWinner = row.winner === name;
                                const value = row.values[name] || "—";
                                return (
                                    <div
                                        key={j}
                                        className={`px-3 py-2 text-[11px] text-center border-l border-border/20 ${isWinner
                                                ? "bg-green-500/10 text-green-700 dark:text-green-400 font-semibold"
                                                : ""
                                            }`}
                                    >
                                        {isWinner && "🏆 "}{value}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>

            {/* Final Recommendation */}
            {final_recommendation && (
                <div className="px-3 py-2.5 bg-primary/5 border-t border-border/30">
                    <div className="flex items-start gap-2">
                        <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-xs font-semibold text-primary">{final_recommendation}</p>
                            {reasoning && (
                                <p className="text-[11px] text-muted-foreground mt-0.5">{reasoning}</p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
    );
};
