import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
} from "@/components/ui/drawer";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
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
                <DrawerContent className="bg-background border-border text-foreground focus:outline-none focus-visible:outline-none">
                    <div className="mx-auto w-full max-w-sm">
                        <DrawerHeader className="border-b border-border mb-4">
                            <DrawerTitle className="text-center font-bold text-lg text-foreground">Share to</DrawerTitle>
                            <DrawerDescription className="sr-only">Ushbu mahsulotni ulashish imkoniyatlari</DrawerDescription>
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
            <SheetContent side="right" className="bg-background border-l border-border text-foreground w-[400px] p-0 gap-0 focus:outline-none">
                <SheetHeader className="p-4 border-b border-border text-left">
                    <SheetTitle className="font-bold text-lg text-foreground">Share to</SheetTitle>
                    <SheetDescription className="sr-only">Ushbu mahsulotni ulashish imkoniyatlari</SheetDescription>
                </SheetHeader>
                <ShareList onShare={() => onOpenChange(false)} className="bg-transparent" />
            </SheetContent>
        </Sheet>
    );
}
