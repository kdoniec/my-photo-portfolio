import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ProfileDTO } from "@/types";
import type { ProfileFormData } from "@/lib/schemas/profile.schema";
import { profileFormSchema } from "@/lib/schemas/profile.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface ProfileFormProps {
  profile: ProfileDTO;
  onSuccess: () => void;
}

export function ProfileForm({ profile, onSuccess }: ProfileFormProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      display_name: profile.display_name || "",
      bio: profile.bio || "",
      contact_email: profile.contact_email || "",
      contact_phone: profile.contact_phone || "",
    },
  });

  // Sync form with profile prop changes
  useEffect(() => {
    reset({
      display_name: profile.display_name || "",
      bio: profile.bio || "",
      contact_email: profile.contact_email || "",
      contact_phone: profile.contact_phone || "",
    });
  }, [profile, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          display_name: data.display_name,
          bio: data.bio || null,
          contact_email: data.contact_email || null,
          contact_phone: data.contact_phone || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Nie udało się zaktualizować profilu");
      }

      toast.success("Profil został zaktualizowany");
      onSuccess();
    } catch (err) {
      toast.error("Nie udało się zaktualizować profilu", {
        description: err instanceof Error ? err.message : "Nieznany błąd",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="display_name">
          Nazwa wyświetlana <span className="text-destructive">*</span>
        </Label>
        <Input
          id="display_name"
          type="text"
          {...register("display_name")}
          aria-invalid={!!errors.display_name}
          aria-describedby={errors.display_name ? "display_name-error" : undefined}
        />
        {errors.display_name && (
          <p id="display_name-error" className="text-sm text-destructive" role="alert">
            {errors.display_name.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          rows={4}
          placeholder="Kilka słów o sobie..."
          {...register("bio")}
          aria-invalid={!!errors.bio}
          aria-describedby={errors.bio ? "bio-error" : undefined}
        />
        {errors.bio && (
          <p id="bio-error" className="text-sm text-destructive" role="alert">
            {errors.bio.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact_email">Email kontaktowy</Label>
        <Input
          id="contact_email"
          type="email"
          placeholder="kontakt@example.com"
          {...register("contact_email")}
          aria-invalid={!!errors.contact_email}
          aria-describedby={errors.contact_email ? "contact_email-error" : undefined}
        />
        {errors.contact_email && (
          <p id="contact_email-error" className="text-sm text-destructive" role="alert">
            {errors.contact_email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="contact_phone">Telefon kontaktowy</Label>
        <Input
          id="contact_phone"
          type="tel"
          placeholder="+48 123 456 789"
          {...register("contact_phone")}
          aria-invalid={!!errors.contact_phone}
          aria-describedby={errors.contact_phone ? "contact_phone-error" : undefined}
        />
        {errors.contact_phone && (
          <p id="contact_phone-error" className="text-sm text-destructive" role="alert">
            {errors.contact_phone.message}
          </p>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Zapisywanie..." : "Zapisz zmiany"}
        </Button>
      </div>
    </form>
  );
}
