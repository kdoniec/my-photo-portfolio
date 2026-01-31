import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { categoryFormSchema, type CategoryFormData } from "@/lib/schemas/category.schema";
import type { CategoryDTO } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CoverPhotoSelector } from "./CoverPhotoSelector";

interface CategoryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  category?: CategoryDTO | null;
  onSubmit: (data: CategoryFormData) => Promise<void>;
}

// Generate slug from name (simplified Polish slug generator)
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/ą/g, "a")
    .replace(/ć/g, "c")
    .replace(/ę/g, "e")
    .replace(/ł/g, "l")
    .replace(/ń/g, "n")
    .replace(/ó/g, "o")
    .replace(/ś/g, "s")
    .replace(/ź|ż/g, "z")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function CategoryDialog({ isOpen, onOpenChange, mode, category, onSubmit }: CategoryDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slugPreview, setSlugPreview] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: category?.name || "",
      description: category?.description || "",
      cover_photo_id: category?.cover_photo_id || null,
    },
  });

  const nameValue = watch("name");
  const coverPhotoId = watch("cover_photo_id");

  // Update slug preview when name changes
  useEffect(() => {
    if (nameValue) {
      setSlugPreview(generateSlug(nameValue));
    } else {
      setSlugPreview("");
    }
  }, [nameValue]);

  // Reset form when dialog opens/closes or category changes
  useEffect(() => {
    if (isOpen) {
      reset({
        name: category?.name || "",
        description: category?.description || "",
        cover_photo_id: category?.cover_photo_id || null,
      });
      setSlugPreview(category?.slug || "");
    }
  }, [isOpen, category, reset]);

  const handleFormSubmit = async (data: CategoryFormData) => {
    setIsSubmitting(true);

    try {
      await onSubmit(data);
      onOpenChange(false);
      reset();
    } catch (err) {
      // Error handling is done in parent component
      console.error("Error submitting category:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Dodaj kategorię" : "Edytuj kategorię"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Utwórz nową kategorię do organizacji swoich zdjęć"
              : "Zaktualizuj informacje o kategorii"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Name field */}
          <div className="space-y-2">
            <Label htmlFor="category-name">Nazwa</Label>
            <Input
              id="category-name"
              type="text"
              placeholder="np. Portrety, Krajobrazy, Architektura"
              aria-invalid={!!errors.name}
              {...register("name")}
            />
            {errors.name && (
              <p className="text-sm text-destructive" role="alert">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Slug preview */}
          <div className="space-y-2">
            <Label htmlFor="category-slug">Slug (generowany automatycznie)</Label>
            <Input
              id="category-slug"
              type="text"
              value={slugPreview}
              readOnly
              disabled
              className="bg-muted"
              placeholder="slug-generowany-automatycznie"
            />
            <p className="text-xs text-muted-foreground">Slug jest generowany automatycznie na podstawie nazwy</p>
          </div>

          {/* Description field */}
          <div className="space-y-2">
            <Label htmlFor="category-description">Opis (opcjonalny)</Label>
            <Textarea
              id="category-description"
              placeholder="Opisz tę kategorię..."
              rows={3}
              aria-invalid={!!errors.description}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-sm text-destructive" role="alert">
                {errors.description.message}
              </p>
            )}
          </div>

          {/* Cover photo selector - only in edit mode when category has photos */}
          {mode === "edit" && category && category.photos_count > 0 && (
            <div className="space-y-2">
              <Label>Zdjęcie okładkowe</Label>
              <CoverPhotoSelector
                categoryId={category.id}
                currentCoverId={coverPhotoId}
                onSelect={(photoId) => setValue("cover_photo_id", photoId)}
              />
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Zapisywanie..." : "Zapisz"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
