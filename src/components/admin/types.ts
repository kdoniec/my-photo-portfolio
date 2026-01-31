// Photo Upload Types

export type UploadStatus = "pending" | "validating" | "compressing" | "uploading" | "success" | "error";

export interface PhotoUploadFile {
  id: string; // Unique ID for React key
  file: File; // Original file
  preview: string; // Data URL for preview
  status: UploadStatus;
  progress: number; // 0-100 (0-50 compression, 50-100 upload)
  error?: string; // Error message
}

export interface PhotoUploadSettings {
  category_id: string | null;
  is_published: boolean;
}
