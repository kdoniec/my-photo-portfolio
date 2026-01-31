import type { StatsDTO } from "@/types";
import { Progress } from "@/components/ui/progress";

interface StatsCardProps {
  stats: StatsDTO;
}

export function StatsCard({ stats }: StatsCardProps) {
  const calculatePercentage = (current: number, limit: number): number => {
    if (limit === 0) return 0;
    return Math.round((current / limit) * 100);
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 90) return "bg-destructive";
    if (percentage >= 70) return "bg-yellow-500";
    return "bg-primary";
  };

  const photosPercentage = calculatePercentage(stats.photos.count, stats.photos.limit);
  const categoriesPercentage = calculatePercentage(stats.categories.count, stats.categories.limit);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Wykorzystanie zasobów</h3>
        <p className="text-sm text-muted-foreground">Aktualne statystyki użycia Twojej strony</p>
      </div>

      <div className="space-y-6">
        {/* Photos stats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Zdjęcia</p>
              <p className="text-xs text-muted-foreground">
                {stats.photos.count} z {stats.photos.limit} ({photosPercentage}%)
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{stats.photos.limit - stats.photos.count}</p>
              <p className="text-xs text-muted-foreground">pozostało</p>
            </div>
          </div>
          <Progress value={photosPercentage} className={getProgressColor(photosPercentage)} />
        </div>

        {/* Categories stats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Kategorie</p>
              <p className="text-xs text-muted-foreground">
                {stats.categories.count} z {stats.categories.limit} ({categoriesPercentage}%)
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{stats.categories.limit - stats.categories.count}</p>
              <p className="text-xs text-muted-foreground">pozostało</p>
            </div>
          </div>
          <Progress value={categoriesPercentage} className={getProgressColor(categoriesPercentage)} />
        </div>

        {/* Published photos stats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Opublikowane zdjęcia</p>
              <p className="text-xs text-muted-foreground">
                {stats.photos.published_count} z {stats.photos.count}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">
                {stats.photos.count > 0 ? Math.round((stats.photos.published_count / stats.photos.count) * 100) : 0}%
              </p>
              <p className="text-xs text-muted-foreground">widoczne</p>
            </div>
          </div>
          <Progress value={stats.photos.count > 0 ? (stats.photos.published_count / stats.photos.count) * 100 : 0} />
        </div>
      </div>
    </div>
  );
}
