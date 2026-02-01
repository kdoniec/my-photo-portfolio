import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormData } from "@/lib/schemas/login.schema";
import {
  isBlocked,
  getBlockTimeRemaining,
  recordFailedAttempt,
  resetRateLimit,
  formatTimeRemaining,
} from "@/lib/utils/rate-limit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

// Error message mapping - Supabase errors to Polish user-friendly messages
const ERROR_MAP: Record<string, string> = {
  "Invalid login credentials": "Nieprawidłowy email lub hasło",
  "Email not confirmed": "Konto nie zostało potwierdzone",
  "User not found": "Nieprawidłowy email lub hasło",
  invalid_grant: "Nieprawidłowy email lub hasło",
};

function mapErrorMessage(message: string): string {
  if (ERROR_MAP[message]) {
    return ERROR_MAP[message];
  }

  for (const [key, value] of Object.entries(ERROR_MAP)) {
    if (message.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  return "Nieprawidłowy email lub hasło";
}

interface DirectLoginFormProps {
  returnTo?: string;
  showExpiredMessage?: boolean;
}

export function DirectLoginForm({ returnTo }: DirectLoginFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  // Check and update rate limit status
  const updateBlockStatus = useCallback(() => {
    if (isBlocked()) {
      setBlockTimeRemaining(getBlockTimeRemaining());
    } else {
      setBlockTimeRemaining(0);
    }
  }, []);

  // Check initial block state and start countdown if blocked
  useEffect(() => {
    updateBlockStatus();

    if (!isBlocked()) {
      return;
    }

    const interval = setInterval(() => {
      const remaining = getBlockTimeRemaining();
      setBlockTimeRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [updateBlockStatus]);

  const onSubmit = async (data: LoginFormData) => {
    // Check if blocked before attempting login
    if (isBlocked()) {
      setBlockTimeRemaining(getBlockTimeRemaining());
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const state = recordFailedAttempt();
        if (state.blockedUntil) {
          setBlockTimeRemaining(getBlockTimeRemaining());
          const interval = setInterval(() => {
            const remaining = getBlockTimeRemaining();
            setBlockTimeRemaining(remaining);
            if (remaining <= 0) {
              clearInterval(interval);
            }
          }, 1000);
        }
        setError(mapErrorMessage(result.error || "Wystąpił błąd"));
        return;
      }

      // Success - reset rate limiting and redirect
      resetRateLimit();
      window.location.href = returnTo || "/admin/photos";
    } catch (err) {
      recordFailedAttempt();
      setError(err instanceof Error ? mapErrorMessage(err.message) : "Wystąpił nieoczekiwany błąd");
    } finally {
      setIsLoading(false);
    }
  };

  const isFormDisabled = isLoading || blockTimeRemaining > 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {blockTimeRemaining > 0 && (
        <Alert variant="destructive" role="alert">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Zbyt wiele nieudanych prób. Spróbuj ponownie za {formatTimeRemaining(blockTimeRemaining)}.
          </AlertDescription>
        </Alert>
      )}

      {error && blockTimeRemaining === 0 && (
        <Alert variant="destructive" role="alert">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={!!errors.email}
          disabled={isFormDisabled}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-destructive" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Hasło</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={!!errors.password}
          disabled={isFormDisabled}
          {...register("password")}
        />
        {errors.password && (
          <p className="text-sm text-destructive" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isFormDisabled}>
        {isLoading ? "Logowanie..." : blockTimeRemaining > 0 ? "Zablokowano" : "Zaloguj"}
      </Button>
    </form>
  );
}
