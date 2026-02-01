import { useState, useRef, useEffect } from "react";
import type { PhotoDTO, CategoryDTO, StatsDTO, PhotoListResponseDTO } from "@/types";
import type { PhotoFormData } from "@/lib/schemas/photo.schema";
import { usePhotos } from "@/components/hooks/usePhotos";
import { PhotosGrid } from "./PhotosGrid";
import { PhotoEditDialog } from "./PhotoEditDialog";
import { PhotoUploadZone } from "./PhotoUploadZone";
import { LimitBadge } from "@/components/admin/shared/LimitBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PhotosManagerProps {
  initialPhotos: PhotoListResponseDTO;
  categories: CategoryDTO[];
  stats: StatsDTO;
}

export function PhotosManager({ initialPhotos, categories, stats }: PhotosManagerProps) {
  const {
    photos,
    pagination,
    filter,
    isLoading,
    isLoadingMore,
    hasMore,
    updatePhoto,
    togglePublish,
    deletePhoto,
    fetchPhotos,
    loadMore,
  } = usePhotos(initialPhotos, categories);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Infinite scroll with IntersectionObserver
  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
          loadMore();
        }
      },
      { rootMargin: "400px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loadMore]);
  const [uploadDialog, setUploadDialog] = useState(false);
  const [photoDialog, setPhotoDialog] = useState<{
    isOpen: boolean;
    photo: PhotoDTO | null;
  }>({
    isOpen: false,
    photo: null,
  });
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    photo: PhotoDTO | null;
  }>({
    isOpen: false,
    photo: null,
  });

  const handleAddPhotos = () => {
    setUploadDialog(true);
  };

  const handleUploadComplete = () => {
    fetchPhotos();
  };

  const handleEditPhoto = (photo: PhotoDTO) => {
    setPhotoDialog({
      isOpen: true,
      photo,
    });
  };

  const handlePhotoSubmit = async (data: PhotoFormData) => {
    if (!photoDialog.photo) return;

    try {
      await updatePhoto(photoDialog.photo.id, {
        title: data.title || null,
        category_id: data.category_id || null,
        is_published: data.is_published,
      });
      toast.success("Zdjęcie zostało zaktualizowane");
      setPhotoDialog({ isOpen: false, photo: null });
    } catch (err) {
      toast.error("Nie udało się zaktualizować zdjęcia", {
        description: err instanceof Error ? err.message : "Nieznany błąd",
      });
      throw err;
    }
  };

  const handleDeleteClick = (photo: PhotoDTO) => {
    setDeleteConfirmation({
      isOpen: true,
      photo,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmation.photo) return;

    try {
      await deletePhoto(deleteConfirmation.photo.id);
      toast.success("Zdjęcie zostało usunięte");
      setDeleteConfirmation({ isOpen: false, photo: null });
    } catch (err) {
      toast.error("Nie udało się usunąć zdjęcia", {
        description: err instanceof Error ? err.message : "Nieznany błąd",
      });
    }
  };

  const handleTogglePublish = async (photo: PhotoDTO, isPublished: boolean) => {
    try {
      await togglePublish(photo.id, isPublished);
      toast.success(isPublished ? "Zdjęcie opublikowane" : "Zdjęcie ukryte");
    } catch (err) {
      toast.error("Nie udało się zmienić statusu publikacji", {
        description: err instanceof Error ? err.message : "Nieznany błąd",
      });
    }
  };

  const handleCategoryFilterChange = (value: string) => {
    fetchPhotos({ category_id: value as "all" | "uncategorized" | string });
  };

  const isLimitReached = stats.photos.count >= stats.photos.limit;

  return (
    <div className="space-y-6">
      {/* Toolbar section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-2xl font-bold">Zarządzanie zdjęciami</h2>
          <LimitBadge current={stats.photos.count} limit={stats.photos.limit} />
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Category filter */}
          <Select value={filter.category_id} onValueChange={handleCategoryFilterChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Wszystkie kategorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie kategorie</SelectItem>
              <SelectItem value="uncategorized">Bez kategorii</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Add photos button */}
          <Button onClick={handleAddPhotos} disabled={isLimitReached || isLoading}>
            <Plus className="mr-2 h-4 w-4" />
            Dodaj zdjęcia
          </Button>
        </div>
      </div>

      {isLimitReached && (
        <div className="rounded-lg border border-yellow-500 bg-yellow-500/10 p-4 text-yellow-800 dark:text-yellow-200">
          <p className="text-sm font-medium">Osiągnięto limit zdjęć ({stats.photos.limit})</p>
          <p className="text-sm">Usuń istniejące zdjęcia, aby dodać nowe.</p>
        </div>
      )}

      {/* Photos grid */}
      <PhotosGrid
        photos={photos}
        onEdit={handleEditPhoto}
        onDelete={handleDeleteClick}
        onTogglePublish={handleTogglePublish}
      />

      {/* Infinite scroll sentinel and loading indicator */}
      <div ref={loadMoreRef} className="flex items-center justify-center py-4">
        {isLoadingMore && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Ładowanie więcej zdjęć...</span>
          </div>
        )}
        {!hasMore && photos.length > 0 && (
          <span className="text-sm text-muted-foreground">Wyświetlono wszystkie zdjęcia ({pagination.total})</span>
        )}
      </div>

      {/* Photo upload zone */}
      <PhotoUploadZone
        isOpen={uploadDialog}
        onOpenChange={setUploadDialog}
        categories={categories}
        currentPhotoCount={stats.photos.count}
        photoLimit={stats.photos.limit}
        onUploadComplete={handleUploadComplete}
      />

      {/* Photo edit dialog */}
      <PhotoEditDialog
        isOpen={photoDialog.isOpen}
        onOpenChange={(open) => !open && setPhotoDialog({ isOpen: false, photo: null })}
        photo={photoDialog.photo}
        categories={categories}
        onSubmit={handlePhotoSubmit}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={deleteConfirmation.isOpen}
        onOpenChange={(open) => !open && setDeleteConfirmation({ isOpen: false, photo: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Czy na pewno chcesz usunąć to zdjęcie?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirmation.photo && (
                <>
                  Zdjęcie{" "}
                  <strong>
                    {deleteConfirmation.photo.title || `ID: ${deleteConfirmation.photo.id.substring(0, 8)}...`}
                  </strong>{" "}
                  zostanie trwale usunięte wraz z jego plikami.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Usuń zdjęcie
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
