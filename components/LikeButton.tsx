"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

interface Props {
  annonceId: number;
  initialLiked: boolean;
  userId: string | null;
}

export default function LikeButton({ annonceId, initialLiked, userId }: Props) {
  const [liked, setLiked] = useState(initialLiked);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function toggle() {
    if (!userId) {
      router.push("/login");
      return;
    }

    setLoading(true);
    const supabase = createSupabaseBrowserClient();

    if (liked) {
      await supabase.from("likes").delete()
        .eq("user_id", userId)
        .eq("annonce_id", annonceId);
    } else {
      await supabase.from("likes").insert({ user_id: userId, annonce_id: annonceId });
    }

    setLiked(!liked);
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border font-medium text-sm transition-all ${
        liked
          ? "bg-red-500/15 border-red-500/40 text-red-400 hover:bg-red-500/25"
          : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white"
      }`}
    >
      <span className="text-base">{liked ? "❤️" : "🤍"}</span>
      {liked ? "Sauvegardé" : "Sauvegarder l'annonce"}
    </button>
  );
}
