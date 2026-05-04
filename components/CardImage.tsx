"use client";
import { useState } from "react";

export default function CardImage({ images, titre }: { images: string[]; titre: string }) {
  const [current, setCurrent] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  if (images.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-zinc-600 text-4xl">🚗</div>
    );
  }

  function goPrev(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setCurrent((i) => (i - 1 + images.length) % images.length);
  }

  function goNext(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setCurrent((i) => (i + 1) % images.length);
  }

  return (
    <div
      className="relative w-full h-full"
      onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchStartX === null) return;
        const diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 40) {
          e.preventDefault();
          e.stopPropagation();
          if (diff > 0) setCurrent((i) => (i + 1) % images.length);
          else setCurrent((i) => (i - 1 + images.length) % images.length);
        }
        setTouchStartX(null);
      }}
    >
      <img
        src={images[current]}
        alt={`${titre} photo ${current + 1}`}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />

      {images.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-1.5 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white rounded-full w-7 h-7 flex items-center justify-center text-xl transition-colors opacity-0 group-hover:opacity-100"
          >
            ‹
          </button>
          <button
            onClick={goNext}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white rounded-full w-7 h-7 flex items-center justify-center text-xl transition-colors opacity-0 group-hover:opacity-100"
          >
            ›
          </button>
          {/* Points indicateurs — toujours visibles */}
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1 pointer-events-none">
            {images.slice(0, 10).map((_, i) => (
              <span
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === current ? "bg-white" : "bg-white/40"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
