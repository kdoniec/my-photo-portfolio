import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, CheckCircle, AlertCircle } from "lucide-react";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/lib/schemas/reset-password.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ForgotPasswordForm() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Wystąpił nieoczekiwany błąd");
        return;
      }

      // Always show success for security (don't reveal if email exists)
      setSubmittedEmail(data.email);
      setIsSuccess(true);
    } catch {
      setError("Wystąpił nieoczekiwany błąd");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="space-y-4">
        <Alert className="border-green-500 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200">
          <CheckCircle className="size-4" />
          <AlertDescription>
            Sprawdź swoją skrzynkę email. Wysłaliśmy link do resetowania hasła na adres{" "}
            <strong>{submittedEmail}</strong>.
          </AlertDescription>
        </Alert>

        <div className="text-center">
          <a
            href="/admin/login"
            className="text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            Wróć do logowania
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
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="twoj@email.com"
            className="pl-10"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
        </div>
        {errors.email && (
          <p id="email-error" className="text-sm text-destructive" role="alert">
            {errors.email.message}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? "Wysyłanie..." : "Wyślij link resetujący"}
      </Button>
    </form>
  );
}
