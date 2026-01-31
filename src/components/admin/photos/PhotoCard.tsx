import type { PhotoDTO } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Pencil, Trash2 } from "lucide-react";

interface PhotoCardProps {
  photo: PhotoDTO;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePublish: (isPublished: boolean) => void;
}

export function PhotoCard({ photo, onEdit, onDelete, onTogglePublish }: PhotoCardProps) {
  return (
    <Card className="group overflow-hidden">
      {/* Photo thumbnail */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={photo.thumbnail_url}
          alt={photo.title || "Zdjęcie"}
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
          loading="lazy"
        />

        {/* Action buttons overlay (visible on hover) */}
        <div className="absolute right-2 top-2 flex gap-2 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 shadow-md"
            onClick={onEdit}
            aria-label={`Edytuj zdjęcie ${photo.title || photo.id}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className="h-8 w-8 text-destructive shadow-md hover:bg-destructive hover:text-destructive-foreground"
            onClick={onDelete}
            aria-label={`Usuń zdjęcie ${photo.title || photo.id}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Photo info */}
      <div className="space-y-3 p-3">
        {/* Title */}
        {photo.title && (
          <p className="line-clamp-1 text-sm font-medium" title={photo.title}>
            {photo.title}
          </p>
        )}

        {/* Category badge */}
        <div>
          {photo.category_name ? (
            <Badge variant="outline" className="text-xs">
              {photo.category_name}
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">
              Bez kategorii
            </Badge>
          )}
        </div>

        {/* Publish switch */}
        <div className="flex items-center justify-between">
          <Label htmlFor={`publish-${photo.id}`} className="text-sm">
            Opublikowane
          </Label>
          <Switch
            id={`publish-${photo.id}`}
            checked={photo.is_published}
            onCheckedChange={onTogglePublish}
            aria-label={`Zmień status publikacji zdjęcia ${photo.title || photo.id}`}
          />
        </div>
      </div>
    </Card>
  );
}
