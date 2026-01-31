import type { CategoryDTO } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Image } from "lucide-react";

interface CategoryCardProps {
  category: CategoryDTO;
  onEdit: () => void;
  onDelete: () => void;
}

export function CategoryCard({ category, onEdit, onDelete }: CategoryCardProps) {
  return (
    <Card className="group relative overflow-hidden transition-shadow hover:shadow-md">
      <CardHeader className="pb-3">
        <div className="flex items-start gap-4">
          {/* Cover photo thumbnail */}
          <div className="flex-shrink-0">
            {category.cover_photo_url ? (
              <img
                src={category.cover_photo_url}
                alt={`Okładka kategorii ${category.name}`}
                className="h-20 w-20 rounded-md object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-md bg-muted">
                <Image className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Category info */}
          <div className="flex-1 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-lg">{category.name}</CardTitle>
              <Badge variant="secondary">{category.photos_count} zdjęć</Badge>
            </div>
            {category.description && <CardDescription className="line-clamp-2">{category.description}</CardDescription>}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="flex-1"
            aria-label={`Edytuj kategorię ${category.name}`}
          >
            <Pencil className="mr-2 h-4 w-4" />
            Edytuj
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDelete}
            className="flex-1 text-destructive hover:bg-destructive hover:text-destructive-foreground"
            aria-label={`Usuń kategorię ${category.name}`}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Usuń
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
