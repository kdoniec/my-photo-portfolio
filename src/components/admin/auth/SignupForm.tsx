import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signupSchema, type SignupFormData } from "@/lib/schemas/signup.schema";
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
import { AlertCircle, CheckCircle2 } from "lucide-react";

// Error message mapping - Supabase errors to Polish user-friendly messages
const ERROR_MAP: Record<string, string> = {
  "User already registered": "Ten adres email jest już zarejestrowany",
  "Password should be at least 6 characters": "Hasło musi mieć minimum 6 znaków",
  "Unable to validate email address: invalid format": "Nieprawidłowy format email",
  "Signup requires a valid password": "Hasło jest wymagane",
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

  return "Wystąpił błąd podczas rejestracji";
}

export function SignupForm() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
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

  const onSubmit = async (data: SignupFormData) => {
    // Check if blocked before attempting signup
    if (isBlocked()) {
      setBlockTimeRemaining(getBlockTimeRemaining());
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/signup", {
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

      // Success - reset rate limiting and show confirmation message
      resetRateLimit();
      setIsSuccess(true);
    } catch (err) {
      recordFailedAttempt();
      setError(err instanceof Error ? mapErrorMessage(err.message) : "Wystąpił nieoczekiwany błąd");
    } finally {
      setIsLoading(false);
    }
  };

  const isFormDisabled = isLoading || blockTimeRemaining > 0 || isSuccess;

  if (isSuccess) {
    return (
      <div className="space-y-4">
        <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <p className="font-medium">Rejestracja przebiegła pomyślnie!</p>
            <p className="mt-2">
              Na podany adres email został wysłany link aktywacyjny. Kliknij w niego, aby potwierdzić konto i móc się
              zalogować.
            </p>
          </AlertDescription>
        </Alert>
        <div className="text-center">
          <a
            href="/admin/login"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            Przejdź do logowania
          </a>
        </div>
      </div>
    );
  }

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
          autoComplete="new-password"
          aria-invalid={!!errors.password}
          disabled={isFormDisabled}
          {...register("password")}
        />
        {errors.password && (
          <p className="text-sm text-destructive" role="alert">
            {errors.password.message}
          </p>
        )}
        <p className="text-xs text-muted-foreground">Minimum 8 znaków, wielka i mała litera oraz cyfra</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Potwierdź hasło</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          aria-invalid={!!errors.confirmPassword}
          disabled={isFormDisabled}
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive" role="alert">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isFormDisabled}>
        {isLoading ? "Rejestracja..." : blockTimeRemaining > 0 ? "Zablokowano" : "Zarejestruj"}
      </Button>
    </form>
  );
}
