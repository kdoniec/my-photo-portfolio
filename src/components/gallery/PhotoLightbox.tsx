import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useSwipeable } from "react-swipeable";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBodyScrollLock } from "../../hooks/useBodyScrollLock";
import type { PublicPhotoDTO } from "../../types";

interface PhotoLightboxProps {
  photos: PublicPhotoDTO[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

export default function PhotoLightbox({ photos, currentIndex, onClose, onNavigate }: PhotoLightboxProps) {
  const currentPhoto = photos[currentIndex];

  // Lock body scroll when lightbox is open
  useBodyScrollLock(true);

  // Navigation handlers
  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
    }
  }, [currentIndex, onNavigate]);

  const handleNext = useCallback(() => {
    if (currentIndex < photos.length - 1) {
      onNavigate(currentIndex + 1);
    }
  }, [currentIndex, photos.length, onNavigate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        handlePrevious();
      } else if (e.key === "ArrowRight") {
        handleNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleNext, handlePrevious, onClose]);

  // Swipe handlers for mobile
  const swipeHandlers = useSwipeable({
    onSwipedLeft: handleNext,
    onSwipedRight: handlePrevious,
    trackMouse: false,
  });

  if (!currentPhoto) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Podgląd zdjęcia"
    >
      {/* Close Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 text-white hover:bg-white/10"
        aria-label="Zamknij podgląd"
      >
        <X className="h-6 w-6" />
      </Button>

      {/* Counter */}
      <div className="absolute top-4 left-4 z-10 text-white text-sm font-medium bg-black/50 px-3 py-1.5 rounded-full">
        {currentIndex + 1} z {photos.length}
      </div>

      {/* Main Image Container */}
      <div {...swipeHandlers} className="flex items-center justify-center h-full w-full p-4 md:p-8">
        <img
          src={currentPhoto.preview_url}
          alt={currentPhoto.title || "Zdjęcie z galerii"}
          className="max-w-full max-h-full object-contain"
        />
      </div>

      {/* Navigation Buttons */}
      {currentIndex > 0 && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 h-12 w-12"
          aria-label="Poprzednie zdjęcie"
        >
          <ChevronLeft className="h-8 w-8" />
        </Button>
      )}

      {currentIndex < photos.length - 1 && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 h-12 w-12"
          aria-label="Następne zdjęcie"
        >
          <ChevronRight className="h-8 w-8" />
        </Button>
      )}
    </div>,
    document.body
  );
}
