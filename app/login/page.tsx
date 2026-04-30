import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import LoginForm from "./LoginForm";

function RadarLogo() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="#3b82f6" strokeWidth="1.2" opacity="0.25" />
      <circle cx="12" cy="12" r="6"  stroke="#3b82f6" strokeWidth="1.2" opacity="0.5"  />
      <circle cx="12" cy="12" r="2"  fill="#3b82f6" />
      <line x1="12" y1="12" x2="19" y2="5" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export default async function LoginPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Déjà connecté → retour accueil
  if (user) redirect("/");

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <RadarLogo />
          <span className="text-2xl font-bold tracking-tight text-white">
            Car<span className="text-blue-400">Radar</span>
          </span>
        </Link>

        {/* Carte */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h1 className="text-lg font-semibold text-white mb-1">Bienvenue</h1>
          <p className="text-zinc-500 text-sm mb-6">Connectez-vous pour sauvegarder vos annonces.</p>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}
