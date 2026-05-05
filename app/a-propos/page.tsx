import Header from "@/components/Header";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "À propos — CarRadar",
  description: "CarRadar est un agrégateur d'annonces voitures d'occasion qui réunit les meilleures offres du marché français en un seul endroit.",
};

export default function APropos() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-16">
        <Link href="/" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
          ← Retour aux annonces
        </Link>

        <h1 className="text-3xl font-bold text-white mt-6 mb-2">À propos de CarRadar</h1>
        <p className="text-zinc-500 mb-10 text-sm">Dernière mise à jour : mai 2026</p>

        <div className="space-y-8 text-zinc-300 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Qu'est-ce que CarRadar ?</h2>
            <p>
              CarRadar est un agrégateur d'annonces de voitures d'occasion. Notre mission est simple :
              vous faire gagner du temps en regroupant les annonces de plusieurs grandes plateformes
              françaises sur un seul site, avec des outils de filtrage puissants.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Comment ça fonctionne ?</h2>
            <p className="mb-3">
              Chaque nuit, CarRadar collecte automatiquement les annonces publiées sur les principales
              plateformes de vente de voitures d'occasion en France :
            </p>
            <ul className="list-disc list-inside space-y-1 text-zinc-400 ml-2">
              <li>AutoScout24</li>
              <li>Autosphere</li>
              <li>ParuVendu</li>
              <li>Aramisauto</li>
              <li>et d'autres sources partenaires</li>
            </ul>
            <p className="mt-3">
              Ces annonces sont ensuite indexées et rendues consultables via nos filtres : prix, kilométrage,
              année, carburant, boîte de vitesses, puissance et localisation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Qui sommes-nous ?</h2>
            <p>
              CarRadar est un projet indépendant créé par un particulier passionné d'automobile,
              basé en France. Le site est développé et maintenu de manière indépendante, sans
              affiliation commerciale avec les plateformes référencées.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Nos engagements</h2>
            <ul className="list-disc list-inside space-y-2 text-zinc-400 ml-2">
              <li>Mise à jour quotidienne des annonces</li>
              <li>Aucune commission sur les ventes</li>
              <li>Service gratuit pour les utilisateurs</li>
              <li>Redirection directe vers l'annonce originale</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Contact</h2>
            <p>
              Pour toute question, suggestion ou signalement d'un problème, consultez notre{" "}
              <Link href="/contact" className="text-blue-400 hover:underline">
                page de contact
              </Link>
              .
            </p>
          </section>

        </div>
      </main>

      <footer className="border-t border-zinc-800 py-6 px-4 text-center text-sm text-zinc-600">
        © 2026 CarRadar —{" "}
        <Link href="/confidentialite" className="hover:text-zinc-400 transition-colors">Politique de confidentialité</Link>
        {" · "}
        <Link href="/a-propos" className="hover:text-zinc-400 transition-colors">À propos</Link>
        {" · "}
        <Link href="/contact" className="hover:text-zinc-400 transition-colors">Contact</Link>
      </footer>
    </div>
  );
}
