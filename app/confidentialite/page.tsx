import Header from "@/components/Header";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité — CarRadar",
  description: "Politique de confidentialité et de traitement des données personnelles de CarRadar.",
};

export default function Confidentialite() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Header />

      <main className="max-w-3xl mx-auto px-4 py-16">
        <Link href="/" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
          ← Retour aux annonces
        </Link>

        <h1 className="text-3xl font-bold text-white mt-6 mb-2">Politique de confidentialité</h1>
        <p className="text-zinc-500 mb-10 text-sm">Dernière mise à jour : mai 2026</p>

        <div className="space-y-8 text-zinc-300 leading-relaxed">

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Présentation du site</h2>
            <p>
              Le site CarRadar (accessible à l'adresse <span className="text-zinc-200">carradar-smoky.vercel.app</span>) est
              un agrégateur d'annonces de voitures d'occasion. Il est édité par un particulier basé en France.
            </p>
            <p className="mt-2">Contact : <a href="mailto:chevroton.jules@gmail.com" className="text-blue-400 hover:underline">chevroton.jules@gmail.com</a></p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Données collectées</h2>
            <p className="mb-3">CarRadar collecte un minimum de données personnelles :</p>
            <ul className="list-disc list-inside space-y-2 text-zinc-400 ml-2">
              <li>
                <strong className="text-zinc-300">Compte utilisateur (optionnel)</strong> : si vous créez un compte,
                votre adresse e-mail et un mot de passe chiffré sont stockés de manière sécurisée via Supabase.
              </li>
              <li>
                <strong className="text-zinc-300">Favoris</strong> : les annonces que vous sauvegardez sont
                associées à votre compte si vous êtes connecté.
              </li>
              <li>
                <strong className="text-zinc-300">Cookies publicitaires</strong> : si vous acceptez les cookies,
                Google AdSense peut déposer des cookies pour afficher des publicités personnalisées.
              </li>
              <li>
                <strong className="text-zinc-300">Données de navigation</strong> : des données anonymes
                (pages visitées, durée de visite) peuvent être collectées à des fins statistiques.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Utilisation des cookies</h2>
            <p className="mb-3">CarRadar utilise les types de cookies suivants :</p>
            <ul className="list-disc list-inside space-y-2 text-zinc-400 ml-2">
              <li>
                <strong className="text-zinc-300">Cookies de session</strong> : nécessaires au fonctionnement
                du site (connexion, préférences).
              </li>
              <li>
                <strong className="text-zinc-300">Cookies publicitaires Google AdSense</strong> : utilisés pour
                diffuser des publicités adaptées à vos centres d'intérêt. Vous pouvez les refuser via le
                bandeau de consentement.
              </li>
            </ul>
            <p className="mt-3">
              Conformément au RGPD, votre consentement est recueilli avant tout dépôt de cookie non essentiel.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Services tiers</h2>
            <p className="mb-3">CarRadar fait appel aux services tiers suivants :</p>
            <ul className="list-disc list-inside space-y-2 text-zinc-400 ml-2">
              <li>
                <strong className="text-zinc-300">Supabase</strong> : hébergement de la base de données et
                authentification. Données stockées dans l'UE.
              </li>
              <li>
                <strong className="text-zinc-300">Vercel</strong> : hébergement du site web.
              </li>
              <li>
                <strong className="text-zinc-300">Google AdSense</strong> : régie publicitaire.
                Politique de confidentialité Google disponible sur <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">policies.google.com</a>.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Vos droits (RGPD)</h2>
            <p className="mb-3">Conformément au Règlement Général sur la Protection des Données (RGPD), vous disposez des droits suivants :</p>
            <ul className="list-disc list-inside space-y-1 text-zinc-400 ml-2">
              <li>Droit d'accès à vos données</li>
              <li>Droit de rectification</li>
              <li>Droit à l'effacement ("droit à l'oubli")</li>
              <li>Droit à la portabilité</li>
              <li>Droit d'opposition au traitement</li>
            </ul>
            <p className="mt-3">
              Pour exercer ces droits, contactez-nous à :{" "}
              <a href="mailto:chevroton.jules@gmail.com" className="text-blue-400 hover:underline">
                chevroton.jules@gmail.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Conservation des données</h2>
            <p>
              Les données de compte sont conservées tant que votre compte est actif. En cas de suppression
              de compte, toutes vos données personnelles sont effacées dans un délai de 30 jours.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Contact</h2>
            <p>
              Pour toute question relative à cette politique de confidentialité :{" "}
              <a href="mailto:chevroton.jules@gmail.com" className="text-blue-400 hover:underline">
                chevroton.jules@gmail.com
              </a>
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
