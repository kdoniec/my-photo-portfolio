import { useState } from "react";
import Masonry from "react-masonry-css";
import PhotoCard from "./PhotoCard";
import PhotoLightbox from "./PhotoLightbox";
import GallerySkeleton from "./GallerySkeleton";
import ErrorState from "../shared/ErrorState";
import EmptyState from "../shared/EmptyState";
import { useInfiniteScroll } from "../../hooks/useInfiniteScroll";
import { useLightbox } from "../../hooks/useLightbox";
import type { PublicPhotoDTO, PaginationDTO, PublicPhotoListResponseDTO } from "../../types";

interface PhotoMasonryProps {
  categorySlug: string;
  initialPhotos: PublicPhotoDTO[];
  initialPagination: PaginationDTO;
}

export default function PhotoMasonry({ categorySlug, initialPhotos, initialPagination }: PhotoMasonryProps) {
  const [photos, setPhotos] = useState<PublicPhotoDTO[]>(initialPhotos);
  const [page, setPage] = useState(initialPagination.page);
  const [hasMore, setHasMore] = useState(initialPagination.page < initialPagination.total_pages);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Lightbox state
  const lightbox = useLightbox({ photos });

  // Load more photos
  const loadMorePhotos = async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      const nextPage = page + 1;
      const response = await fetch(`/api/public/categories/${categorySlug}/photos?page=${nextPage}&limit=20`);

      if (!response.ok) {
        throw new Error("Nie udało się załadować zdjęć");
      }

      const data: PublicPhotoListResponseDTO = await response.json();

      setPhotos((prev) => [...prev, ...data.data]);
      setPage(nextPage);
      setHasMore(nextPage < data.pagination.total_pages);
    } catch (err) {
      console.error("Failed to load photos:", err);
      setError(err instanceof Error ? err : new Error("Wystąpił błąd"));
    } finally {
      setIsLoading(false);
    }
  };

  // Infinite scroll
  const { sentinelRef } = useInfiniteScroll({
    hasMore,
    isLoading,
    onLoadMore: loadMorePhotos,
    threshold: 200,
  });

  // Masonry breakpoints
  const breakpointColumns = {
    default: 4,
    1024: 3,
    768: 2,
    640: 1,
  };

  // Empty state
  if (photos.length === 0 && !isLoading) {
    return (
      <EmptyState
        title="Brak zdjęć"
        description="Ta kategoria nie zawiera jeszcze żadnych zdjęć"
        action={{ label: "Wróć do galerii", href: "/" }}
      />
    );
  }

  return (
    <>
      <Masonry breakpointCols={breakpointColumns} className="flex gap-4 w-full" columnClassName="flex flex-col gap-4">
        {photos.map((photo, index) => (
          <PhotoCard key={photo.id} photo={photo} onClick={() => lightbox.open(index)} />
        ))}
      </Masonry>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="mt-8">
          <GallerySkeleton count={6} />
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="mt-8">
          <ErrorState
            message={error.message}
            onRetry={() => {
              setError(null);
              loadMorePhotos();
            }}
          />
        </div>
      )}

      {/* End of list message */}
      {!hasMore && !isLoading && photos.length > 0 && (
        <p className="text-center text-muted-foreground py-8 mt-8">To wszystkie zdjęcia w tej kategorii</p>
      )}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} className="h-4" aria-hidden="true" />

      {/* Lightbox */}
      {lightbox.isOpen && (
        <PhotoLightbox
          photos={photos}
          currentIndex={lightbox.currentIndex}
          onClose={lightbox.close}
          onNavigate={lightbox.goTo}
        />
      )}
    </>
  );
}
