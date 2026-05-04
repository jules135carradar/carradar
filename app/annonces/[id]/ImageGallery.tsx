"use client";
import { useState } from "react";

function grandUrl(url: string) {
  // AutoScout24 : remplace le thumbnail par la version haute résolution
  if (url.includes("/250x188.webp")) return url.replace("/250x188.webp", "/800x600.webp");
  if (url.includes("/350x263.webp")) return url.replace("/350x263.webp", "/800x600.webp");
  return url;
}

export default function ImageGallery({ photos, titre }: { photos: string[]; titre: string }) {
  const [current, setCurrent] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (photos.length === 0) return null;

  const prev = () => setCurrent((i) => (i - 1 + photos.length) % photos.length);
  const next = () => setCurrent((i) => (i + 1) % photos.length);

  return (
    <>
      {/* Galerie principale */}
      <div className="relative mb-8 select-none">
        <img
          src={photos[current]}
          alt={`${titre} photo ${current + 1}`}
          className="w-full h-72 object-cover rounded-xl cursor-zoom-in"
          onClick={() => setLightbox(true)}
        />

        {/* Flèche gauche */}
        {photos.length > 1 && (
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white rounded-full w-10 h-10 flex items-center justify-center text-2xl transition-colors"
          >
            ‹
          </button>
        )}

        {/* Flèche droite */}
        {photos.length > 1 && (
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white rounded-full w-10 h-10 flex items-center justify-center text-2xl transition-colors"
          >
            ›
          </button>
        )}

        {/* Compteur + indice clic */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-between items-end px-3">
          <span className="text-white text-xs bg-black/50 px-2 py-1 rounded-full">
            🔍 Cliquer pour agrandir
          </span>
          <span className="text-white text-xs bg-black/50 px-2 py-1 rounded-full">
            {current + 1} / {photos.length}
          </span>
        </div>
      </div>

      {/* Lightbox (plein écran) */}
      {lightbox && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={() => setLightbox(false)}
        >
          <img
            key={current}
            src={grandUrl(photos[current])}
            alt={`${titre} photo ${current + 1}`}
            className="max-h-[90vh] max-w-[90vw] w-auto h-auto object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
            onError={(e) => { (e.target as HTMLImageElement).src = photos[current]; }}
          />

          {/* Fermer */}
          <button
            onClick={() => setLightbox(false)}
            className="absolute top-4 right-4 text-white text-4xl bg-black/50 w-12 h-12 rounded-full flex items-center justify-center hover:bg-black/75"
          >
            ×
          </button>

          {/* Compteur lightbox */}
          <div className="absolute bottom-4 text-white text-sm">
            {current + 1} / {photos.length}
          </div>

          {/* Flèches lightbox */}
          {photos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prev(); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full w-14 h-14 flex items-center justify-center text-3xl transition-colors"
              >
                ‹
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); next(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white rounded-full w-14 h-14 flex items-center justify-center text-3xl transition-colors"
              >
                ›
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}
