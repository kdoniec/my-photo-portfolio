import type { PublicPhotoDTO } from "../../types";

interface PhotoCardProps {
  photo: PublicPhotoDTO;
  onClick: () => void;
}

export default function PhotoCard({ photo, onClick }: PhotoCardProps) {
  const { title, thumbnail_url } = photo;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <figure className="group overflow-hidden rounded-lg">
      <button
        type="button"
        onClick={onClick}
        onKeyDown={handleKeyDown}
        onContextMenu={handleContextMenu}
        className="w-full cursor-pointer border-0 bg-transparent p-0"
        aria-label={title || "Zdjęcie z galerii"}
      >
        <img
          src={thumbnail_url}
          alt=""
          loading="lazy"
          onDragStart={handleDragStart}
          className="w-full h-auto object-cover transition-all duration-300 group-hover:brightness-110 group-hover:scale-105"
        />
      </button>
      {title && <figcaption className="sr-only">{title}</figcaption>}
    </figure>
  );
}
