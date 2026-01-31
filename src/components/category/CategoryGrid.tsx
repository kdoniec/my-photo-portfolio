import type { PublicCategoryDTO } from "../../types";
import CategoryCard from "./CategoryCard";
import EmptyState from "../shared/EmptyState";

interface CategoryGridProps {
  categories: PublicCategoryDTO[];
}

export default function CategoryGrid({ categories }: CategoryGridProps) {
  if (categories.length === 0) {
    return <EmptyState title="Galeria w przygotowaniu" description="Wkrótce pojawią się tutaj zdjęcia" />;
  }

  return (
    <section aria-label="Kategorie portfolio">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>
    </section>
  );
}
