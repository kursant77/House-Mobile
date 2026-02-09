import { Button } from "@/components/ui/button";
import { Copy, Link2, MessageCircle, Send as SendIcon, Smartphone, Twitter } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function ShareList({
    className,
    header,
    onClose,
    onShare
}: {
    className?: string;
    header?: React.ReactNode;
    onClose?: () => void;
    onShare?: () => void;
}) {

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard");
        if (onShare) onShare();
    };

    const shareOptions = [
        { icon: <SendIcon className="h-6 w-6" />, label: "Telegram", color: "bg-blue-500 text-white" },
        { icon: <MessageCircle className="h-6 w-6" />, label: "WhatsApp", color: "bg-green-500 text-white" },
        { icon: <Smartphone className="h-6 w-6" />, label: "SMS", color: "bg-green-600 text-white" },
        { icon: <Twitter className="h-6 w-6" />, label: "Twitter", color: "bg-black text-white" },
        { icon: <Copy className="h-6 w-6" />, label: "Copy Link", color: "bg-zinc-800 text-white", action: handleCopyLink },
        { icon: <Link2 className="h-6 w-6" />, label: "Other", color: "bg-zinc-800 text-white" },
    ];

    const recentContacts = [
        { name: "John Doe", avatar: "JD" },
        { name: "Alice", avatar: "A" },
        { name: "Mom", avatar: "M" },
        { name: "Boss", avatar: "B" },
    ];

    return (
        <div className={cn("p-4 space-y-6 bg-background text-foreground h-full overflow-y-auto transition-colors duration-300", className)}>
            {header}

            {/* Recent Contacts */}
            <div className="space-y-3">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Contacts</h4>
                <div className="flex gap-4 overflow-x-auto scrollbar-none pb-2">
                    {recentContacts.map((contact, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 shrink-0 cursor-pointer group">
                            <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center text-lg font-bold group-hover:bg-muted/80 transition-colors">
                                {contact.avatar}
                            </div>
                            <span className="text-xs text-muted-foreground">{contact.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Share Grid */}
            <div className="grid grid-cols-4 gap-4">
                {shareOptions.map((opt, i) => (
                    <button
                        key={i}
                        onClick={opt.action ? opt.action : () => { toast.success(`Shared to ${opt.label}`); if (onShare) onShare(); }}
                        className="flex flex-col items-center gap-2 group"
                    >
                        <div className={`h-14 w-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 group-hover:scale-105 ${opt.color}`}>
                            {opt.icon}
                        </div>
                        <span className="text-xs text-muted-foreground font-medium">{opt.label}</span>
                    </button>
                ))}
            </div>

            {onClose && (
                <Button variant="outline" onClick={onClose} className="w-full rounded-xl bg-muted border-border text-foreground hover:bg-muted/80 mt-4">
                    Cancel
                </Button>
            )}
        </div>
    );
}
