import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Compass, Loader2, MapPin, Sparkles, Users } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { fetchActivePlans, fetchApprovedSpots, fetchJoinedPlanIds, fetchSpotsByIds } from "@/lib/supabase-insights";
import { createPageUrl } from "@/utils";

async function loadRecommendations(userId) {
  const [spots, plans, joinedIds] = await Promise.all([
    fetchApprovedSpots(),
    fetchActivePlans(),
    userId ? fetchJoinedPlanIds(userId) : Promise.resolve([]),
  ]);

  const joinedPlans = plans.filter((plan) => joinedIds.includes(plan.id));
  const joinedSpotIds = new Set(joinedPlans.map((plan) => plan.spot_id).filter(Boolean));

  const recommendations = spots
    .filter((spot) => !joinedSpotIds.has(spot.id))
    .map((spot) => ({
      ...spot,
      activePlans: plans.filter((plan) => plan.spot_id === spot.id).length,
    }))
    .sort((a, b) => b.activePlans - a.activePlans || Number(a.slice_price || 999) - Number(b.slice_price || 999))
    .slice(0, 8);

  return recommendations;
}

export default function Recomendaciones() {
  const { user } = useAuth();
  const { data = [], isLoading } = useQuery({ queryKey: ["recommendations", user?.id], queryFn: () => loadRecommendations(user?.id) });

  if (isLoading) return <div className="min-h-[calc(100vh-64px)] grid place-items-center bg-[#060606]"><Loader2 className="h-8 w-8 animate-spin text-[#df5b43]" /></div>;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#060606] px-4 py-4 text-white">
      <div className="mx-auto max-w-5xl rounded-[30px] border border-white/10 bg-[#101010] p-5 shadow-[0_22px_60px_rgba(0,0,0,0.35)]">
        <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#efbf3a]">Recommendations</div>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.05em]">Where to go next</h1>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-400">Te proponemos spots aprobados con planes activos o muy buen precio para que encuentres algo rápido sin rebuscar.</p>
        {!data.length ? (
          <div className="mt-8 rounded-[24px] border border-dashed border-white/10 p-10 text-center text-stone-400">
            <Sparkles className="mx-auto h-10 w-10 text-[#efbf3a]" />
            <div className="mt-4 text-xl font-black text-white">Todavía no hay recomendaciones</div>
            <p className="mt-2 text-sm">Crea spots, únete a planes y vuelve para ver sugerencias mejores.</p>
            <Link to={createPageUrl("Home")} className="mt-6 inline-flex rounded-2xl bg-[#df5b43] px-5 py-3 font-bold text-white">Ir al mapa</Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {data.map((spot) => (
              <div key={spot.id} className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                {spot.photo_url ? <div className="mb-4 aspect-[4/3] overflow-hidden rounded-[20px] bg-black/30"><img src={spot.photo_url} alt="" className="h-full w-full object-cover" /></div> : null}
                <div className="text-xl font-black">{spot.name}</div>
                <div className="mt-2 flex items-center gap-2 text-sm text-stone-400"><MapPin className="h-4 w-4" />{spot.address}</div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#efbf3a]/10 px-3 py-2 text-sm font-bold text-[#efbf3a]">${Number(spot.slice_price || 0).toFixed(2)}</span>
                  <span className="rounded-full bg-[#216b33]/10 px-3 py-2 text-sm font-bold text-[#8de0a2] flex items-center gap-2"><Users className="h-4 w-4" />{spot.activePlans} active plans</span>
                </div>
                {spot.best_slice ? <div className="mt-4 text-sm text-stone-300"><Compass className="mr-2 inline h-4 w-4 text-[#df5b43]" />Best slice: {spot.best_slice}</div> : null}
                {spot.quick_note ? <p className="mt-4 text-sm leading-7 text-stone-400">{spot.quick_note}</p> : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
