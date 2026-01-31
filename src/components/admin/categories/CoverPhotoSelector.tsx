import { useCallback, useEffect, useState } from "react";
import { ImageIcon, Check, Loader2 } from "lucide-react";
import type { PhotoDTO } from "@/types";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverHeader,
  PopoverTitle,
  PopoverDescription,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface CoverPhotoSelectorProps {
  categoryId: string;
  currentCoverId?: string | null;
  onSelect: (photoId: string) => void;
}

export function CoverPhotoSelector({ categoryId, currentCoverId, onSelect }: CoverPhotoSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [photos, setPhotos] = useState<PhotoDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPhotos = useCallback(async () => {
    if (!categoryId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/photos?category_id=${categoryId}&limit=50`);

      if (!response.ok) {
        throw new Error("Nie udało się pobrać zdjęć");
      }

      const data = await response.json();
      setPhotos(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Wystąpił błąd");
    } finally {
      setIsLoading(false);
    }
  }, [categoryId]);

  // Fetch photos when popover opens
  useEffect(() => {
    if (isOpen) {
      fetchPhotos();
    }
  }, [isOpen, fetchPhotos]);

  const handleSelect = (photoId: string) => {
    onSelect(photoId);
    setIsOpen(false);
  };

  const selectedPhoto = photos.find((p) => p.id === currentCoverId);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="w-full justify-start gap-2">
          {selectedPhoto ? (
            <>
              <img
                src={selectedPhoto.thumbnail_url}
                alt=""
                className="h-6 w-6 rounded object-cover"
                aria-hidden="true"
              />
              <span className="truncate">{selectedPhoto.title || "Wybrane zdjęcie"}</span>
            </>
          ) : (
            <>
              <ImageIcon className="h-4 w-4" aria-hidden="true" />
              <span>Wybierz zdjęcie okładkowe</span>
            </>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="start">
        <PopoverHeader className="border-b p-3">
          <PopoverTitle>Wybierz okładkę</PopoverTitle>
          <PopoverDescription>Kliknij zdjęcie, aby ustawić jako okładkę kategorii</PopoverDescription>
        </PopoverHeader>

        <div className="p-3">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Ładowanie zdjęć" />
            </div>
          )}

          {error && (
            <div className="py-4 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <Button type="button" variant="ghost" size="sm" onClick={fetchPhotos} className="mt-2">
                Spróbuj ponownie
              </Button>
            </div>
          )}

          {!isLoading && !error && photos.length === 0 && (
            <div className="py-6 text-center">
              <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground" aria-hidden="true" />
              <p className="mt-2 text-sm text-muted-foreground">Brak zdjęć w tej kategorii</p>
            </div>
          )}

          {!isLoading && !error && photos.length > 0 && (
            <ScrollArea className="h-[300px]">
              <div className="grid grid-cols-3 gap-2">
                {photos.map((photo) => {
                  const isSelected = photo.id === currentCoverId;
                  return (
                    <button
                      key={photo.id}
                      type="button"
                      onClick={() => handleSelect(photo.id)}
                      className={cn(
                        "group relative aspect-square overflow-hidden rounded-md border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                        isSelected ? "border-primary" : "border-transparent hover:border-muted-foreground/50"
                      )}
                      aria-label={`Wybierz ${photo.title || "zdjęcie"} jako okładkę`}
                      aria-pressed={isSelected}
                    >
                      <img
                        src={photo.thumbnail_url}
                        alt={photo.title || ""}
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
                          <div className="rounded-full bg-primary p-1">
                            <Check className="h-4 w-4 text-primary-foreground" aria-hidden="true" />
                          </div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
