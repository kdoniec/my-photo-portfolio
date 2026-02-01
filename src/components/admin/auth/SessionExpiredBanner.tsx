import { Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SessionExpiredBannerProps {
  show: boolean;
}

export function SessionExpiredBanner({ show }: SessionExpiredBannerProps) {
  if (!show) {
    return null;
  }

  return (
    <Alert className="border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
      <Clock className="size-4" />
      <AlertDescription>Twoja sesja wygasła. Zaloguj się ponownie, aby kontynuować.</AlertDescription>
    </Alert>
  );
}
