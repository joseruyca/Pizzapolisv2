import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Flame, Loader2, MapPin, Pizza, Users } from "lucide-react";
import { motion } from "framer-motion";
import { fetchActivePlans, fetchApprovedSpots, fetchProfilesByIds } from "@/lib/supabase-insights";

async function loadTrending() {
  const [spots, plans] = await Promise.all([fetchApprovedSpots(), fetchActivePlans()]);
  const counts = new Map();
  plans.forEach((plan) => counts.set(plan.spot_id, (counts.get(plan.spot_id) || 0) + 1));
  const creatorProfiles = await fetchProfilesByIds(plans.map((plan) => plan.created_by));
  const creatorMap = new Map(creatorProfiles.map((item) => [item.id, item]));
  return { spots, plans, counts, creatorMap };
}

export default function Trending() {
  const [sortBy, setSortBy] = useState("plans");
  const { data, isLoading } = useQuery({ queryKey: ["trending-supabase"], queryFn: loadTrending });

  const trendingSpots = useMemo(() => {
    const spots = data?.spots || [];
    const counts = data?.counts || new Map();
    const plans = data?.plans || [];
    return [...spots]
      .map((spot) => ({
        ...spot,
        activePlans: counts.get(spot.id) || 0,
        nextPlan: plans.find((plan) => plan.spot_id === spot.id) || null,
      }))
      .sort((a, b) => sortBy === "price" ? Number(a.slice_price || 999) - Number(b.slice_price || 999) : b.activePlans - a.activePlans || new Date(b.created_at) - new Date(a.created_at));
  }, [data, sortBy]);

  if (isLoading) {
    return <div className="min-h-[calc(100vh-64px)] grid place-items-center bg-[#060606]"><Loader2 className="h-8 w-8 animate-spin text-[#df5b43]" /></div>;
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#060606] px-4 py-4 text-white">
      <div className="mx-auto max-w-4xl rounded-[30px] border border-white/10 bg-[#101010] p-5 shadow-[0_22px_60px_rgba(0,0,0,0.35)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#efbf3a]">Trending</div>
            <h1 className="mt-3 text-4xl font-black leading-none tracking-[-0.05em]">Spots with movement right now</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-400">Ordena por planes activos o por precio para descubrir dónde hay más movimiento real ahora mismo.</p>
          </div>
          <div className="flex gap-2">
            {[
              ["plans", "Más planes"],
              ["price", "Más baratos"],
            ].map(([id, label]) => (
              <button key={id} onClick={() => setSortBy(id)} className={`rounded-2xl px-4 py-2 text-sm font-bold ${sortBy === id ? "bg-[#df5b43] text-white" : "bg-white/5 text-stone-300"}`}>{label}</button>
            ))}
          </div>
        </div>
        <div className="mt-6 space-y-3">
          {trendingSpots.map((spot, idx) => (
            <motion.div key={spot.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }} className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-[#efbf3a]">#{idx + 1}</div>
                  <div className="mt-2 text-2xl font-black">{spot.name}</div>
                  <div className="mt-2 flex items-center gap-2 text-sm text-stone-400"><MapPin className="h-4 w-4" />{spot.address}</div>
                  {spot.best_slice ? <div className="mt-2 text-sm text-white/80"><Pizza className="mr-2 inline h-4 w-4 text-[#efbf3a]" />Best slice: {spot.best_slice}</div> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#df5b43]/15 px-3 py-2 text-sm font-bold text-[#ff8f7a]">${Number(spot.slice_price || 0).toFixed(2)}</span>
                  <span className="rounded-full bg-[#216b33]/15 px-3 py-2 text-sm font-bold text-[#8de0a2] flex items-center gap-2"><Users className="h-4 w-4" />{spot.activePlans} active plans</span>
                </div>
              </div>
              {spot.quick_note ? <p className="mt-4 text-sm leading-7 text-stone-300">{spot.quick_note}</p> : null}
            </motion.div>
          ))}
          {!trendingSpots.length ? <div className="rounded-[24px] border border-dashed border-white/10 p-10 text-center text-stone-400">Aún no hay spots aprobados para mostrar aquí.</div> : null}
        </div>
      </div>
    </div>
  );
}
