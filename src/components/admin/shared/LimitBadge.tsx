import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface LimitBadgeProps {
  current: number;
  limit: number;
  className?: string;
}

export function LimitBadge({ current, limit, className }: LimitBadgeProps) {
  const percentage = (current / limit) * 100;

  const getVariant = (): "default" | "secondary" | "destructive" => {
    if (percentage >= 90) {
      return "destructive";
    }
    if (percentage >= 70) {
      return "secondary";
    }
    return "default";
  };

  const getColorClass = (): string => {
    if (percentage >= 90) {
      return "bg-destructive text-destructive-foreground";
    }
    if (percentage >= 70) {
      return "bg-yellow-500 text-white dark:bg-yellow-600";
    }
    return "bg-green-600 text-white dark:bg-green-700";
  };

  return (
    <Badge variant={getVariant()} className={cn(getColorClass(), className)}>
      {current}/{limit}
    </Badge>
  );
}
