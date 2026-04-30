import { supabase } from "@/lib/supabase";

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

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const filters = await searchParams;

  let query = supabase.from("annonces").select("*");

  if (filters.q)        query = query.ilike("titre", `%${filters.q}%`);
  if (filters.prixMax)  query = query.lte("prix", parseInt(filters.prixMax));
  if (filters.kmMin)    query = query.gte("km", parseInt(filters.kmMin));
  if (filters.kmMax)    query = query.lte("km", parseInt(filters.kmMax));
  if (filters.anneeMin) query = query.gte("annee", parseInt(filters.anneeMin));
  if (filters.anneeMax) query = query.lte("annee", parseInt(filters.anneeMax));
  if (filters.carburant) query = query.ilike("carburant", `%${filters.carburant}%`);
  if (filters.boite === "Automatique") query = query.ilike("boite", "%automatique%");
  else if (filters.boite) query = query.ilike("boite", `%${filters.boite}%`);
  if (filters.source)   query = query.eq("source", filters.source);

  const { data: annonces, error } = await query
    .order("created_at", { ascending: false })
    .range(0, 4999);

  if (error) console.error("Erreur Supabase:", error.message);

  const liste = annonces ?? [];
  const hasFilters = Object.values(filters).some((v) => v);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">

      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 group">
            <RadarLogo size={26} />
            <span className="text-lg font-bold tracking-tight text-white">
              Car<span className="text-blue-400">Radar</span>
            </span>
          </a>
          <button className="text-sm font-medium px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors">
            Connexion
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-zinc-900 to-zinc-950 pt-12 pb-10 px-4">
        <div className="max-w-3xl mx-auto text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
            Toutes les annonces voitures,<br />
            <span className="text-blue-400">au même endroit.</span>
          </h1>
          <p className="text-zinc-400 text-base">
            AutoScout24, Autosphere, Aramisauto — agrégés et mis à jour chaque nuit.
          </p>
        </div>

        {/* Formulaire */}
        <form method="GET" action="/" className="max-w-5xl mx-auto bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
          {/* Ligne 1 */}
          <div className="flex flex-col sm:flex-row gap-3 mb-3">
            <input
              type="text"
              name="q"
              defaultValue={filters.q ?? ""}
              placeholder="Marque, modèle… ex: Peugeot 308"
              className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              name="prixMax"
              defaultValue={filters.prixMax ?? ""}
              placeholder="Budget max (€)"
              className="w-full sm:w-44 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium transition-colors"
            >
              Rechercher
            </button>
          </div>

          {/* Ligne 2 : filtres avancés */}
          <div className="flex flex-wrap gap-2 items-center">
            {[
              { name: "anneeMin", placeholder: "Année min", w: "w-28" },
              { name: "anneeMax", placeholder: "Année max", w: "w-28" },
              { name: "kmMin",    placeholder: "KM min",    w: "w-32" },
              { name: "kmMax",    placeholder: "KM max",    w: "w-32" },
            ].map(({ name, placeholder, w }) => (
              <input
                key={name}
                type="number"
                name={name}
                defaultValue={(filters as any)[name] ?? ""}
                placeholder={placeholder}
                className={`${w} bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            ))}

            <select
              name="carburant"
              defaultValue={filters.carburant ?? ""}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">⛽ Carburant</option>
              <option value="Essence">Essence</option>
              <option value="Diesel">Diesel</option>
              <option value="Hybride">Hybride</option>
              <option value="Électrique">Électrique</option>
              <option value="Gpl">GPL</option>
            </select>

            <select
              name="boite"
              defaultValue={filters.boite ?? ""}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">⚙️ Boîte</option>
              <option value="Manuelle">Manuelle</option>
              <option value="Automatique">Automatique</option>
            </select>

            <select
              name="source"
              defaultValue={filters.source ?? ""}
              className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">🌐 Toutes les sources</option>
              <option value="AutoScout24">AutoScout24</option>
              <option value="Autosphere">Autosphere</option>
              <option value="Aramisauto">Aramisauto</option>
              <option value="LeBonCoin">LeBonCoin</option>
              <option value="La Centrale">La Centrale</option>
              <option value="ParuVendu">ParuVendu</option>
            </select>

            {hasFilters && (
              <a href="/" className="text-sm text-zinc-500 hover:text-red-400 transition-colors ml-1">
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
                <div className="relative aspect-[16/10] bg-zinc-800 overflow-hidden">
                  {annonce.image ? (
                    <img
                      src={annonce.image}
                      alt={annonce.titre}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600 text-4xl">🚗</div>
                  )}
                  <span className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full ${sourceCouleur[annonce.source] ?? "bg-zinc-500/15 text-zinc-300 ring-1 ring-zinc-500/30"}`}>
                    {annonce.source}
                  </span>
                </div>

                {/* Infos */}
                <div className="p-4">
                  <h2 className="font-semibold text-zinc-100 mb-1 truncate text-sm">{annonce.titre}</h2>
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
