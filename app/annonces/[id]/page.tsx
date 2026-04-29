import { supabase } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Link from "next/link";
import ImageGallery from "./ImageGallery";

export default async function AnnonceDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: annonce } = await supabase
    .from("annonces")
    .select("*")
    .eq("id", id)
    .single();

  if (!annonce) notFound();

  const { data: similaires } = await supabase
    .from("annonces")
    .select("prix")
    .eq("titre", annonce.titre)
    .not("prix", "is", null);

  const prixMoyen =
    similaires && similaires.length > 1
      ? Math.round(
          similaires.reduce((sum: number, a: any) => sum + a.prix, 0) /
            similaires.length
        )
      : null;

  const diff = prixMoyen !== null && annonce.prix !== null ? annonce.prix - prixMoyen : null;

  const photos: string[] =
    Array.isArray(annonce.images) && annonce.images.length > 0
      ? annonce.images
      : annonce.image
      ? [annonce.image]
      : [];

  const sourceCouleur: Record<string, string> = {
    LeBonCoin: "bg-orange-100 text-orange-700",
    AutoScout24: "bg-blue-100 text-blue-700",
    "La Centrale": "bg-green-100 text-green-700",
  };

  const ficheItems = [
    { icon: "📅", label: "Année", value: annonce.annee?.toString() },
    { icon: "🛣", label: "Kilométrage", value: annonce.km ? `${annonce.km.toLocaleString("fr-FR")} km` : null },
    { icon: "⛽", label: "Carburant", value: annonce.carburant },
    { icon: "⚙️", label: "Boîte de vitesses", value: annonce.boite },
    { icon: "⚡", label: "Puissance", value: annonce.puissance },
    { icon: "📍", label: "Lieu", value: annonce.lieu },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/" className="text-gray-500 hover:text-gray-900 text-sm">
            ← Retour aux annonces
          </Link>
          <span className="text-gray-300">|</span>
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">🚗</span>
            <span className="text-lg font-bold text-gray-900">CarRadar</span>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Titre + badge */}
        <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
          <h1 className="text-2xl font-bold text-gray-900">{annonce.titre}</h1>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${sourceCouleur[annonce.source] ?? "bg-gray-100 text-gray-700"}`}>
            {annonce.source}
          </span>
        </div>

        {/* Sous-titre / description courte */}
        {annonce.description && (
          <p className="text-gray-500 text-sm mb-3">{annonce.description}</p>
        )}

        {/* Prix */}
        <p className="text-4xl font-bold text-blue-600 mb-6">
          {annonce.prix?.toLocaleString("fr-FR")} €
        </p>

        {/* Galerie photos */}
        <ImageGallery photos={photos} titre={annonce.titre} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Fiche technique */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Fiche technique</h2>
              <div className="grid grid-cols-2 gap-y-5 gap-x-6 text-sm">
                {ficheItems.map(({ icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-2xl">{icon}</span>
                    <div>
                      <p className="text-gray-400 text-xs">{label}</p>
                      <p className="font-medium text-gray-900">{value || "—"}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Colonne droite */}
          <div className="space-y-4">
            {/* Comparaison prix */}
            {prixMoyen !== null && diff !== null && (
              <div className={`rounded-xl shadow-sm p-5 border ${
                diff < -500 ? "bg-green-50 border-green-200"
                : diff > 2000 ? "bg-red-50 border-red-200"
                : "bg-yellow-50 border-yellow-200"
              }`}>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">📊 Comparaison des prix</h3>
                <p className="text-xs text-gray-500 mb-1">Prix moyen sur CarRadar</p>
                <p className="text-2xl font-bold text-gray-800 mb-2">
                  {prixMoyen.toLocaleString("fr-FR")} €
                </p>
                {diff < -500 ? (
                  <p className="text-green-700 font-semibold text-sm">
                    ✅ {Math.abs(diff).toLocaleString("fr-FR")} € sous la moyenne
                  </p>
                ) : diff > 500 ? (
                  <p className="text-red-700 font-semibold text-sm">
                    ⚠️ {diff.toLocaleString("fr-FR")} € au-dessus de la moyenne
                  </p>
                ) : (
                  <p className="text-yellow-700 font-semibold text-sm">
                    ➡️ Dans la moyenne du marché
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-2">
                  Basé sur {similaires!.length} annonce{similaires!.length > 1 ? "s" : ""} similaires
                </p>
              </div>
            )}

            {/* Bouton AutoScout24 */}
            <a
              href={annonce.lien}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-blue-600 text-white text-center px-6 py-4 rounded-xl font-semibold hover:bg-blue-700 transition-colors"
            >
              Voir l'annonce sur AutoScout24 →
            </a>
            <p className="text-xs text-gray-400 text-center">S'ouvre dans un nouvel onglet</p>
          </div>
        </div>
      </main>
    </div>
  );
}
