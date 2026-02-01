import type { CategoryDTO } from "@/types";
import { CategoryCard } from "./CategoryCard";
import { FolderOpen } from "lucide-react";

interface CategoriesGridProps {
  categories: CategoryDTO[];
  onEdit: (category: CategoryDTO) => void;
  onDelete: (category: CategoryDTO) => void;
}

export function CategoriesGrid({ categories, onEdit, onDelete }: CategoriesGridProps) {
  if (categories.length === 0) {
    return (
      <div
        className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center"
        data-test-id="categories-empty-state"
      >
        <FolderOpen className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-semibold">Brak kategorii</h3>
        <p className="text-sm text-muted-foreground">Dodaj pierwszą kategorię, aby zorganizować swoje zdjęcia</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2" data-test-id="categories-grid">
      {categories.map((category) => (
        <CategoryCard
          key={category.id}
          category={category}
          onEdit={() => onEdit(category)}
          onDelete={() => onDelete(category)}
        />
      ))}
    </div>
  );
}
