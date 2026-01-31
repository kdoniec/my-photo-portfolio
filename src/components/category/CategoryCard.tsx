import type { PublicCategoryDTO } from "../../types";

interface CategoryCardProps {
  category: PublicCategoryDTO;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const { name, slug, description, cover_photo_url, photos_count } = category;

  return (
    <article className="group relative overflow-hidden rounded-lg border border-border bg-card transition-transform hover:scale-[1.02]">
      <a href={`/kategoria/${slug}`} className="block">
        {/* Cover Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {cover_photo_url ? (
            <img
              src={cover_photo_url}
              alt={`Okładka kategorii ${name}`}
              loading="lazy"
              className="h-full w-full object-cover transition-all duration-300 group-hover:brightness-110 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
              <span className="text-muted-foreground text-sm">Brak okładki</span>
            </div>
          )}

          {/* Photo Count Badge */}
          <div className="absolute top-3 right-3 rounded-full bg-background/90 px-3 py-1 backdrop-blur-sm">
            <span className="text-xs font-medium text-foreground">
              {photos_count} {photos_count === 1 ? "zdjęcie" : "zdjęć"}
            </span>
          </div>
        </div>

        {/* Overlay with Name and Description */}
        <div className="p-4">
          <h3 className="text-lg font-semibold text-foreground mb-1 line-clamp-1">{name}</h3>
          {description && <p className="text-sm text-muted-foreground line-clamp-2">{description}</p>}
        </div>
      </a>
    </article>
  );
}
