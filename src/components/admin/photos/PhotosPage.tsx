import type { PhotoListResponseDTO, CategoryDTO, StatsDTO } from "@/types";
import { StatsProvider } from "@/components/admin/context/StatsContext";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { PhotosManager } from "./PhotosManager";

interface PhotosPageProps {
  initialPhotos: PhotoListResponseDTO;
  categories: CategoryDTO[];
  stats: StatsDTO;
}

export function PhotosPage({ initialPhotos, categories, stats }: PhotosPageProps) {
  return (
    <ErrorBoundary>
      <StatsProvider initialStats={stats}>
        <PhotosManager initialPhotos={initialPhotos} categories={categories} stats={stats} />
      </StatsProvider>
    </ErrorBoundary>
  );
}
