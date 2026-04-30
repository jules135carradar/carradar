import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";
import SourceFilter from "@/components/SourceFilter";

const sourceCouleur: Record<string, string> = {
  LeBonCoin:    "bg-orange-500/15 text-orange-300 ring-1 ring-orange-500/30",
  AutoScout24:  "bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/30",
  "La Centrale":"bg-green-500/15 text-green-300 ring-1 ring-green-500/30",
  Autosphere:   "bg-purple-500/15 text-purple-300 ring-1 ring-purple-500/30",
  Aramisauto:   "bg-red-500/15 text-red-300 ring-1 ring-red-500/30",
  ParuVendu:    "bg-yellow-500/15 text-yellow-300 ring-1 ring-yellow-500/30",
  AutoUncle:    "bg-zinc-500/15 text-zinc-300 ring-1 ring-zinc-500/30",
};

function RadarLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="#3b82f6" strokeWidth="1.2" opacity="0.25" />
      <circle cx="12" cy="12" r="6"  stroke="#3b82f6" strokeWidth="1.2" opacity="0.5"  />
      <circle cx="12" cy="12" r="2"  fill="#3b82f6" />
      <line x1="12" y1="12" x2="19" y2="5" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

const SOURCES = ["AutoScout24", "Autosphere", "Aramisauto", "LeBonCoin", "La Centrale", "ParuVendu"];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  const filters = await searchParams;

  // Sources sélectionnées (multi-valeurs)
  const rawSources = filters.source;
  const selectedSources: string[] = Array.isArray(rawSources)
    ? rawSources
    : rawSources ? [rawSources] : [];

  let query = supabase.from("annonces").select("*");

  if (filters.q)        query = query.ilike("titre", `%${filters.q as string}%`);
  if (filters.prixMax)  query = query.lte("prix", parseInt(filters.prixMax as string));
  if (filters.kmMin)    query = query.gte("km", parseInt(filters.kmMin as string));
  if (filters.kmMax)    query = query.lte("km", parseInt(filters.kmMax as string));
  if (filters.anneeMin) query = query.gte("annee", parseInt(filters.anneeMin as string));
  if (filters.anneeMax) query = query.lte("annee", parseInt(filters.anneeMax as string));
  if (filters.carburant) query = query.ilike("carburant", `%${filters.carburant as string}%`);
  if (filters.boite === "Automatique") query = query.ilike("boite", "%automatique%");
  else if (filters.boite) query = query.ilike("boite", `%${filters.boite as string}%`);
  if (selectedSources.length > 0) query = query.in("source", selectedSources);

  const { data: annonces, error } = await query
    .order("prix", { ascending: true, nullsFirst: false })
    .range(0, 4999);

  if (error) console.error("Erreur Supabase:", error.message);

  const liste = annonces ?? [];
  const hasFilters = Object.values(filters).some((v) => v && v.length > 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">

      <Header />

      {/* Hero — affiché seulement sans filtres actifs */}
      {!hasFilters && (
        <section className="relative px-4 pt-20 pb-16 text-center overflow-hidden">
          {/* Glow décoratif */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[500px] h-[300px] bg-blue-600/10 rounded-full blur-3xl" />
          </div>

          <div className="relative max-w-2xl mx-auto">
            {/* Logo grand */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <RadarLogo size={48} />
              <span className="text-5xl font-bold tracking-tight text-white">
                Car<span className="text-blue-400">Radar</span>
              </span>
            </div>

            <p className="text-xl text-zinc-300 mb-2 font-medium">
              Toutes les annonces voitures au même endroit.
            </p>
            <p className="text-zinc-500 text-sm mb-10">
              AutoScout24, Autosphere, Aramisauto — agrégés et mis à jour chaque nuit automatiquement.
            </p>

            {/* Stats */}
            <div className="flex items-center justify-center gap-6 text-sm text-zinc-400 mb-10">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block" />
                {liste.length.toLocaleString("fr-FR")}+ annonces
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 inline-block" />
                3 sources
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
                Mis à jour chaque nuit
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Barre de recherche */}
      <section className="border-b border-zinc-800 bg-zinc-950 px-4 py-4">
        <form method="GET" action="/" className="max-w-6xl mx-auto space-y-3">

          {/* Ligne 1 : recherche principale */}
          <div className="flex gap-2">
            <input
              type="text"
              name="q"
              defaultValue={filters.q ?? ""}
              placeholder="Marque, modèle… ex: Peugeot 308"
              className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            >
              Rechercher
            </button>
          </div>

          {/* Ligne 2 : filtres groupés */}
          <div className="flex flex-wrap gap-2 items-center">

            {/* Budget */}
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm">
              <span className="text-zinc-500 text-xs whitespace-nowrap">💶 Budget max</span>
              <input
                type="number"
                name="prixMax"
                defaultValue={filters.prixMax ?? ""}
                placeholder="€"
                className="w-20 bg-transparent text-white placeholder-zinc-600 focus:outline-none text-right"
              />
            </div>

            {/* Séparateur */}
            <div className="w-px h-6 bg-zinc-800" />

            {/* Année */}
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm">
              <span className="text-zinc-500 text-xs">📅 Année</span>
              <input type="number" name="anneeMin" defaultValue={(filters as any).anneeMin ?? ""} placeholder="min" className="w-14 bg-transparent text-white placeholder-zinc-600 focus:outline-none text-center" />
              <span className="text-zinc-600">—</span>
              <input type="number" name="anneeMax" defaultValue={(filters as any).anneeMax ?? ""} placeholder="max" className="w-14 bg-transparent text-white placeholder-zinc-600 focus:outline-none text-center" />
            </div>

            {/* KM */}
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm">
              <span className="text-zinc-500 text-xs">🛣 KM</span>
              <input type="number" name="kmMin" defaultValue={(filters as any).kmMin ?? ""} placeholder="min" className="w-16 bg-transparent text-white placeholder-zinc-600 focus:outline-none text-center" />
              <span className="text-zinc-600">—</span>
              <input type="number" name="kmMax" defaultValue={(filters as any).kmMax ?? ""} placeholder="max" className="w-16 bg-transparent text-white placeholder-zinc-600 focus:outline-none text-center" />
            </div>

            {/* Séparateur */}
            <div className="w-px h-6 bg-zinc-800" />

            {/* Carburant */}
            <select
              name="carburant"
              defaultValue={filters.carburant ?? ""}
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">⛽ Carburant</option>
              <option value="Essence">⛽ Essence</option>
              <option value="Diesel">🛢 Diesel</option>
              <option value="Hybride">🔋 Hybride</option>
              <option value="Électrique">⚡ Électrique</option>
              <option value="Gpl">🟢 GPL</option>
            </select>

            {/* Boîte */}
            <select
              name="boite"
              defaultValue={filters.boite ?? ""}
              className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">⚙️ Boîte</option>
              <option value="Manuelle">🕹 Manuelle</option>
              <option value="Automatique">🤖 Automatique</option>
            </select>

            {/* Sources */}
            <SourceFilter initialSelected={selectedSources} />

            {hasFilters && (
              <a href="/" className="text-xs text-zinc-600 hover:text-red-400 transition-colors ml-1">
                ✕ Effacer
              </a>
            )}
          </div>
        </form>
      </section>

      {/* Grille */}
      <main className="max-w-6xl mx-auto px-4 py-8 pb-16">
        <p className="text-zinc-500 text-sm mb-5">{liste.length} annonces trouvées</p>

        {liste.length === 0 ? (
          <div className="text-center py-24 text-zinc-600">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-lg text-zinc-400">Aucune annonce pour ces critères.</p>
            <a href="/" className="text-blue-400 hover:underline text-sm mt-3 inline-block">
              Effacer les filtres
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {liste.map((annonce: any) => (
              <a
                key={annonce.id}
                href={`/annonces/${annonce.id}`}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-600 hover:shadow-lg hover:shadow-black/40 transition-all group"
              >
                {/* Image */}
                <div className="aspect-[16/10] bg-zinc-800 overflow-hidden">
                  {annonce.image ? (
                    <img
                      src={annonce.image}
                      alt={annonce.titre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600 text-4xl">🚗</div>
                  )}
                </div>

                {/* Infos */}
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <h2 className="font-semibold text-zinc-100 truncate text-sm">{annonce.titre}</h2>
                    <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-md ${sourceCouleur[annonce.source] ?? "bg-zinc-500/15 text-zinc-300 ring-1 ring-zinc-500/30"}`}>
                      {annonce.source}
                    </span>
                  </div>
                  <p className="text-2xl font-bold text-blue-400 mb-3">
                    {annonce.prix ? annonce.prix.toLocaleString("fr-FR") + " €" : "Prix non renseigné"}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-zinc-500 flex-wrap">
                    {annonce.annee && <span>📅 {annonce.annee}</span>}
                    {annonce.km    && <span>🛣 {annonce.km.toLocaleString("fr-FR")} km</span>}
                    {annonce.carburant && <span>⛽ {annonce.carburant}</span>}
                    {annonce.boite && <span>⚙️ {annonce.boite}</span>}
                  </div>
                  {annonce.lieu && (
                    <p className="text-xs text-zinc-600 mt-2">📍 {annonce.lieu}</p>
                  )}
                </div>
              </a>
            ))}
          </div>
        )}
      </main>

      {/* Bandeau alerte */}
      <section className="border-t border-zinc-800 bg-zinc-900 py-14 px-4 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Ne ratez plus aucune bonne affaire</h2>
        <p className="text-zinc-500 mb-6">Créez une alerte et soyez notifié dès qu'une annonce correspond à vos critères</p>
        <button className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-medium text-base transition-colors">
          Créer une alerte gratuite
        </button>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-6 px-4 text-center text-sm text-zinc-600">
        © 2026 CarRadar — Agrégateur d'annonces voitures
      </footer>
    </div>
  );
}
