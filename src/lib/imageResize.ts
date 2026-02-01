/**
 * High-quality image resizing using pica (Lanczos3 algorithm)
 * This module is browser-only - pica uses Canvas and Web Workers
 *
 * @see https://github.com/nodeca/pica
 */

import Pica from "pica";

// Singleton pica instance (created on first use in browser)
let picaInstance: ReturnType<typeof Pica> | null = null;

/**
 * Get or create pica instance
 * Only call this function in browser context
 */
function getPicaInstance() {
  if (typeof window === "undefined") {
    throw new Error("pica can only be used in browser environment");
  }

  if (!picaInstance) {
    // Use only JS - Web Workers can cause issues in Vite/Astro bundling
    picaInstance = Pica({
      features: ["js"],
    });
  }

  return picaInstance;
}

// Maximum canvas dimension (browser limit is typically ~16384, but we use lower for safety)
const MAX_CANVAS_DIMENSION = 8192;

/**
 * Load an image file into an HTMLImageElement
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      console.error("Image load error:", e);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

/**
 * Scale down dimensions if they exceed canvas limits
 */
function clampToCanvasLimits(width: number, height: number): { width: number; height: number; scale: number } {
  let scale = 1;

  if (width > MAX_CANVAS_DIMENSION || height > MAX_CANVAS_DIMENSION) {
    scale = Math.min(MAX_CANVAS_DIMENSION / width, MAX_CANVAS_DIMENSION / height);
  }

  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
    scale,
  };
}

/**
 * Calculate new dimensions maintaining aspect ratio
 */
function calculateDimensions(width: number, height: number, maxSize: number): { width: number; height: number } {
  if (width <= maxSize && height <= maxSize) {
    return { width, height };
  }

  if (width > height) {
    return {
      width: maxSize,
      height: Math.round((height * maxSize) / width),
    };
  } else {
    return {
      width: Math.round((width * maxSize) / height),
      height: maxSize,
    };
  }
}

export interface ResizeOptions {
  /** Maximum width or height in pixels */
  maxSize: number;
  /** JPEG quality 0-1 (default: 0.85) */
  quality?: number;
  /** Unsharp mask amount 0-500 (default: 80) - higher = more sharpening */
  unsharpAmount?: number;
  /** Unsharp mask radius 0.5-2.0 (default: 0.6) */
  unsharpRadius?: number;
  /** Unsharp mask threshold 0-255 (default: 2) - higher = less noise sharpening */
  unsharpThreshold?: number;
}

/**
 * Resize an image using pica with high-quality Lanczos3 algorithm
 *
 * Features:
 * - Lanczos3 resampling (better than bilinear)
 * - Unsharp mask to compensate for resize softening
 * - Threshold to avoid sharpening noise/grain
 *
 * @param file - Source image file
 * @param options - Resize options
 * @returns Resized image as File
 */
export async function resizeImage(file: File, options: ResizeOptions): Promise<File> {
  const { maxSize, quality = 0.85, unsharpAmount = 80, unsharpRadius = 0.6, unsharpThreshold = 2 } = options;

  try {
    // Load the image
    const img = await loadImage(file);
    console.log(`Image loaded: ${img.width}x${img.height}`);

    // Clamp source dimensions to canvas limits
    const srcDims = clampToCanvasLimits(img.width, img.height);
    if (srcDims.scale < 1) {
      console.log(`Source image too large, scaling to ${srcDims.width}x${srcDims.height}`);
    }

    // Calculate target dimensions from (potentially scaled) source
    const targetDims = calculateDimensions(srcDims.width, srcDims.height, maxSize);
    console.log(`Target dimensions: ${targetDims.width}x${targetDims.height}`);

    // Skip resize if image is already smaller than target
    if (srcDims.scale === 1 && targetDims.width === img.width && targetDims.height === img.height) {
      return file;
    }

    // Create source canvas with (potentially scaled) original image
    const srcCanvas = document.createElement("canvas");
    srcCanvas.width = srcDims.width;
    srcCanvas.height = srcDims.height;
    const srcCtx = srcCanvas.getContext("2d");
    if (!srcCtx) {
      throw new Error("Failed to get canvas 2d context");
    }
    // Draw image scaled to fit canvas limits
    srcCtx.drawImage(img, 0, 0, srcDims.width, srcDims.height);

    // Create destination canvas with target dimensions
    const destCanvas = document.createElement("canvas");
    destCanvas.width = targetDims.width;
    destCanvas.height = targetDims.height;

    // Get pica instance and resize
    const pica = getPicaInstance();
    console.log("Pica instance obtained, starting resize...");

    await pica.resize(srcCanvas, destCanvas, {
      quality: 3, // Lanczos3 - highest quality
      unsharpAmount,
      unsharpRadius,
      unsharpThreshold,
    });

    console.log("Resize complete, converting to blob...");

    // Convert to blob
    const blob = await pica.toBlob(destCanvas, "image/jpeg", quality);

    console.log(`Blob created: ${blob.size} bytes`);

    // Return as File with original name
    return new File([blob], file.name, { type: "image/jpeg" });
  } catch (error) {
    console.error("resizeImage error:", error);
    throw error;
  }
}

/**
 * Create a thumbnail (400px max dimension)
 */
export async function createThumbnail(file: File): Promise<File> {
  return resizeImage(file, {
    maxSize: 400,
    quality: 0.85,
    unsharpAmount: 80,
    unsharpRadius: 0.6,
    unsharpThreshold: 2,
  });
}

/**
 * Create a preview image (1200px max dimension)
 */
export async function createPreview(file: File): Promise<File> {
  return resizeImage(file, {
    maxSize: 1200,
    quality: 0.9,
    unsharpAmount: 60, // Less sharpening for larger images
    unsharpRadius: 0.5,
    unsharpThreshold: 2,
  });
}
