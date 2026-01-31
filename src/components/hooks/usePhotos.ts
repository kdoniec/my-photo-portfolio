import { useState, useCallback } from "react";
import type { PhotoDTO, PhotoListResponseDTO, UpdatePhotoCommand, PaginationDTO, CategoryDTO } from "@/types";
import { useStats } from "@/components/admin/context/StatsContext";

interface PhotoFilterState {
  category_id: string | "all" | "uncategorized";
  page: number;
  limit: number;
}

export function usePhotos(initialData: PhotoListResponseDTO, categories: CategoryDTO[]) {
  const [photos, setPhotos] = useState<PhotoDTO[]>(initialData.data);
  const [pagination, setPagination] = useState<PaginationDTO>(initialData.pagination);
  const [filter, setFilter] = useState<PhotoFilterState>({
    category_id: "all",
    page: 1,
    limit: 20,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { refreshStats } = useStats();

  const hasMore = pagination.page < pagination.total_pages;

  const fetchPhotos = async (newFilter?: Partial<PhotoFilterState>): Promise<void> => {
    setIsLoading(true);
    setError(null);

    const currentFilter = newFilter ? { ...filter, ...newFilter, page: 1 } : { ...filter, page: 1 };
    setFilter(currentFilter);

    try {
      const params = new URLSearchParams({
        page: "1",
        limit: currentFilter.limit.toString(),
      });

      if (currentFilter.category_id !== "all") {
        params.append("category_id", currentFilter.category_id);
      }

      const response = await fetch(`/api/photos?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Nie udało się pobrać zdjęć");
      }

      const data: PhotoListResponseDTO = await response.json();
      setPhotos(data.data);
      setPagination(data.pagination);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Nie udało się pobrać zdjęć";
      setError(errorMessage);
      console.error("Błąd podczas pobierania zdjęć:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = useCallback(async (): Promise<void> => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    setError(null);

    const nextPage = pagination.page + 1;

    try {
      const params = new URLSearchParams({
        page: nextPage.toString(),
        limit: filter.limit.toString(),
      });

      if (filter.category_id !== "all") {
        params.append("category_id", filter.category_id);
      }

      const response = await fetch(`/api/photos?${params.toString()}`);

      if (!response.ok) {
        throw new Error("Nie udało się pobrać więcej zdjęć");
      }

      const data: PhotoListResponseDTO = await response.json();
      setPhotos((prev) => [...prev, ...data.data]);
      setPagination(data.pagination);
      setFilter((prev) => ({ ...prev, page: nextPage }));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Nie udało się pobrać więcej zdjęć";
      setError(errorMessage);
      console.error("Błąd podczas pobierania więcej zdjęć:", err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore, pagination.page, filter.limit, filter.category_id]);

  const updatePhoto = async (id: string, data: UpdatePhotoCommand): Promise<PhotoDTO> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/photos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Nie udało się zaktualizować zdjęcia");
      }

      const updatedPhoto: PhotoDTO = await response.json();
      setPhotos((prev) => prev.map((photo) => (photo.id === id ? updatedPhoto : photo)));

      return updatedPhoto;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Nie udało się zaktualizować zdjęcia";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const togglePublish = async (id: string, isPublished: boolean): Promise<void> => {
    // Optimistic update
    const previousState = photos.find((p) => p.id === id)?.is_published;
    setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, is_published: isPublished } : p)));

    try {
      const response = await fetch(`/api/photos/${id}/publish`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_published: isPublished }),
      });

      if (!response.ok) {
        throw new Error("Nie udało się zaktualizować statusu publikacji");
      }
    } catch (err) {
      // Revert on error
      setPhotos((prev) => prev.map((p) => (p.id === id ? { ...p, is_published: previousState ?? false } : p)));
      throw err;
    }
  };

  const deletePhoto = async (id: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/photos/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Nie udało się usunąć zdjęcia");
      }

      setPhotos((prev) => prev.filter((photo) => photo.id !== id));
      await refreshStats();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Nie udało się usunąć zdjęcia";
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    photos,
    pagination,
    filter,
    setFilter,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    fetchPhotos,
    loadMore,
    updatePhoto,
    togglePublish,
    deletePhoto,
    categories, // Pass through for convenience
  };
}
