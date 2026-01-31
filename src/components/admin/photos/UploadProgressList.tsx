import type { PhotoUploadFile } from "@/components/admin/types";
import { UploadProgressItem } from "./UploadProgressItem";
import { ScrollArea } from "@/components/ui/scroll-area";

interface UploadProgressListProps {
  files: PhotoUploadFile[];
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
}

export function UploadProgressList({ files, onRemove, onRetry }: UploadProgressListProps) {
  if (files.length === 0) {
    return null;
  }

  return (
    <ScrollArea className="h-[300px] w-full">
      <div className="space-y-2 pr-4">
        {files.map((file) => (
          <UploadProgressItem
            key={file.id}
            file={file}
            onRemove={() => onRemove(file.id)}
            onRetry={() => onRetry(file.id)}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
