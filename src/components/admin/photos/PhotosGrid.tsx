import type { PhotoDTO } from "@/types";
import { PhotoCard } from "./PhotoCard";
import { Image } from "lucide-react";

interface PhotosGridProps {
  photos: PhotoDTO[];
  onEdit: (photo: PhotoDTO) => void;
  onDelete: (photo: PhotoDTO) => void;
  onTogglePublish: (photo: PhotoDTO, isPublished: boolean) => void;
}

export function PhotosGrid({ photos, onEdit, onDelete, onTogglePublish }: PhotosGridProps) {
  if (photos.length === 0) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <Image className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-semibold">Brak zdjęć</h3>
        <p className="text-sm text-muted-foreground">Dodaj pierwsze zdjęcie do swojego portfolio</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {photos.map((photo) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          onEdit={() => onEdit(photo)}
          onDelete={() => onDelete(photo)}
          onTogglePublish={(isPublished) => onTogglePublish(photo, isPublished)}
        />
      ))}
    </div>
  );
}
