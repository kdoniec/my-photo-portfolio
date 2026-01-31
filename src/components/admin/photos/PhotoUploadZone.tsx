import { useCallback } from "react";
import { useDropzone, type FileRejection } from "react-dropzone";
import type { CategoryDTO } from "@/types";
import { usePhotoUpload } from "@/components/hooks/usePhotoUpload";
import { UploadProgressList } from "./UploadProgressList";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X } from "lucide-react";
import { toast } from "sonner";

interface PhotoUploadZoneProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryDTO[];
  currentPhotoCount: number;
  photoLimit: number;
  onUploadComplete: () => void;
}

export function PhotoUploadZone({
  isOpen,
  onOpenChange,
  categories,
  currentPhotoCount,
  photoLimit,
  onUploadComplete,
}: PhotoUploadZoneProps) {
  const {
    files,
    settings,
    setSettings,
    isUploading,
    addFiles,
    removeFile,
    clearFiles,
    processUpload,
    retryFile,
    canUpload,
  } = usePhotoUpload(currentPhotoCount, photoLimit);

  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      // Show errors for rejected files
      if (rejectedFiles.length > 0) {
        const errors = rejectedFiles.map((rejection) => {
          if (rejection.errors.some((e) => e.code === "file-invalid-type")) {
            return `${rejection.file.name}: Tylko pliki JPEG są dozwolone`;
          }
          if (rejection.errors.some((e) => e.code === "file-too-large")) {
            return `${rejection.file.name}: Plik jest za duży (max 10MB)`;
          }
          return `${rejection.file.name}: Nieprawidłowy plik`;
        });

        toast.error("Niektóre pliki zostały odrzucone", {
          description: errors.join(", "),
        });
      }

      // Add accepted files
      if (acceptedFiles.length > 0) {
        addFiles(acceptedFiles);
      }
    },
    [addFiles]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 20,
    multiple: true,
    disabled: isUploading,
  });

  const handleUpload = async () => {
    try {
      const result = await processUpload();

      if (result.summary.successful > 0) {
        toast.success(`Przesłano ${result.summary.successful} zdjęć`, {
          description: result.summary.failed > 0 ? `${result.summary.failed} plików nie udało się przesłać` : undefined,
        });

        if (result.summary.failed === 0) {
          clearFiles();
          onUploadComplete();
          onOpenChange(false);
        }
      } else {
        toast.error("Nie udało się przesłać żadnych zdjęć");
      }
    } catch {
      toast.error("Błąd podczas przesyłania zdjęć");
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      clearFiles();
      onOpenChange(false);
    }
  };

  const remainingSlots = photoLimit - currentPhotoCount - files.length;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Dodaj zdjęcia</DialogTitle>
          <DialogDescription>
            Przeciągnij i upuść pliki JPEG lub kliknij, aby wybrać (max 20 plików, max 10MB każdy)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Dropzone */}
          <div
            {...getRootProps()}
            className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
              isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"
            } ${isUploading ? "pointer-events-none opacity-50" : ""}`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-sm font-medium">Upuść pliki tutaj...</p>
            ) : (
              <>
                <p className="text-sm font-medium">Przeciągnij i upuść zdjęcia tutaj</p>
                <p className="text-xs text-muted-foreground">lub kliknij, aby wybrać pliki</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Pozostało miejsc: {remainingSlots > 0 ? remainingSlots : 0} / {photoLimit}
                </p>
              </>
            )}
          </div>

          {/* Upload settings */}
          {files.length > 0 && (
            <div className="space-y-3 rounded-lg border p-4">
              <h3 className="text-sm font-medium">Ustawienia uploadu</h3>

              {/* Category select */}
              <div className="space-y-2">
                <Label htmlFor="upload-category">Kategoria (opcjonalna)</Label>
                <Select
                  value={settings.category_id || "none"}
                  onValueChange={(value) =>
                    setSettings((prev) => ({ ...prev, category_id: value === "none" ? null : value }))
                  }
                  disabled={isUploading}
                >
                  <SelectTrigger id="upload-category">
                    <SelectValue placeholder="Bez kategorii" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Bez kategorii</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Publish switch */}
              <div className="flex items-center justify-between">
                <Label htmlFor="upload-publish">Opublikuj od razu</Label>
                <Switch
                  id="upload-publish"
                  checked={settings.is_published}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, is_published: checked }))}
                  disabled={isUploading}
                />
              </div>
            </div>
          )}

          {/* Progress list */}
          <UploadProgressList files={files} onRemove={removeFile} onRetry={retryFile} />
        </div>

        <DialogFooter>
          <div className="flex w-full items-center justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={clearFiles}
              disabled={isUploading || files.length === 0}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Wyczyść listę
            </Button>

            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleClose} disabled={isUploading}>
                {isUploading ? "Anuluj" : "Zamknij"}
              </Button>
              <Button type="button" onClick={handleUpload} disabled={!canUpload || isUploading}>
                {isUploading ? "Wysyłanie..." : `Wyślij (${files.length})`}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
