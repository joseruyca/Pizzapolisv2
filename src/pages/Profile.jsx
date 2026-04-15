import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Bell, Bookmark, CircleHelp, Settings, Star, Users } from "lucide-react";

function avatarLabel(name) {
  return name?.slice(0, 1)?.toUpperCase() || "?";
}

export default function Profile() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => null);
  }, []);

  const { data: groups = [] } = useQuery({
    queryKey: ["profile-groups-count", user?.email],
    enabled: !!user,
    queryFn: async () => {
      const [hangouts, intereses] = await Promise.all([
        base44.entities.Quedada.list("fecha_hora", 100),
        base44.asServiceRole.entities.Interes.list("created_date", 1000),
      ]);
      const joinedIds = new Set(intereses.filter((i) => i.usuario_id === user?.email && i.tipo_interes === "like").map((i) => i.quedada_id));
      return hangouts.filter((item) => joinedIds.has(item.id));
    },
  });

  const { data: ratings = [] } = useQuery({
    queryKey: ["profile-ratings", user?.email],
    enabled: !!user,
    queryFn: () => base44.entities.Rating.filter({ user_email: user.email }, "-created_date"),
  });

  const stats = useMemo(() => {
    const ratingAvg = ratings.length ? (ratings.reduce((sum, r) => sum + Number(r.score || 0), 0) / ratings.length).toFixed(1) : "4.8";
    return {
      groups: groups.length,
      slices: ratings.length,
      rating: ratingAvg,
    };
  }, [groups, ratings]);

  if (!user) return <div className="min-h-[calc(100vh-64px)] bg-[#060606]" />;

  const items = [
    { icon: Bell, label: "Actividad reciente", accent: true },
    { icon: Bookmark, label: "Plan guardados" },
    { icon: Users, label: "Amigos" },
    { icon: Settings, label: "Ajustes" },
    { icon: CircleHelp, label: "Ayuda y soporte" },
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#060606] px-4 py-4">
      <div className="mx-auto max-w-md rounded-[30px] border border-white/10 bg-[#101010] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className={`flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br ${user.avatar_color || "from-red-500 to-orange-500"} text-2xl font-black text-white`}>
              {avatarLabel(user.full_name)}
            </div>
            <div>
              <div className="text-[1.8rem] font-black tracking-tight">{user.full_name || "Javier"}</div>
              <div className="text-sm text-stone-500">@{(user.full_name || "javi_slice").toLowerCase().replace(/\s+/g, "_")}</div>
              <div className="mt-2 text-sm text-stone-400">{user.tagline || "Siempre buscando el mejor slice barato."}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-stone-200"><Bell className="h-4 w-4" /></button>
            <button className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-stone-200"><Settings className="h-4 w-4" /></button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-3 rounded-[26px] border border-white/8 bg-white/[0.03] p-4 text-center">
          <div>
            <div className="text-3xl font-black text-white">{stats.groups}</div>
            <div className="mt-1 text-xs uppercase tracking-[0.14em] text-stone-500">Grupos</div>
          </div>
          <div>
            <div className="text-3xl font-black text-white">{stats.slices}</div>
            <div className="mt-1 text-xs uppercase tracking-[0.14em] text-stone-500">Slices probados</div>
          </div>
          <div>
            <div className="text-3xl font-black text-white">{stats.rating}</div>
            <div className="mt-1 text-xs uppercase tracking-[0.14em] text-stone-500">Valoración</div>
          </div>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between">
            <div className="text-sm font-bold uppercase tracking-[0.16em] text-stone-500">Actividad reciente</div>
            <button className="text-sm font-semibold text-red-400">Ver todo</button>
          </div>
          <div className="mt-4 space-y-3 rounded-[26px] border border-white/8 bg-white/[0.03] p-4">
            <div className="flex items-center gap-3 text-sm text-stone-300"><div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/[0.04]"><Users className="h-4 w-4 text-red-400" /></div><span>Te uniste a NYC Cheap Slice Run</span></div>
            <div className="flex items-center gap-3 text-sm text-stone-300"><div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/[0.04]"><Star className="h-4 w-4 text-red-400" /></div><span>Valoraste Scarr's Pizza con 4.7</span></div>
            <div className="flex items-center gap-3 text-sm text-stone-300"><div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/[0.04]"><Bookmark className="h-4 w-4 text-red-400" /></div><span>Guardaste Brooklyn Square &amp; Chill</span></div>
          </div>
        </div>

        <div className="mt-8 space-y-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <button key={item.label} className="flex w-full items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3.5 text-left text-stone-200 transition hover:bg-white/[0.05]">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.04]"><Icon className="h-4 w-4 text-red-400" /></div>
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
