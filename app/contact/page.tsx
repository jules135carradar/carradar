import Header from "@/components/Header";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact — CarRadar",
  description: "Contactez l'équipe CarRadar pour toute question ou signalement.",
};

export default function Contact() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-16">
        <Link href="/" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
          ← Retour aux annonces
        </Link>

        <h1 className="text-3xl font-bold text-white mt-6 mb-2">Contact</h1>
        <p className="text-zinc-500 mb-10 text-sm">Nous sommes là pour vous aider</p>

        <div className="space-y-8 text-zinc-300 leading-relaxed">

          <section className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Nous contacter</h2>
            <p className="mb-4">
              Pour toute question, suggestion ou signalement d'une annonce incorrecte,
              envoyez-nous un e-mail :
            </p>
            <a
              href="mailto:chevroton.jules@gmail.com"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium transition-colors"
            >
              📧 chevroton.jules@gmail.com
            </a>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">Questions fréquentes</h2>
            <div className="space-y-4">

              <div className="border border-zinc-800 rounded-xl p-4">
                <p className="font-medium text-zinc-200 mb-1">Une annonce est incorrecte ou expirée ?</p>
                <p className="text-zinc-500 text-sm">
                  Les annonces sont mises à jour chaque nuit. Si une annonce n'est plus disponible,
                  elle sera retirée automatiquement lors du prochain passage du scraper.
                </p>
              </div>

              <div className="border border-zinc-800 rounded-xl p-4">
                <p className="font-medium text-zinc-200 mb-1">Comment fonctionne CarRadar ?</p>
                <p className="text-zinc-500 text-sm">
                  CarRadar agrège automatiquement les annonces de plusieurs plateformes françaises.
                  Consultez notre <Link href="/a-propos" className="text-blue-400 hover:underline">page À propos</Link> pour en savoir plus.
                </p>
              </div>

              <div className="border border-zinc-800 rounded-xl p-4">
                <p className="font-medium text-zinc-200 mb-1">Comment supprimer mon compte ?</p>
                <p className="text-zinc-500 text-sm">
                  Envoyez-nous un e-mail avec votre adresse et nous supprimerons votre compte
                  et toutes vos données dans les 30 jours.
                </p>
              </div>

            </div>
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
