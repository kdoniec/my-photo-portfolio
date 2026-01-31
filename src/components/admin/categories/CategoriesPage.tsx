import type { CategoryDTO, StatsDTO } from "@/types";
import { StatsProvider } from "@/components/admin/context/StatsContext";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { CategoriesManager } from "./CategoriesManager";

interface CategoriesPageProps {
  initialCategories: CategoryDTO[];
  stats: StatsDTO;
}

export function CategoriesPage({ initialCategories, stats }: CategoriesPageProps) {
  return (
    <ErrorBoundary>
      <StatsProvider initialStats={stats}>
        <CategoriesManager initialCategories={initialCategories} stats={stats} />
      </StatsProvider>
    </ErrorBoundary>
  );
}
