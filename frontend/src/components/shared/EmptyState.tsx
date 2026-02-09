import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  link?: string;
  cta?: string;
  action?: () => void;
}

export function EmptyState({ icon: Icon, title, description, link, cta, action }: EmptyStateProps) {
  const content = (
    <div className="flex flex-col items-center justify-center py-32 text-center bg-zinc-50/50 dark:bg-zinc-900/40 rounded-[2.5rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800 transition-colors">
      <div className="h-24 w-24 rounded-full bg-primary/5 flex items-center justify-center mb-8 ring-8 ring-primary/[0.02]">
        <Icon className="h-12 w-12 text-primary" aria-hidden="true" />
      </div>
      <h2 className="text-2xl font-black mb-4 uppercase tracking-tighter">{title}</h2>
      <p className="text-muted-foreground max-w-sm mx-auto mb-10 text-base font-medium leading-relaxed px-6">
        {description}
      </p>
      {(cta && (link || action)) && (
        link ? (
          <Link to={link}>
            <Button className="rounded-full px-10 h-14 font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all">
              {cta}
            </Button>
          </Link>
        ) : (
          <Button 
            onClick={action}
            className="rounded-full px-10 h-14 font-black text-sm uppercase tracking-widest shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all"
          >
            {cta}
          </Button>
        )
      )}
    </div>
  );

  return content;
}
