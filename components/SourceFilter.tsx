"use client";

import { useState, useRef, useEffect } from "react";

const SOURCES = ["AutoScout24", "Autosphere", "Aramisauto", "LeBonCoin", "La Centrale", "ParuVendu"];

export default function SourceFilter({ initialSelected }: { initialSelected: string[] }) {
  const [selected, setSelected] = useState<string[]>(initialSelected);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fermer si clic en dehors
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function toggle(src: string) {
    setSelected((prev) =>
      prev.includes(src) ? prev.filter((s) => s !== src) : [...prev, src]
    );
  }

  return (
    <div className="relative" ref={ref}>
      {/* Inputs cachés pour le formulaire */}
      {selected.map((src) => (
        <input key={src} type="hidden" name="source" value={src} />
      ))}

      {/* Bouton */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-all ${
          selected.length > 0
            ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
            : "bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
        }`}
      >
        🌐 Sites
        {selected.length > 0 && (
          <span className="bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded-full leading-none">
            {selected.length}
          </span>
        )}
        <span className="text-zinc-600 text-xs">{open ? "▲" : "▼"}</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 mt-1 bg-zinc-900 border border-zinc-700 rounded-xl p-2 flex flex-col gap-1 z-30 min-w-[190px] shadow-xl shadow-black/60">
          {SOURCES.map((src) => {
            const active = selected.includes(src);
            return (
              <button
                key={src}
                type="button"
                onClick={() => toggle(src)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left w-full transition-all ${
                  active ? "bg-blue-600 text-white" : "text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                <span className={`w-4 h-4 rounded border flex items-center justify-center text-xs shrink-0 ${
                  active ? "bg-white border-white text-blue-600 font-bold" : "border-zinc-600"
                }`}>
                  {active ? "✓" : ""}
                </span>
                {src}
              </button>
            );
          })}

          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => setSelected([])}
              className="mt-1 text-xs text-zinc-600 hover:text-red-400 px-3 py-1 text-left transition-colors"
            >
              ✕ Tout effacer
            </button>
          )}
        </div>
      )}
    </div>
  );
}
