import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, AlertCircle } from "lucide-react";
import { setPasswordSchema, type SetPasswordFormData } from "@/lib/schemas/reset-password.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function SetPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SetPasswordFormData>({
    resolver: zodResolver(setPasswordSchema),
  });

  // Extract access token from URL hash on mount
  useEffect(() => {
    const extractTokenFromHash = () => {
      try {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const token = params.get("access_token");
        const type = params.get("type");

        if (token && type === "recovery") {
          setAccessToken(token);
          // Clear the hash from URL for security
          window.history.replaceState(null, "", window.location.pathname);
        } else {
          setTokenError("Link resetujący wygasł lub jest nieprawidłowy. Wygeneruj nowy link.");
        }
      } catch {
        setTokenError("Wystąpił błąd podczas weryfikacji linku.");
      } finally {
        setIsValidating(false);
      }
    };

    extractTokenFromHash();
  }, []);

  const onSubmit = async (data: SetPasswordFormData) => {
    if (!accessToken) {
      setError("Brak tokenu autoryzacji. Wygeneruj nowy link resetujący.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: data.password,
          accessToken,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Wystąpił nieoczekiwany błąd");
        return;
      }

      // Redirect to login with success message
      window.location.href = "/admin/login?password_reset=true";
    } catch {
      setError("Wystąpił nieoczekiwany błąd");
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while validating
  if (isValidating) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-muted-foreground">Weryfikacja linku...</div>
      </div>
    );
  }

  // Show error if token is invalid
  if (tokenError) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{tokenError}</AlertDescription>
        </Alert>

        <div className="text-center">
          <a
            href="/admin/reset-password"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Wygeneruj nowy link
          </a>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {error && (
        <Alert variant="destructive" role="alert">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="password">Nowe hasło</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="Minimum 8 znaków"
            className="pl-10"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
          />
        </div>
        {errors.password && (
          <p id="password-error" className="text-sm text-destructive" role="alert">
            {errors.password.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Potwierdź hasło</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Powtórz hasło"
            className="pl-10"
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
            {...register("confirmPassword")}
          />
        </div>
        {errors.confirmPassword && (
          <p id="confirmPassword-error" className="text-sm text-destructive" role="alert">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Ustawianie hasła..." : "Ustaw nowe hasło"}
      </Button>
    </form>
  );
}
