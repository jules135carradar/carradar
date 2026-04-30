import { supabase } from "@/lib/supabase";

const sourceCouleur: Record<string, string> = {
  LeBonCoin: "bg-orange-100 text-orange-700",
  AutoScout24: "bg-blue-100 text-blue-700",
  "La Centrale": "bg-green-100 text-green-700",
  Autosphere: "bg-purple-100 text-purple-700",
};

export default async function Home() {
  const { data: annonces, error } = await supabase
    .from("annonces")
    .select("*")
    .order("created_at", { ascending: false })
    .range(0, 4999);

  if (error) {
    console.error("Erreur Supabase:", error.message);
  }

  const liste = annonces ?? [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🚗</span>
            <span className="text-xl font-bold text-gray-900">CarRadar</span>
          </div>
          <nav className="flex items-center gap-4">
            <a href="#" className="text-gray-600 hover:text-gray-900 text-sm">Recherche</a>
            <a href="#" className="text-gray-600 hover:text-gray-900 text-sm">Mes alertes</a>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
              Connexion
            </button>
          </nav>
        </div>
      </header>

      {/* Hero / Barre de recherche */}
      <section className="bg-blue-600 py-12 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            Toutes les annonces voitures au même endroit
          </h1>
          <p className="text-blue-100 mb-8">
            On scrape LeBonCoin, AutoScout24 et La Centrale pour toi
          </p>
          <div className="bg-white rounded-xl p-4 flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Marque, modèle... ex: Peugeot 308"
              className="flex-1 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Budget max (€)"
              className="w-full sm:w-40 border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700">
              Rechercher
            </button>
          </div>
        </div>
      </section>

      {/* Filtres */}
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-wrap gap-3 items-center">
        <span className="text-gray-500 text-sm font-medium">Filtrer par :</span>
        {["LeBonCoin", "AutoScout24", "La Centrale"].map((source) => (
          <button
            key={source}
            className="border border-gray-200 bg-white px-4 py-2 rounded-full text-sm hover:border-blue-500 hover:text-blue-600"
          >
            {source}
          </button>
        ))}
        <button className="border border-gray-200 bg-white px-4 py-2 rounded-full text-sm hover:border-blue-500 hover:text-blue-600">
          France
        </button>
        <button className="border border-gray-200 bg-white px-4 py-2 rounded-full text-sm hover:border-blue-500 hover:text-blue-600">
          Belgique
        </button>
      </div>

      {/* Grille d annonces */}
      <main className="max-w-6xl mx-auto px-4 pb-12">
        <p className="text-gray-500 text-sm mb-4">{liste.length} annonces trouvées</p>

        {liste.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-lg">Aucune annonce pour l'instant.</p>
            <p className="text-sm mt-2">Le scraper va bientôt alimenter cette page automatiquement.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {liste.map((annonce: any) => (
              <a
                key={annonce.id}
                href={`/annonces/${annonce.id}`}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
              >
                <div className="relative">
                  <img
                    src={annonce.image}
                    alt={annonce.titre}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span className={`absolute top-3 left-3 text-xs font-semibold px-2 py-1 rounded-full ${sourceCouleur[annonce.source] ?? "bg-gray-100 text-gray-700"}`}>
                    {annonce.source}
                  </span>
                </div>
                <div className="p-4">
                  <h2 className="font-semibold text-gray-900 mb-1">{annonce.titre}</h2>
                  <p className="text-2xl font-bold text-blue-600 mb-3">
                    {annonce.prix?.toLocaleString("fr-FR")} €
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>📅 {annonce.annee}</span>
                    <span>🛣 {annonce.km?.toLocaleString("fr-FR")} km</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-2">📍 {annonce.lieu}</p>
                </div>
              </a>
            ))}
          </div>
        )}
      </main>

      {/* Bandeau freemium */}
      <section className="bg-blue-50 border-t border-blue-100 py-12 px-4 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Ne ratez plus aucune bonne affaire</h2>
        <p className="text-gray-500 mb-6">Créez une alerte et soyez notifié dès qu'une annonce correspond à vos critères</p>
        <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-700 text-lg">
          Créer une alerte gratuite
        </button>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 py-6 px-4 text-center text-sm text-gray-400">
        © 2026 CarRadar — Agrégateur d'annonces voitures
      </footer>
    </div>
  );
}
