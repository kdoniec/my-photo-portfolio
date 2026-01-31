import { Skeleton } from "@/components/ui/skeleton";

interface GallerySkeletonProps {
  count?: number;
}

export default function GallerySkeleton({ count = 6 }: GallerySkeletonProps) {
  // Different aspect ratios for more realistic skeleton
  const aspectRatios = ["aspect-[3/4]", "aspect-[4/3]", "aspect-square", "aspect-[16/9]", "aspect-[3/2]"];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, index) => {
        const aspectRatio = aspectRatios[index % aspectRatios.length];
        return (
          <div key={index} className="flex flex-col gap-2">
            <Skeleton className={`w-full ${aspectRatio} rounded-lg`} />
            <Skeleton className="h-4 w-3/4" />
          </div>
        );
      })}
    </div>
  );
}
