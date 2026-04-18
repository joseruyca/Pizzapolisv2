import React from "react";
import { Link } from "react-router-dom";
import { Heart, MapPin } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function Favorites() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#060606] px-4 py-4 text-white">
      <div className="mx-auto max-w-3xl rounded-[30px] border border-white/10 bg-[#101010] p-6 text-center shadow-[0_22px_60px_rgba(0,0,0,0.35)]">
        <Heart className="mx-auto h-12 w-12 text-[#df5b43]" />
        <h1 className="mt-6 text-4xl font-black tracking-[-0.05em]">Favorites will come back clean</h1>
        <p className="mt-4 text-sm leading-7 text-stone-400">Esta parte ya no usa demo. La vamos a reconstruir sobre datos reales de Supabase sin arrastrar favoritos falsos.</p>
        <Link to={createPageUrl("Home")} className="mt-8 inline-flex items-center gap-2 rounded-2xl bg-[#df5b43] px-5 py-3 font-bold text-white"><MapPin className="h-4 w-4" />Volver al mapa</Link>
      </div>
    </div>
  );
}
