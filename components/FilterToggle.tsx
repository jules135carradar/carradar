"use client";
import { useState } from "react";

export default function FilterToggle({
  children,
  hasActiveFilters,
}: {
  children: React.ReactNode;
  hasActiveFilters: boolean;
}) {
  const [open, setOpen] = useState(hasActiveFilters);

  return (
    <>
      {/* Bouton visible uniquement sur mobile */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`sm:hidden flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-sm border transition-all ${
          hasActiveFilters
            ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
            : "bg-zinc-900 border-zinc-700 text-zinc-400"
        }`}
      >
        <span>⚙️ Filtres{hasActiveFilters ? " (actifs)" : ""}</span>
        <span className="text-zinc-500 text-xs">{open ? "▲" : "▼"}</span>
      </button>

      {/* Filtres : toujours visibles sur desktop, toggle sur mobile */}
      <div className={`flex flex-wrap gap-2 items-center ${open ? "flex" : "hidden sm:flex"}`}>
        {children}
      </div>
    </>
  );
}
