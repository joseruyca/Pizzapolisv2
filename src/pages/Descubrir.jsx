import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Check, Heart, MapPin, X } from "lucide-react";
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

function SwipeCard({ hangout, nextHangout, onDecision, disabled }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-180, 0, 180], [-10, 0, 10]);
  const acceptOpacity = useTransform(x, [25, 90, 170], [0, 0.35, 1]);
  const rejectOpacity = useTransform(x, [-25, -90, -170], [0, 0.35, 1]);
  const acceptScale = useTransform(x, [25, 120], [0.94, 1.05]);
  const rejectScale = useTransform(x, [-25, -120], [0.94, 1.05]);
  const cardTilt = useTransform(x, [-180, 0, 180], [-7, 0, 7]);

  const spotsLeft = Math.max((hangout.max_participantes || 0) - hangout.joined_count, 0);

  const handleVote = (decision) => {
    x.set(0);
    onDecision(hangout.id, decision);
  };

  return (
    <div className="relative mx-auto flex h-[calc(100vh-186px)] max-h-[760px] min-h-[540px] w-full max-w-md items-center justify-center overflow-hidden">
      {nextHangout ? (
        <motion.div
          aria-hidden
          style={{ rotate: useTransform(cardTilt, (v) => v * 0.25) }}
          className="absolute inset-x-3 top-6 bottom-6 rounded-[34px] border border-white/8 bg-[linear-gradient(180deg,#121212_0%,#090909_100%)] opacity-70"
        />
      ) : null}

      <motion.div
        drag={disabled ? false : "x"}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.18}
        style={{ x, rotate }}
        onDragEnd={(_, info) => {
          if (disabled) return;
          if (info.offset.x > 110) {
            handleVote("like");
          } else if (info.offset.x < -110) {
            handleVote("dislike");
          } else {
            x.set(0);
          }
        }}
        className="relative h-full w-full overflow-hidden rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(220,38,38,0.24),transparent_24%),linear-gradient(180deg,#151515_0%,#080808_100%)] shadow-[0_34px_80px_rgba(0,0,0,0.68)]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_20%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/52 to-transparent" />

        <motion.div style={{ opacity: rejectOpacity, scale: rejectScale }} className="absolute left-5 top-5 z-20 rounded-full border border-red-400/35 bg-red-500/18 px-4 py-2 text-[12px] font-black uppercase tracking-[0.18em] text-red-200">
          Nope
        </motion.div>
        <motion.div style={{ opacity: acceptOpacity, scale: acceptScale }} className="absolute right-5 top-5 z-20 rounded-full border border-emerald-400/35 bg-emerald-500/18 px-4 py-2 text-[12px] font-black uppercase tracking-[0.18em] text-emerald-200">
          Join
        </motion.div>

        <div className="relative flex h-full flex-col justify-end p-5">
          <div className="mb-3 flex items-center justify-between gap-3 text-[11px] font-bold uppercase tracking-[0.14em] text-white/80">
            <span className="rounded-full bg-violet-500/20 px-3 py-1 text-violet-100">
              {new Date(hangout.fecha_hora).toLocaleDateString([], { month: "short", day: "numeric" })} · {new Date(hangout.fecha_hora).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-emerald-100">{spotsLeft} plazas libres</span>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-black/38 p-5 backdrop-blur-md">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em]">
              <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-white/90">{hangout.vibe}</span>
              <span className="rounded-full border border-red-400/15 bg-red-500 px-2.5 py-1 text-white">{hangout.priceLabel}</span>
            </div>

            <h1 className="mt-4 text-[2.7rem] font-black leading-[0.92] tracking-tight text-white">{hangout.titulo}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-stone-200">
              <span className="font-semibold">{hangout.pizzeria_nombre}</span>
              <span className="inline-flex items-center gap-1 text-stone-300"><MapPin className="h-3.5 w-3.5" />{hangout.place?.neighborhood || "NYC"}</span>
            </div>
            <p className="mt-3 line-clamp-3 text-[15px] leading-7 text-stone-200/88">{hangout.descripcion}</p>

            <div className="mt-4 flex items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br ${hangout.host?.avatar_color || "from-red-500 to-orange-500"} text-sm font-bold text-white`}>
                  {avatarLabel(hangout.host)}
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-stone-400">Creado por</div>
                  <div className="truncate font-bold text-white">{hangout.host?.full_name || hangout.creador_nombre}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex justify-end -space-x-2">
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

      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-center gap-12 pb-4">
        <div className="grid place-items-center rounded-full border border-white/10 bg-black/45 p-4 text-stone-400 shadow-lg backdrop-blur-md">
          <X className="h-7 w-7" />
        </div>
        <div className="grid place-items-center rounded-full bg-red-600 p-4 text-white shadow-[0_16px_35px_rgba(220,38,38,0.38)]">
          <Heart className="h-7 w-7 fill-current" />
        </div>
      </div>
    </div>
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
    queryKey: ["discover-hangouts-v4", user?.email],
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

  const visible = useMemo(() => hangouts.filter((item) => !item.skipped && !item.joined), [hangouts]);
  const current = visible[0];
  const next = visible[1];

  const mutate = useMutation({
    mutationFn: async ({ id, decision }) => base44.functions.invoke("recordarInteres", { quedada_id: id, tipo_interes: decision }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["discover-hangouts-v4", user?.email] });
      queryClient.invalidateQueries({ queryKey: ["my-groups-v4", user?.email] });
      if (vars.decision === "like") {
        const joined = visible.find((item) => item.id === vars.id);
        setJoinedToast(joined);
        setTimeout(() => setJoinedToast(null), 2200);
      }
    },
  });

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
    <div className="h-[calc(100vh-64px)] overflow-hidden bg-[#060606] px-4 py-4">
      <div className="mx-auto flex h-full max-w-md flex-col">
        <div className="mb-3 shrink-0 text-center">
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-red-300">Descubrir planes</div>
          <p className="mt-1 text-sm text-stone-400">Desliza para unirte al grupo o pasar al siguiente plan.</p>
        </div>

        <div className="min-h-0 flex-1">
          <SwipeCard hangout={current} nextHangout={next} disabled={mutate.isPending} onDecision={(id, decision) => mutate.mutate({ id, decision })} />
        </div>
      </div>

      <AnimatePresence>
        {joinedToast ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed inset-x-4 bottom-24 z-[1300] mx-auto max-w-md rounded-2xl border border-emerald-500/30 bg-emerald-600 px-4 py-3 text-white shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="rounded-full bg-white/14 p-2"><Check className="h-5 w-5" /></div>
                <div className="min-w-0">
                  <div className="font-bold">Te has unido al grupo</div>
                  <div className="truncate text-sm text-emerald-50/90">{joinedToast.titulo}</div>
                </div>
              </div>
              <a href={createPageUrl("MisMatches")} className="text-sm font-bold text-white/95">Ver</a>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
