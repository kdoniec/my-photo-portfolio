import { useState } from "react";
import imageCompression from "browser-image-compression";
import type { BatchPhotoUploadResponseDTO } from "@/types";
import type { PhotoUploadFile, PhotoUploadSettings } from "@/components/admin/types";
import { useStats } from "@/components/admin/context/StatsContext";

const MAX_FILES_PER_BATCH = 20;
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export function usePhotoUpload(currentCount: number, limit: number) {
  const [files, setFiles] = useState<PhotoUploadFile[]>([]);
  const [settings, setSettings] = useState<PhotoUploadSettings>({
    category_id: null,
    is_published: false,
  });
  const [isUploading, setIsUploading] = useState(false);
  const { refreshStats } = useStats();

  const addFiles = (newFiles: File[]) => {
    // Validate and filter files
    const validFiles = newFiles
      .filter((f) => f.type === "image/jpeg")
      .filter((f) => f.size <= MAX_FILE_SIZE_BYTES)
      .slice(0, MAX_FILES_PER_BATCH - files.length) // Max 20 files per batch
      .slice(0, limit - currentCount - files.length); // Don't exceed global limit

    const uploadFiles: PhotoUploadFile[] = validFiles.map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: "",
      status: "pending",
      progress: 0,
    }));

    // Generate previews asynchronously
    uploadFiles.forEach((uf) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFiles((prev) => prev.map((f) => (f.id === uf.id ? { ...f, preview: e.target?.result as string } : f)));
      };
      reader.readAsDataURL(uf.file);
    });

    setFiles((prev) => [...prev, ...uploadFiles]);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const clearFiles = () => {
    setFiles([]);
  };

  const updateFileStatus = (id: string, updates: Partial<PhotoUploadFile>) => {
    setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const createThumbnail = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 400,
      useWebWorker: true,
      fileType: "image/jpeg",
    };

    try {
      const thumbnail = await imageCompression(file, options);
      return thumbnail;
    } catch (err) {
      console.error("Thumbnail creation error:", err);
      throw new Error("Nie udało się utworzyć miniatury");
    }
  };

  const createPreview = async (file: File): Promise<File> => {
    const options = {
      maxSizeMB: 2,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
      fileType: "image/jpeg",
    };

    try {
      const preview = await imageCompression(file, options);
      return preview;
    } catch (err) {
      console.error("Preview creation error:", err);
      throw new Error("Nie udało się utworzyć podglądu");
    }
  };

  const getImageDimensions = async (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
        URL.revokeObjectURL(img.src);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const uploadSinglePhoto = async (uploadFile: PhotoUploadFile): Promise<void> => {
    try {
      // Validation
      updateFileStatus(uploadFile.id, { status: "validating", progress: 5 });

      // Get original dimensions
      const dimensions = await getImageDimensions(uploadFile.file);

      // Create thumbnail and preview (10-60% progress)
      updateFileStatus(uploadFile.id, { status: "compressing", progress: 10 });

      const [thumbnail, preview] = await Promise.all([
        createThumbnail(uploadFile.file),
        createPreview(uploadFile.file),
      ]);

      updateFileStatus(uploadFile.id, { progress: 60 });

      // Prepare form data
      const formData = new FormData();
      formData.append("thumbnail", thumbnail);
      formData.append("preview", preview);
      formData.append("original_width", dimensions.width.toString());
      formData.append("original_height", dimensions.height.toString());
      formData.append("file_size_bytes", uploadFile.file.size.toString());

      // Generate title from filename (remove extension)
      const title = uploadFile.file.name.replace(/\.[^/.]+$/, "");
      formData.append("title", title);

      if (settings.category_id) {
        formData.append("category_id", settings.category_id);
      }
      formData.append("is_published", settings.is_published.toString());

      // Upload (50-100% progress)
      updateFileStatus(uploadFile.id, { status: "uploading", progress: 60 });

      const response = await fetch("/api/photos", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Nie udało się przesłać zdjęcia");
      }

      updateFileStatus(uploadFile.id, { status: "success", progress: 100 });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Nieznany błąd";
      updateFileStatus(uploadFile.id, {
        status: "error",
        error: errorMessage,
        progress: 0,
      });
      throw err;
    }
  };

  const processUpload = async (): Promise<BatchPhotoUploadResponseDTO> => {
    setIsUploading(true);

    const pendingFiles = files.filter((f) => f.status === "pending" || f.status === "error");
    const results: BatchPhotoUploadResponseDTO = {
      uploaded: [],
      failed: [],
      summary: {
        total: pendingFiles.length,
        successful: 0,
        failed: 0,
      },
    };

    // Sequential upload
    for (const file of pendingFiles) {
      try {
        await uploadSinglePhoto(file);
        results.summary.successful++;
      } catch {
        results.summary.failed++;
      }
    }

    await refreshStats();
    setIsUploading(false);

    return results;
  };

  const retryFile = async (id: string) => {
    const file = files.find((f) => f.id === id);
    if (!file) return;

    updateFileStatus(id, { status: "pending", progress: 0, error: undefined });

    try {
      await uploadSinglePhoto(file);
    } catch (err) {
      // Error already handled in uploadSinglePhoto
      console.error("Retry failed:", err);
    }
  };

  const canUpload = files.length > 0 && files.some((f) => f.status === "pending" || f.status === "error");

  return {
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
  };
}
