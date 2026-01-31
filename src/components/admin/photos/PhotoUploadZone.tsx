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
          const errorCodes = rejection.errors.map((e) => e.code).join(", ");
          const fileSize = (rejection.file.size / 1024 / 1024).toFixed(2);

          if (rejection.errors.some((e) => e.code === "file-invalid-type")) {
            return `${rejection.file.name}: Tylko pliki JPEG są dozwolone (typ: ${rejection.file.type || "brak"})`;
          }
          if (rejection.errors.some((e) => e.code === "file-too-large")) {
            return `${rejection.file.name}: Plik jest za duży (${fileSize}MB, max 50MB)`;
          }
          if (rejection.errors.some((e) => e.code === "invalid-extension")) {
            return `${rejection.file.name}: Nieprawidłowe rozszerzenie`;
          }
          return `${rejection.file.name}: Nieprawidłowy plik (${errorCodes})`;
        });

        console.log("Rejected files:", rejectedFiles); // Debug info
        toast.error("Niektóre pliki zostały odrzucone", {
          description: errors.slice(0, 5).join(", ") + (errors.length > 5 ? ` ... i ${errors.length - 5} więcej` : ""),
          duration: 10000, // 10 seconds to read the error
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
      "image/jpg": [".jpg"], // Some systems use this incorrect MIME type
      "image/pjpeg": [".jpg", ".jpeg"], // Progressive JPEG
    },
    maxSize: 50 * 1024 * 1024, // 50MB (we compress anyway)
    maxFiles: 100, // Allow bulk uploads
    multiple: true,
    disabled: isUploading,
    validator: (file) => {
      // Additional validation - accept any file with .jpg or .jpeg extension
      const extension = file.name.toLowerCase().split(".").pop();
      if (extension === "jpg" || extension === "jpeg") {
        return null; // Valid
      }
      return {
        code: "invalid-extension",
        message: "Tylko pliki JPG/JPEG są dozwolone",
      };
    },
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
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle>Dodaj zdjęcia</DialogTitle>
          <DialogDescription>
            Przeciągnij i upuść pliki JPEG lub kliknij, aby wybrać (max 100 plików, max 50MB każdy)
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-2">
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
