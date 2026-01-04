import { Button } from "@/components/ui/button";
import { Copy, Link2, MessageCircle, Send, Smartphone, Twitter } from "lucide-react";
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
        { icon: <Send className="h-6 w-6" />, label: "Telegram", color: "bg-blue-500 text-white" },
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
        <div className={cn("p-4 space-y-6 bg-zinc-950 text-white h-full overflow-y-auto", className)}>
            {header}

            {/* Recent Contacts */}
            <div className="space-y-3">
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Recent Contacts</h4>
                <div className="flex gap-4 overflow-x-auto scrollbar-none pb-2">
                    {recentContacts.map((contact, i) => (
                        <div key={i} className="flex flex-col items-center gap-2 shrink-0 cursor-pointer group">
                            <div className="h-14 w-14 rounded-full bg-zinc-800 flex items-center justify-center text-lg font-bold group-hover:bg-zinc-700 transition-colors">
                                {contact.avatar}
                            </div>
                            <span className="text-xs text-zinc-300">{contact.name}</span>
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
                        <span className="text-xs text-zinc-300 font-medium">{opt.label}</span>
                    </button>
                ))}
            </div>

            {onClose && (
                <Button variant="outline" onClick={onClose} className="w-full rounded-xl bg-zinc-900 border-zinc-800 text-white hover:bg-zinc-800 hover:text-white mt-4">
                    Cancel
                </Button>
            )}
        </div>
    );
}
