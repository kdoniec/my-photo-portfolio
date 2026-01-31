import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { photoFormSchema, type PhotoFormData } from "@/lib/schemas/photo.schema";
import type { PhotoDTO, CategoryDTO } from "@/types";
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
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PhotoEditDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  photo: PhotoDTO | null;
  categories: CategoryDTO[];
  onSubmit: (data: PhotoFormData) => Promise<void>;
}

export function PhotoEditDialog({ isOpen, onOpenChange, photo, categories, onSubmit }: PhotoEditDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<PhotoFormData>({
    resolver: zodResolver(photoFormSchema),
    defaultValues: {
      title: photo?.title || "",
      category_id: photo?.category_id || null,
      is_published: photo?.is_published || false,
    },
  });

  const isPublished = watch("is_published");
  const categoryId = watch("category_id");

  // Reset form when dialog opens/closes or photo changes
  useEffect(() => {
    if (isOpen && photo) {
      reset({
        title: photo.title || "",
        category_id: photo.category_id || null,
        is_published: photo.is_published,
      });
    }
  }, [isOpen, photo, reset]);

  const handleFormSubmit = async (data: PhotoFormData) => {
    setIsSubmitting(true);

    try {
      await onSubmit(data);
      onOpenChange(false);
      reset();
    } catch (err) {
      // Error handling is done in parent component
      console.error("Error submitting photo:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!photo) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edytuj zdjęcie</DialogTitle>
          <DialogDescription>Zaktualizuj informacje o zdjęciu</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Photo thumbnail */}
          <div className="flex items-center gap-4">
            <img
              src={photo.thumbnail_url}
              alt={photo.title || "Zdjęcie"}
              className="h-16 w-16 rounded-md object-cover"
            />
            <div className="text-sm text-muted-foreground">
              <p>
                {photo.original_width} × {photo.original_height} px
              </p>
              <p className="text-xs">ID: {photo.id.substring(0, 8)}...</p>
            </div>
          </div>

          {/* Title field */}
          <div className="space-y-2">
            <Label htmlFor="photo-title">Tytuł (opcjonalny)</Label>
            <Input
              id="photo-title"
              type="text"
              placeholder="np. Zachód słońca nad morzem"
              aria-invalid={!!errors.title}
              {...register("title")}
            />
            {errors.title && (
              <p className="text-sm text-destructive" role="alert">
                {errors.title.message}
              </p>
            )}
          </div>

          {/* Category select */}
          <div className="space-y-2">
            <Label htmlFor="photo-category">Kategoria (opcjonalna)</Label>
            <Select
              value={categoryId || "none"}
              onValueChange={(value) => setValue("category_id", value === "none" ? null : value)}
            >
              <SelectTrigger id="photo-category">
                <SelectValue placeholder="Wybierz kategorię" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Bez kategorii</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category_id && (
              <p className="text-sm text-destructive" role="alert">
                {errors.category_id.message}
              </p>
            )}
          </div>

          {/* Published switch */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="photo-published">Opublikowane</Label>
              <p className="text-sm text-muted-foreground">Zdjęcie będzie widoczne w publicznej galerii</p>
            </div>
            <Switch
              id="photo-published"
              checked={isPublished}
              onCheckedChange={(checked) => setValue("is_published", checked)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Anuluj
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Zapisywanie..." : "Zapisz zmiany"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
