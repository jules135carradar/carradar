import { supabase } from "@/lib/supabase";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { notFound } from "next/navigation";
import Link from "next/link";
import ImageGallery from "./ImageGallery";
import Header from "@/components/Header";
import LikeButton from "@/components/LikeButton";

const sourceCouleur: Record<string, string> = {
  LeBonCoin:    "bg-orange-500/15 text-orange-300 ring-1 ring-orange-500/30",
  AutoScout24:  "bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/30",
  "La Centrale":"bg-green-500/15 text-green-300 ring-1 ring-green-500/30",
  Autosphere:   "bg-purple-500/15 text-purple-300 ring-1 ring-purple-500/30",
  Aramisauto:   "bg-red-500/15 text-red-300 ring-1 ring-red-500/30",
  ParuVendu:    "bg-yellow-500/15 text-yellow-300 ring-1 ring-yellow-500/30",
  AutoUncle:    "bg-zinc-500/15 text-zinc-300 ring-1 ring-zinc-500/30",
};

function RadarLogo({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="#3b82f6" strokeWidth="1.2" opacity="0.25" />
      <circle cx="12" cy="12" r="6"  stroke="#3b82f6" strokeWidth="1.2" opacity="0.5"  />
      <circle cx="12" cy="12" r="2"  fill="#3b82f6" />
      <line x1="12" y1="12" x2="19" y2="5" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

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
      ? Math.round(similaires.reduce((sum: number, a: any) => sum + a.prix, 0) / similaires.length)
      : null;

  const diff = prixMoyen !== null && annonce.prix !== null ? annonce.prix - prixMoyen : null;

  const supabaseAuth = await createSupabaseServerClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();

  let isLiked = false;
  if (user) {
    const { data } = await supabaseAuth
      .from("likes")
      .select("id")
      .eq("user_id", user.id)
      .eq("annonce_id", annonce.id)
      .single();
    isLiked = !!data;
  }

  const photos: string[] =
    Array.isArray(annonce.images) && annonce.images.length > 0
      ? annonce.images
      : annonce.image
      ? [annonce.image]
      : [];

  const ficheItems = [
    { icon: "📅", label: "Année",            value: annonce.annee?.toString() },
    { icon: "🛣",  label: "Kilométrage",      value: annonce.km ? `${annonce.km.toLocaleString("fr-FR")} km` : null },
    { icon: "⛽", label: "Carburant",         value: annonce.carburant },
    { icon: "⚙️", label: "Boîte de vitesses", value: annonce.boite },
    { icon: "⚡", label: "Puissance",         value: annonce.puissance },
    { icon: "📍", label: "Lieu",              value: annonce.lieu },
    { icon: "🏷️", label: "Version",           value: annonce.description },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">

      <Header />
      <div className="max-w-5xl mx-auto px-4 pt-4">
        <Link href="/" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
          ← Retour aux annonces
        </Link>
      </div>

      <main className="max-w-5xl mx-auto px-4 py-8">

        {/* Titre + badge source */}
        <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
          <h1 className="text-2xl font-bold text-white">{annonce.titre}</h1>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${sourceCouleur[annonce.source] ?? "bg-zinc-500/15 text-zinc-300 ring-1 ring-zinc-500/30"}`}>
            {annonce.source}
          </span>
        </div>

        {/* Version / description */}
        {annonce.description && (
          <p className="text-zinc-500 text-sm mb-3">{annonce.description}</p>
        )}

        {/* Prix */}
        <p className="text-4xl font-bold text-blue-400 mb-6">
          {annonce.prix ? annonce.prix.toLocaleString("fr-FR") + " €" : "Prix non renseigné"}
        </p>

        {/* Galerie */}
        <ImageGallery photos={photos} titre={annonce.titre} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Fiche technique */}
          <div className="lg:col-span-2">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
              <h2 className="text-base font-semibold text-zinc-100 mb-5">Fiche technique</h2>
              <div className="grid grid-cols-2 gap-y-5 gap-x-6 text-sm">
                {ficheItems.map(({ icon, label, value }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-xl">{icon}</span>
                    <div>
                      <p className="text-zinc-600 text-xs mb-0.5">{label}</p>
                      <p className={`font-medium ${value ? "text-zinc-100" : "text-zinc-700"}`}>
                        {value || "—"}
                      </p>
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
              <div className={`rounded-2xl p-5 border ${
                diff < -500
                  ? "bg-green-500/10 border-green-500/30"
                  : diff > 500
                  ? "bg-red-500/10 border-red-500/30"
                  : "bg-yellow-500/10 border-yellow-500/30"
              }`}>
                <h3 className="text-sm font-semibold text-zinc-300 mb-3">📊 Comparaison des prix</h3>
                <p className="text-xs text-zinc-500 mb-1">Prix moyen sur CarRadar</p>
                <p className="text-2xl font-bold text-zinc-100 mb-2">
                  {prixMoyen.toLocaleString("fr-FR")} €
                </p>
                {diff < -500 ? (
                  <p className="text-green-400 font-semibold text-sm">
                    ✅ {Math.abs(diff).toLocaleString("fr-FR")} € sous la moyenne
                  </p>
                ) : diff > 500 ? (
                  <p className="text-red-400 font-semibold text-sm">
                    ⚠️ {diff.toLocaleString("fr-FR")} € au-dessus de la moyenne
                  </p>
                ) : (
                  <p className="text-yellow-400 font-semibold text-sm">
                    ➡️ Dans la moyenne du marché
                  </p>
                )}
                <p className="text-xs text-zinc-600 mt-2">
                  Basé sur {similaires!.length} annonce{similaires!.length > 1 ? "s" : ""} similaires
                </p>
              </div>
            )}

            {/* Like */}
            <LikeButton
              annonceId={annonce.id}
              initialLiked={isLiked}
              userId={user?.id ?? null}
            />

            {/* Bouton source */}
            <a
              href={annonce.lien}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-blue-600 hover:bg-blue-500 text-white text-center px-6 py-4 rounded-xl font-semibold transition-colors"
            >
              Voir l'annonce sur {annonce.source} →
            </a>
            <p className="text-xs text-zinc-600 text-center">S'ouvre dans un nouvel onglet</p>
          </div>
        </div>
      </main>
    </div>
  );
}
