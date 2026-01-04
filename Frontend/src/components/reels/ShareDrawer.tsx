import {
    Drawer,
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
import { ShareList } from "./ShareList";
import { useIsMobile } from "@/hooks/use-mobile";

interface ShareDrawerProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    productTitle?: string;
}

export function ShareDrawer({ isOpen, onOpenChange, productTitle = "Amazing Product" }: ShareDrawerProps) {
    const isMobile = useIsMobile();

    if (isMobile) {
        return (
            <Drawer open={isOpen} onOpenChange={onOpenChange}>
                <DrawerContent className="bg-zinc-950 border-white/10 text-white focus:outline-none focus-visible:outline-none">
                    <div className="mx-auto w-full max-w-sm">
                        <DrawerHeader className="border-b border-white/10 mb-4">
                            <DrawerTitle className="text-center font-bold text-lg">Share to</DrawerTitle>
                        </DrawerHeader>
                        <ShareList onClose={() => onOpenChange(false)} onShare={() => onOpenChange(false)} className="bg-transparent p-0" />
                    </div>
                </DrawerContent>
            </Drawer>
        );
    }

    // Desktop: Right Side Sheet
    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="bg-zinc-950 border-l border-white/10 text-white w-[400px] p-0 gap-0 focus:outline-none">
                <SheetHeader className="p-4 border-b border-white/10 text-left">
                    <SheetTitle className="font-bold text-lg text-white">Share to</SheetTitle>
                </SheetHeader>
                <ShareList onShare={() => onOpenChange(false)} className="bg-transparent" />
            </SheetContent>
        </Sheet>
    );
}
