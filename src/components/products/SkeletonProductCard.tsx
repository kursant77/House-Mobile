import { Skeleton } from "@/components/ui/skeleton";

export function SkeletonProductCard() {
    return (
        <div className="flex flex-col gap-3">
            <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
            <div className="space-y-2 px-0.5">
                <Skeleton className="h-4 w-3/4 rounded-md" />
                <Skeleton className="h-3 w-1/4 rounded-md" />
                <Skeleton className="h-5 w-1/3 rounded-md" />
            </div>
        </div>
    );
}
