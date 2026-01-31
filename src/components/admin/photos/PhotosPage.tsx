import type { PhotoListResponseDTO, CategoryDTO, StatsDTO } from "@/types";
import { StatsProvider } from "@/components/admin/context/StatsContext";
import { PhotosManager } from "./PhotosManager";

interface PhotosPageProps {
  initialPhotos: PhotoListResponseDTO;
  categories: CategoryDTO[];
  stats: StatsDTO;
}

export function PhotosPage({ initialPhotos, categories, stats }: PhotosPageProps) {
  return (
    <StatsProvider initialStats={stats}>
      <PhotosManager initialPhotos={initialPhotos} categories={categories} stats={stats} />
    </StatsProvider>
  );
}
