import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
} from "@/components/ui/drawer";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { X } from "lucide-react";
import { CommentsList } from "./CommentsList";
import { useIsMobile } from "@/hooks/use-mobile";

interface CommentsDrawerProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    productId: string;
}

export function CommentsDrawer({ isOpen, onOpenChange, productId }: CommentsDrawerProps) {
    const isMobile = useIsMobile();

    if (isMobile) {
        return (
            <Drawer open={isOpen} onOpenChange={onOpenChange} modal={true}>
                <DrawerContent className="bg-zinc-950 border-white/10 text-white max-h-[85vh] flex flex-col focus:outline-none z-[100]">
                    <div className="mx-auto w-full max-w-sm flex-1 flex flex-col h-full">
                        <DrawerHeader className="border-b border-white/10 relative shrink-0 px-4 pb-3">
                            <DrawerTitle className="text-center font-bold text-sm">Comments</DrawerTitle>
                            <DrawerClose asChild>
                                <button className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-zinc-400 hover:text-white">
                                    <X className="h-4 w-4" />
                                </button>
                            </DrawerClose>
                        </DrawerHeader>
                        <CommentsList className="bg-transparent flex-1" productId={productId} />
                    </div>
                </DrawerContent>
            </Drawer>
        );
    }

    // Desktop: Right Side Sheet
    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="bg-zinc-950 border-l border-white/10 text-white w-[400px] p-0 gap-0 focus:outline-none">
                <CommentsList
                    className="bg-transparent h-full"
                    productId={productId}
                    header={
                        <div className="flex items-center justify-between p-4 border-b border-white/10">
                            <SheetTitle className="font-bold text-sm text-white">Comments</SheetTitle>
                        </div>
                    }
                />
            </SheetContent>
        </Sheet>
    );
}
