import { ImageOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: {
    label: string;
    href: string;
  };
}

export default function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="rounded-full bg-muted p-6 mb-4">
        <ImageOff className="h-12 w-12 text-muted-foreground" aria-hidden="true" />
      </div>
      <h2 className="text-2xl font-semibold text-foreground mb-2">{title}</h2>
      {description && <p className="text-muted-foreground max-w-md mb-6">{description}</p>}
      {action && (
        <Button asChild>
          <a href={action.href}>{action.label}</a>
        </Button>
      )}
    </div>
  );
}
