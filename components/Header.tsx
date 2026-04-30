import { createSupabaseServerClient } from "@/lib/supabase-server";
import Link from "next/link";
import SignOutButton from "./SignOutButton";

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

export default async function Header() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <RadarLogo size={26} />
          <span className="text-lg font-bold tracking-tight text-white">
            Car<span className="text-blue-400">Radar</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-zinc-400 hidden sm:block truncate max-w-[160px]">
                {user.email}
              </span>
              <SignOutButton />
            </>
          ) : (
            <Link
              href="/login"
              className="text-sm font-medium px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
            >
              Connexion
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
