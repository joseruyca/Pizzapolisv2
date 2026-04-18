import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Award, Loader2, Medal, Pizza, Trophy, Users } from "lucide-react";
import { supabase } from "@/lib/supabase";

async function loadLeaderboard() {
  const [profilesRes, plansRes, spotsRes] = await Promise.all([
    supabase.from("profiles").select("id,email,username,avatar_url,role"),
    supabase.from("plans").select("id,created_by,status"),
    supabase.from("spots").select("id,created_by,status"),
  ]);
  if (profilesRes.error) throw profilesRes.error;
  if (plansRes.error) throw plansRes.error;
  if (spotsRes.error) throw spotsRes.error;
  return {
    profiles: profilesRes.data || [],
    plans: plansRes.data || [],
    spots: spotsRes.data || [],
  };
}

export default function Leaderboards() {
  const { data, isLoading } = useQuery({ queryKey: ["leaderboard-supabase"], queryFn: loadLeaderboard });

  const leaderboard = useMemo(() => {
    const profiles = data?.profiles || [];
    const plans = data?.plans || [];
    const spots = data?.spots || [];
    return profiles
      .map((profile) => ({
        ...profile,
        planCount: plans.filter((plan) => plan.created_by === profile.id).length,
        approvedSpots: spots.filter((spot) => spot.created_by === profile.id && spot.status === "approved").length,
      }))
      .sort((a, b) => (b.planCount + b.approvedSpots) - (a.planCount + a.approvedSpots))
      .slice(0, 20);
  }, [data]);

  if (isLoading) return <div className="min-h-[calc(100vh-64px)] grid place-items-center bg-[#060606]"><Loader2 className="h-8 w-8 animate-spin text-[#df5b43]" /></div>;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#060606] px-4 py-4 text-white">
      <div className="mx-auto max-w-4xl rounded-[30px] border border-white/10 bg-[#101010] p-5 shadow-[0_22px_60px_rgba(0,0,0,0.35)]">
        <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#efbf3a]">Community</div>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.05em]">Most active creators</h1>
        <p className="mt-3 text-sm leading-7 text-stone-400">Ranking simple basado en planes creados y spots aprobados para mantenerlo limpio y real.</p>
        <div className="mt-8 space-y-3">
          {leaderboard.map((item, idx) => {
            const Icon = idx === 0 ? Trophy : idx === 1 ? Medal : idx === 2 ? Award : Users;
            return (
              <div key={item.id} className="flex items-center gap-4 rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#141414] text-[#efbf3a]"><Icon className="h-5 w-5" /></div>
                <div className="min-w-0 flex-1">
                  <div className="text-lg font-black">{item.username || item.email}</div>
                  <div className="mt-1 text-sm text-stone-400">{item.role === 'admin' ? 'Admin' : 'Community member'}</div>
                </div>
                <div className="flex flex-wrap gap-2 text-sm">
                  <span className="rounded-full bg-[#df5b43]/10 px-3 py-2 font-bold text-[#ff8f7a]">{item.planCount} plans</span>
                  <span className="rounded-full bg-[#216b33]/10 px-3 py-2 font-bold text-[#8de0a2] flex items-center gap-2"><Pizza className="h-4 w-4" />{item.approvedSpots} spots</span>
                </div>
              </div>
            );
          })}
          {!leaderboard.length ? <div className="rounded-[24px] border border-dashed border-white/10 p-10 text-center text-stone-400">Aún no hay suficiente actividad para el ranking.</div> : null}
        </div>
      </div>
    </div>
  );
}
