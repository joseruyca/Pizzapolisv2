import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Heart, MapPin, X, SlidersHorizontal, ChevronRight } from "lucide-react";
import { formatPrice, getHangoutVibe } from "@/lib/place-helpers";

function avatarLabel(user) {
  return user?.full_name?.slice(0, 1)?.toUpperCase() || "?";
}

function enrich(quedadas, places, users, intereses, currentEmail) {
  const placesById = Object.fromEntries(places.map((place) => [place.id, place]));
  const usersById = Object.fromEntries(users.map((person) => [person.id, person]));
  const usersByEmail = Object.fromEntries(users.map((person) => [person.email, person]));

  return quedadas
    .map((hangout) => {
      const place = placesById[hangout.pizzeria_id];
      const likes = intereses.filter((item) => item.quedada_id === hangout.id && item.tipo_interes === "like");
      const choice = intereses.find((item) => item.quedada_id === hangout.id && item.usuario_id === currentEmail);
      const participants = likes.map((like) => usersByEmail[like.usuario_id]).filter(Boolean);
      return {
        ...hangout,
        place,
        host: usersById[hangout.creador_id],
        participants,
        joined_count: participants.length,
        joined: choice?.tipo_interes === "like",
        skipped: choice?.tipo_interes === "dislike",
        vibe: getHangoutVibe(hangout),
        priceLabel: place ? formatPrice(place.standard_slice_price) : "$4.00",
      };
    })
    .filter((hangout) => hangout.estado === "activa")
    .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));
}

function SwipeCard({ hangout, onDecision }) {
  const spotsLeft = Math.max((hangout.max_participantes || 0) - hangout.joined_count, 0);
  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.18}
      onDragEnd={(_, info) => {
        if (info.offset.x > 110) onDecision(hangout.id, "like");
        if (info.offset.x < -110) onDecision(hangout.id, "dislike");
      }}
      className="relative mx-auto flex h-[calc(100vh-162px)] max-h-[760px] w-full max-w-md items-end overflow-hidden rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(220,38,38,0.18),transparent_25%),linear-gradient(180deg,#161616_0%,#090909_100%)] shadow-[0_30px_80px_rgba(0,0,0,0.58)]"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_20%)]" />
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black via-black/72 to-transparent" />
      <div className="relative flex h-full w-full flex-col justify-between p-4">
        <div className="flex items-center justify-between">
          <div className="rounded-full bg-black/40 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-violet-200">
            {new Date(hangout.fecha_hora) <= new Date(Date.now() + 86400000) ? "Hoy" : "Próximo"} · {new Date(hangout.fecha_hora).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
          <button className="flex h-11 w-11 items-center justify-center rounded-full border border-white/12 bg-black/30 text-white">
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>

        <div className="rounded-[30px] border border-white/10 bg-black/26 p-5 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-bold text-emerald-200">{spotsLeft} plazas libres</span>
            <span className="rounded-full bg-black/30 px-3 py-1 text-[11px] font-bold text-white">{hangout.vibe}</span>
          </div>

          <h1 className="mt-4 text-[2.9rem] font-black leading-[0.92] tracking-tight text-white">{hangout.titulo}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-stone-200">
            <span className="font-semibold">{hangout.pizzeria_nombre}</span>
            <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-black text-white">{hangout.priceLabel}</span>
            <span className="inline-flex items-center gap-1 text-stone-300"><MapPin className="h-3.5 w-3.5" />{hangout.place?.neighborhood || "NYC"}</span>
          </div>
          <p className="mt-3 text-[15px] leading-7 text-stone-200/90">{hangout.descripcion}</p>

          <div className="mt-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br ${hangout.host?.avatar_color || "from-red-500 to-orange-500"} text-sm font-bold text-white`}>
                {avatarLabel(hangout.host)}
              </div>
              <div className="min-w-0">
                <div className="text-sm text-stone-400">Creado por</div>
                <div className="truncate font-bold text-white">{hangout.host?.full_name || hangout.creador_nombre}</div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="flex items-center justify-end -space-x-2">
                {hangout.participants.slice(0, 4).map((person) => (
                  <div key={person.email} className={`flex h-8 w-8 items-center justify-center rounded-full border border-black/40 bg-gradient-to-br ${person.avatar_color || "from-stone-500 to-stone-700"} text-[11px] font-bold text-white`}>
                    {avatarLabel(person)}
                  </div>
                ))}
              </div>
              <div className="mt-1 text-sm text-stone-300">{hangout.joined_count} van</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Descubrir() {
  const [user, setUser] = useState(null);
  const [joinedToast, setJoinedToast] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => null);
  }, []);

  const { data: hangouts = [], isLoading } = useQuery({
    queryKey: ["discover-hangouts-v3", user?.email],
    enabled: !!user,
    queryFn: async () => {
      const [quedadas, places, users, intereses] = await Promise.all([
        base44.entities.Quedada.list("fecha_hora", 100),
        base44.entities.PizzaPlace.list("standard_slice_price", 100),
        base44.asServiceRole.entities.User.list("full_name", 100),
        base44.asServiceRole.entities.Interes.list("created_date", 1000),
      ]);
      return enrich(quedadas, places, users, intereses, user?.email || "");
    },
  });

  const mutate = useMutation({
    mutationFn: async ({ id, decision }) => base44.functions.invoke("recordarInteres", { quedada_id: id, tipo_interes: decision }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["discover-hangouts-v3", user?.email] });
      queryClient.invalidateQueries({ queryKey: ["my-groups-v2", user?.email] });
      if (vars.decision === "like") {
        const joined = visible.find((item) => item.id === vars.id);
        setJoinedToast(joined);
        setTimeout(() => setJoinedToast(null), 2400);
      }
    },
  });

  const visible = useMemo(() => hangouts.filter((item) => !item.skipped && !item.joined), [hangouts]);
  const current = visible[0];

  if (!user || isLoading) return <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-[#060606] text-white">Cargando…</div>;

  if (!current) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#060606] px-4 py-8">
        <div className="mx-auto max-w-md rounded-[30px] border border-white/10 bg-[#111] p-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-white/[0.04] text-4xl">🍕</div>
          <h1 className="mt-6 text-3xl font-black">No hay más planes por ahora</h1>
          <p className="mt-3 text-sm leading-7 text-stone-400">Cuando alguien proponga un plan en una pizzería aparecerá aquí para que puedas deslizar sí o no.</p>
          <div className="mt-6 grid gap-3">
            <a href={createPageUrl("CrearQuedada")} className="inline-flex h-12 items-center justify-center rounded-2xl bg-red-600 text-sm font-bold text-white">Crear un plan</a>
            <a href={createPageUrl("MisMatches")} className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-sm font-bold text-stone-200">Ver mis grupos</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#060606] px-4 py-4">
      <div className="mx-auto max-w-md">
        <SwipeCard hangout={current} onDecision={(id, decision) => mutate.mutate({ id, decision })} />

        <div className="mx-auto mt-5 flex max-w-[320px] items-center justify-center gap-6">
          <button onClick={() => mutate.mutate({ id: current.id, decision: "dislike" })} className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-stone-400 transition hover:bg-white/[0.08] hover:text-white">
            <X className="h-8 w-8" />
          </button>
          <button onClick={() => mutate.mutate({ id: current.id, decision: "like" })} className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 text-white shadow-xl shadow-red-900/30 transition hover:bg-red-500">
            <Heart className="h-8 w-8 fill-current" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {joinedToast ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed inset-x-4 bottom-24 z-[1300] mx-auto max-w-md rounded-2xl border border-emerald-500/25 bg-emerald-600/20 p-4 text-white backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-bold">¡Te has unido al grupo!</div>
                <div className="mt-1 text-sm text-emerald-100">{joinedToast.titulo}</div>
              </div>
              <a href={createPageUrl("MisMatches")} className="inline-flex items-center gap-1 text-sm font-semibold text-white">
                Ver mis grupos
                <ChevronRight className="h-4 w-4" />
              </a>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
