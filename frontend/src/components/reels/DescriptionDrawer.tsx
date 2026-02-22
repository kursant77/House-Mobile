import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerDescription,
} from "@/components/ui/drawer";
import {
    Sheet,
    SheetContent,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { BioDisplay } from "@/components/shared/BioDisplay";

interface DescriptionDrawerProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
}

export function DescriptionDrawer({ isOpen, onOpenChange, title, description }: DescriptionDrawerProps) {
    const isMobile = useIsMobile();

    if (isMobile) {
        return (
            <Drawer open={isOpen} onOpenChange={onOpenChange} modal={true}>
                <DrawerContent className="bg-background border-border text-foreground max-h-[85vh] flex flex-col focus:outline-none z-[150]">
                    <div className="mx-auto w-full max-w-sm flex-1 flex flex-col h-full">
                        <DrawerHeader className="border-b border-border relative shrink-0 px-4 pb-3">
                            <DrawerTitle className="text-center font-bold text-sm text-foreground line-clamp-1">
                                {title}
                            </DrawerTitle>
                            <DrawerDescription className="sr-only">Product description</DrawerDescription>
                            <DrawerClose asChild>
                                <button className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-foreground">
                                    <X className="h-4 w-4" />
                                </button>
                            </DrawerClose>
                        </DrawerHeader>
                        <div className="flex-1 overflow-y-auto p-4">
                            <BioDisplay bio={description} maxLines={1000} className="text-sm leading-relaxed" />
                        </div>
                    </div>
                </DrawerContent>
            </Drawer>
        );
    }

    // Desktop: Right Side Sheet
    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="bg-background border-l border-border text-foreground w-[400px] p-0 gap-0 focus:outline-none flex flex-col">
                <div className="flex flex-col p-4 border-b border-border">
                    <SheetTitle className="font-bold text-sm text-foreground mb-1">Ta'rif</SheetTitle>
                    <p className="text-xs text-muted-foreground line-clamp-1">{title}</p>
                    <SheetDescription className="sr-only">Product description</SheetDescription>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                    <BioDisplay bio={description} maxLines={1000} className="text-sm leading-relaxed" />
                </div>
            </SheetContent>
        </Sheet>
    );
}
