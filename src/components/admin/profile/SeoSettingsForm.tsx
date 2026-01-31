import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { SettingsDTO } from "@/types";
import type { SettingsFormData } from "@/lib/schemas/settings.schema";
import { settingsFormSchema } from "@/lib/schemas/settings.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface SeoSettingsFormProps {
  settings: SettingsDTO;
  onSuccess: () => void;
}

export function SeoSettingsForm({ settings, onSuccess }: SeoSettingsFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      site_title: settings.site_title || "",
      site_description: settings.site_description || "",
    },
  });

  // Sync form with settings prop changes
  useEffect(() => {
    reset({
      site_title: settings.site_title || "",
      site_description: settings.site_description || "",
    });
  }, [settings, reset]);

  const onSubmit = async (data: SettingsFormData) => {
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          site_title: data.site_title || null,
          site_description: data.site_description || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Nie udało się zaktualizować ustawień");
      }

      toast.success("Ustawienia SEO zostały zaktualizowane");
      onSuccess();
    } catch (err) {
      toast.error("Nie udało się zaktualizować ustawień", {
        description: err instanceof Error ? err.message : "Nieznany błąd",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="site_title">Tytuł strony</Label>
        <Input
          id="site_title"
          type="text"
          placeholder="Moje Portfolio Fotograficzne"
          {...register("site_title")}
          aria-invalid={!!errors.site_title}
          aria-describedby={errors.site_title ? "site_title-error" : undefined}
        />
        {errors.site_title && (
          <p id="site_title-error" className="text-sm text-destructive" role="alert">
            {errors.site_title.message}
          </p>
        )}
        <p className="text-sm text-muted-foreground">Wyświetlany w zakładkach przeglądarki i wynikach wyszukiwania</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="site_description">Opis strony</Label>
        <Textarea
          id="site_description"
          rows={3}
          placeholder="Profesjonalne zdjęcia portretowe, ślubne i krajobrazowe..."
          {...register("site_description")}
          aria-invalid={!!errors.site_description}
          aria-describedby={errors.site_description ? "site_description-error" : undefined}
        />
        {errors.site_description && (
          <p id="site_description-error" className="text-sm text-destructive" role="alert">
            {errors.site_description.message}
          </p>
        )}
        <p className="text-sm text-muted-foreground">Krótki opis strony wyświetlany w wynikach wyszukiwania</p>
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Zapisywanie..." : "Zapisz zmiany"}
        </Button>
      </div>
    </form>
  );
}
