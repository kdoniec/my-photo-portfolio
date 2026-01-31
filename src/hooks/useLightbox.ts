import { useState, useCallback } from "react";
import type { PublicPhotoDTO } from "../types";

interface UseLightboxOptions {
  photos: PublicPhotoDTO[];
}

interface UseLightboxReturn {
  isOpen: boolean;
  currentIndex: number;
  currentPhoto: PublicPhotoDTO | null;
  open: (index: number) => void;
  close: () => void;
  next: () => void;
  previous: () => void;
  goTo: (index: number) => void;
}

export function useLightbox({ photos }: UseLightboxOptions): UseLightboxReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const open = useCallback((index: number) => {
    setCurrentIndex(index);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const next = useCallback(() => {
    if (currentIndex < photos.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, photos.length]);

  const previous = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const goTo = useCallback(
    (index: number) => {
      if (index >= 0 && index < photos.length) {
        setCurrentIndex(index);
      }
    },
    [photos.length]
  );

  const currentPhoto = isOpen && photos[currentIndex] ? photos[currentIndex] : null;

  return {
    isOpen,
    currentIndex,
    currentPhoto,
    open,
    close,
    next,
    previous,
    goTo,
  };
}
