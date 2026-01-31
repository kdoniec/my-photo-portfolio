import type { PhotoUploadFile } from "@/components/admin/types";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { X, RotateCw, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadProgressItemProps {
  file: PhotoUploadFile;
  onRemove: () => void;
  onRetry: () => void;
}

export function UploadProgressItem({ file, onRemove, onRetry }: UploadProgressItemProps) {
  const getStatusIcon = () => {
    switch (file.status) {
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "error":
        return <XCircle className="h-4 w-4 text-destructive" />;
      case "compressing":
      case "uploading":
      case "validating":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (file.status) {
      case "pending":
        return "Oczekuje";
      case "validating":
        return "Walidacja";
      case "compressing":
        return "Kompresja";
      case "uploading":
        return "Wysyłanie";
      case "success":
        return "Ukończono";
      case "error":
        return "Błąd";
      default:
        return "";
    }
  };

  const getStatusColor = () => {
    switch (file.status) {
      case "success":
        return "text-green-600";
      case "error":
        return "text-destructive";
      case "compressing":
      case "uploading":
      case "validating":
        return "text-blue-600";
      default:
        return "text-muted-foreground";
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex gap-3 rounded-lg border p-3">
      {/* Preview */}
      <div className="flex-shrink-0">
        {file.preview ? (
          <img src={file.preview} alt={file.file.name} className="h-12 w-12 rounded object-cover" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded bg-muted">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Info and Progress */}
      <div className="flex-1 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <p className="truncate text-sm font-medium" title={file.file.name}>
              {file.file.name}
            </p>
            <p className="text-xs text-muted-foreground">{formatFileSize(file.file.size)}</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Status icon and text */}
            <div className="flex items-center gap-1">
              {getStatusIcon()}
              <span className={cn("text-xs font-medium", getStatusColor())}>{getStatusText()}</span>
            </div>

            {/* Action buttons */}
            {file.status === "error" ? (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onRetry}
                aria-label="Ponów upload"
              >
                <RotateCw className="h-3 w-3" />
              </Button>
            ) : null}

            {file.status !== "uploading" && file.status !== "compressing" && file.status !== "validating" && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onRemove}
                aria-label="Usuń plik"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {file.status !== "pending" && file.status !== "success" && file.status !== "error" && (
          <div className="space-y-1">
            <Progress value={file.progress} className="h-1" />
            <p className="text-xs text-muted-foreground">{file.progress}%</p>
          </div>
        )}

        {/* Error message */}
        {file.error && (
          <p className="text-xs text-destructive" role="alert">
            {file.error}
          </p>
        )}
      </div>
    </div>
  );
}
