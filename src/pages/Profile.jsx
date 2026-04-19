import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/AuthContext";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { Bell, CalendarDays, CircleHelp, MapPin, Settings, Shield, Users } from "lucide-react";

function avatarLabel(name) {
  return name?.slice(0, 1)?.toUpperCase() || "?";
}

async function getProfileData(userId) {
  const [{ count: createdPlansCount = 0 }, { count: joinedCount = 0 }, { count: spotsCount = 0 }, joinedPlansRes] = await Promise.all([
    supabase.from("plans").select("id", { count: "exact", head: true }).eq("created_by", userId),
    supabase.from("plan_members").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("status", "joined"),
    supabase.from("spots").select("id", { count: "exact", head: true }).eq("created_by", userId),
    supabase.from("plan_members").select("plan_id").eq("user_id", userId).eq("status", "joined"),
  ]);

  const joinedPlanIds = (joinedPlansRes.data || []).map((row) => row.plan_id).filter(Boolean);
  const ownedPlansRes = await supabase
    .from("plans")
    .select("id,title,plan_date,plan_time,spot_id")
    .eq("created_by", userId)
    .order("plan_date", { ascending: true })
    .limit(3);

  const joinedOnlyIds = joinedPlanIds.filter((id) => !(ownedPlansRes.data || []).some((plan) => plan.id === id)).slice(0, 3);
  const joinedOnlyRes = joinedOnlyIds.length
    ? await supabase.from("plans").select("id,title,plan_date,plan_time,spot_id").in("id", joinedOnlyIds)
    : { data: [] };

  const plans = [...(ownedPlansRes.data || []), ...(joinedOnlyRes.data || [])].slice(0, 3);
  const spotIds = plans.map((plan) => plan.spot_id).filter(Boolean);
  const spotsRes = spotIds.length ? await supabase.from("spots").select("id,name,address").in("id", spotIds) : { data: [] };
  const spotMap = new Map((spotsRes.data || []).map((spot) => [spot.id, spot]));

  return {
    createdPlansCount,
    joinedCount,
    spotsCount,
    upcomingPlans: plans.map((plan) => ({ ...plan, spots: spotMap.get(plan.spot_id) || null })),
  };
}

export default function Profile() {
  const { user, profile, role } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["profile-supabase", user?.id],
    enabled: Boolean(user?.id && isSupabaseConfigured && supabase),
    queryFn: () => getProfileData(user.id),
    staleTime: 10_000,
  });

  const stats = useMemo(() => ({
    created: data?.createdPlansCount || 0,
    joined: data?.joinedCount || 0,
    spots: data?.spotsCount || 0,
  }), [data]);

  if (!user) return <div className="min-h-[calc(100vh-64px)] bg-[#060606]" />;

  const displayName = profile?.username || user.full_name || user.email?.split("@")[0] || "Usuario";
  const handle = (profile?.username || user.email?.split("@")[0] || "usuario").toLowerCase().replace(/\s+/g, "_");

  const items = [
    { icon: CalendarDays, label: "Mis grupos", page: "MisMatches" },
    { icon: MapPin, label: "Añadir spot", page: "Home" },
    { icon: Settings, label: "Ajustes", page: "SettingsPage" },
    { icon: CircleHelp, label: "Ayuda y soporte", page: "SupportPage" },
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#060606] px-4 py-4">
      <div className="mx-auto max-w-md rounded-[30px] border border-white/10 bg-[#101010] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-[#efbf3a] to-[#df5b43] text-2xl font-black text-white">
              {avatarLabel(displayName)}
            </div>
            <div>
              <div className="text-[1.8rem] font-black tracking-tight text-white">{displayName}</div>
              <div className="text-sm text-stone-500">@{handle}</div>
              <div className="mt-2 text-sm text-stone-400">{role === "admin" ? "Admin de Pizzapolis" : "Pizza plans, cheap slices y grupos reales."}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-stone-200"><Bell className="h-4 w-4" /></button>
            <Link to={createPageUrl("SettingsPage")} className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-stone-200"><Settings className="h-4 w-4" /></Link>
          </div>
        </div>

        {role === "admin" ? (
          <Link
            to={createPageUrl("Admin")}
            className="mt-6 flex items-center justify-between rounded-[26px] border border-[#efbf3a]/30 bg-[#111111] px-5 py-5 text-white shadow-[0_20px_45px_rgba(17,17,17,0.18)]"
          >
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.16em] text-[#efbf3a]">Admin</div>
              <div className="mt-2 text-lg font-black">Open moderation panel</div>
              <div className="mt-1 text-sm text-white/70">Manage spots, plans, comments, photos and chat.</div>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold"><Shield className="h-4 w-4" /></div>
          </Link>
        ) : null}

        <div className="mt-6 grid grid-cols-3 gap-3 rounded-[26px] border border-white/8 bg-white/[0.03] p-4 text-center">
          <div>
            <div className="text-3xl font-black text-white">{isLoading ? "…" : stats.joined}</div>
            <div className="mt-1 text-xs uppercase tracking-[0.14em] text-stone-500">Grupos</div>
          </div>
          <div>
            <div className="text-3xl font-black text-white">{isLoading ? "…" : stats.created}</div>
            <div className="mt-1 text-xs uppercase tracking-[0.14em] text-stone-500">Planes</div>
          </div>
          <div>
            <div className="text-3xl font-black text-white">{isLoading ? "…" : stats.spots}</div>
            <div className="mt-1 text-xs uppercase tracking-[0.14em] text-stone-500">Spots</div>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold uppercase tracking-[0.16em] text-stone-500">Próximos planes</div>
            <Link to={createPageUrl("MisMatches")} className="text-sm font-semibold text-red-400">Ver grupos</Link>
          </div>
          <div className="mt-4 space-y-3 rounded-[26px] border border-white/8 bg-white/[0.03] p-4">
            {(data?.upcomingPlans?.length ? data.upcomingPlans : []).slice(0, 3).map((plan) => (
              <div key={plan.id} className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-stone-300">
                <div className="font-bold text-white">{plan.title}</div>
                <div className="mt-1 text-stone-400">{plan.spots?.name || "Spot"} · {plan.plan_date} · {String(plan.plan_time).slice(0,5)}</div>
              </div>
            ))}
            {!data?.upcomingPlans?.length && !isLoading ? (
              <div className="text-sm leading-7 text-stone-400">Todavía no tienes planes reales creados o unidos.</div>
            ) : null}
          </div>
        </div>

        <div className="mt-8 space-y-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.label} to={createPageUrl(item.page)} className="flex w-full items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3.5 text-left text-stone-200 transition hover:bg-white/[0.05]">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.04]"><Icon className="h-4 w-4 text-red-400" /></div>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
