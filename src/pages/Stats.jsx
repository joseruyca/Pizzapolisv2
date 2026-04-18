import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Award, Loader2, MapPin, MessageSquare, Pizza, Users } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";

async function loadStats(userId) {
  const [spotsRes, plansRes, joinsRes, commentsRes, photosRes] = await Promise.all([
    supabase.from("spots").select("id", { count: "exact", head: true }).eq("created_by", userId),
    supabase.from("plans").select("id", { count: "exact", head: true }).eq("created_by", userId),
    supabase.from("plan_members").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "joined"),
    supabase.from("spot_comments").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("spot_photos").select("id", { count: "exact", head: true }).eq("user_id", userId),
  ]);
  return {
    spots: spotsRes.count || 0,
    plans: plansRes.count || 0,
    groups: joinsRes.count || 0,
    comments: commentsRes.count || 0,
    photos: photosRes.count || 0,
  };
}

export default function Stats() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({ queryKey: ["stats-supabase", user?.id], enabled: Boolean(user?.id), queryFn: () => loadStats(user.id) });

  if (!user) return <div className="min-h-[calc(100vh-64px)] bg-[#060606]" />;
  if (isLoading) return <div className="min-h-[calc(100vh-64px)] grid place-items-center bg-[#060606]"><Loader2 className="h-8 w-8 animate-spin text-[#df5b43]" /></div>;

  const cards = [
    ["Spots enviados", data?.spots || 0, Pizza, "#df5b43"],
    ["Planes creados", data?.plans || 0, Users, "#efbf3a"],
    ["Grupos unidos", data?.groups || 0, Award, "#216b33"],
    ["Comentarios", data?.comments || 0, MessageSquare, "#df5b43"],
    ["Fotos", data?.photos || 0, MapPin, "#216b33"],
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#060606] px-4 py-4 text-white">
      <div className="mx-auto max-w-4xl rounded-[30px] border border-white/10 bg-[#101010] p-5 shadow-[0_22px_60px_rgba(0,0,0,0.35)]">
        <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#efbf3a]">Your activity</div>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.05em]">Stats that actually matter</h1>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map(([label, value, Icon, color]) => (
            <div key={label} className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
              <Icon className="h-7 w-7" style={{ color }} />
              <div className="mt-4 text-4xl font-black">{value}</div>
              <div className="mt-2 text-sm text-stone-400">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
