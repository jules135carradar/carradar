import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Header from "@/components/Header";
import Link from "next/link";

const sourceCouleur: Record<string, string> = {
  LeBonCoin:    "bg-orange-500/15 text-orange-300 ring-1 ring-orange-500/30",
  AutoScout24:  "bg-blue-500/15 text-blue-300 ring-1 ring-blue-500/30",
  "La Centrale":"bg-green-500/15 text-green-300 ring-1 ring-green-500/30",
  Autosphere:   "bg-purple-500/15 text-purple-300 ring-1 ring-purple-500/30",
  Aramisauto:   "bg-red-500/15 text-red-300 ring-1 ring-red-500/30",
  ParuVendu:    "bg-yellow-500/15 text-yellow-300 ring-1 ring-yellow-500/30",
  AutoUncle:    "bg-zinc-500/15 text-zinc-300 ring-1 ring-zinc-500/30",
};

export default async function ComptePage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: likes } = await supabase
    .from("likes")
    .select("annonce_id, created_at, annonces(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const annonces = (likes ?? []).map((l: any) => l.annonces).filter(Boolean);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-10">

        {/* En-tête compte */}
        <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-lg font-bold text-white">
            {user.email?.[0].toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-white">{user.email}</p>
            <p className="text-zinc-500 text-sm">Membre CarRadar</p>
          </div>
        </div>

        {/* Annonces sauvegardées */}
        <h2 className="text-lg font-semibold text-white mb-5">
          ❤️ Annonces sauvegardées
          <span className="ml-2 text-sm font-normal text-zinc-500">({annonces.length})</span>
        </h2>

        {annonces.length === 0 ? (
          <div className="text-center py-20 text-zinc-600">
            <p className="text-4xl mb-4">🤍</p>
            <p className="text-zinc-400 mb-3">Aucune annonce sauvegardée pour l'instant.</p>
            <Link href="/" className="text-blue-400 hover:underline text-sm">
              Parcourir les annonces
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {annonces.map((annonce: any) => (
              <Link
                key={annonce.id}
                href={`/annonces/${annonce.id}`}
                className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden hover:border-zinc-600 hover:shadow-lg hover:shadow-black/40 transition-all group"
              >
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
                <div className="p-4">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <h3 className="font-semibold text-zinc-100 truncate text-sm">{annonce.titre}</h3>
                    <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-md ${sourceCouleur[annonce.source] ?? "bg-zinc-500/15 text-zinc-300 ring-1 ring-zinc-500/30"}`}>
                      {annonce.source}
                    </span>
                  </div>
                  <p className="text-xl font-bold text-blue-400 mb-2">
                    {annonce.prix ? annonce.prix.toLocaleString("fr-FR") + " €" : "Prix non renseigné"}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-zinc-500 flex-wrap">
                    {annonce.annee && <span>📅 {annonce.annee}</span>}
                    {annonce.km    && <span>🛣 {annonce.km.toLocaleString("fr-FR")} km</span>}
                    {annonce.carburant && <span>⛽ {annonce.carburant}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
