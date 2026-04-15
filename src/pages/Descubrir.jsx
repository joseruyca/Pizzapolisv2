import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useAnimationControls, useMotionValue, useTransform } from "framer-motion";
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

function SwipeCard({ hangout, nextHangout, onDecision }) {
  const x = useMotionValue(0);
  const controls = useAnimationControls();
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  const rotate = useTransform(x, [-220, 0, 220], [-12, 0, 12]);
  const likeOpacity = useTransform(x, [20, 90, 170], [0, 0.45, 1]);
  const nopeOpacity = useTransform(x, [-170, -90, -20], [1, 0.45, 0]);
  const acceptScale = useTransform(x, [0, 180], [0.9, 1.05]);
  const rejectScale = useTransform(x, [-180, 0], [1.05, 0.9]);
  const greenGlow = useTransform(x, [0, 150], [0, 0.65]);
  const redGlow = useTransform(x, [-150, 0], [0.65, 0]);
  const spotsLeft = Math.max((hangout.max_participantes || 0) - hangout.joined_count, 0);

  useEffect(() => {
    x.set(0);
    controls.set({ x: 0, rotate: 0, opacity: 1, scale: 1 });
    setIsAnimatingOut(false);
  }, [hangout?.id, x, controls]);

  const triggerDecision = async (decision) => {
    if (isAnimatingOut) return;
    setIsAnimatingOut(true);
    const direction = decision === "like" ? 1 : -1;
    await controls.start({
      x: direction * 520,
      rotate: direction * 18,
      opacity: 0,
      scale: 0.96,
      transition: { duration: 0.26, ease: [0.22, 1, 0.36, 1] },
    });
    onDecision(hangout.id, decision);
  };

  return (
    <div className="relative flex h-[calc(100vh-56px)] flex-col overflow-hidden bg-[#060606] px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
      <div className="flex-1 overflow-hidden">
        <div className="relative mx-auto h-full w-full max-w-md">
          {nextHangout ? (
            <div className="absolute inset-x-3 top-6 bottom-28 rounded-[34px] border border-white/8 bg-[linear-gradient(180deg,#111_0%,#070707_100%)] opacity-70 scale-[0.965]" />
          ) : null}

          <motion.div
            drag={isAnimatingOut ? false : "x"}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.14}
            style={{ x, rotate }}
            animate={controls}
            onDragEnd={(_, info) => {
              if (info.offset.x > 120) {
                triggerDecision("like");
              } else if (info.offset.x < -120) {
                triggerDecision("dislike");
              } else {
                controls.start({ x: 0, rotate: 0, transition: { type: "spring", stiffness: 380, damping: 28 } });
              }
            }}
            className="absolute inset-x-0 top-0 bottom-24 overflow-hidden rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(220,38,38,0.16),transparent_26%),linear-gradient(180deg,#141414_0%,#070707_100%)] shadow-[0_28px_70px_rgba(0,0,0,0.56)]"
          >
            <motion.div
              style={{ opacity: greenGlow }}
              className="pointer-events-none absolute inset-0 border-[3px] border-emerald-400/90 rounded-[34px] shadow-[0_0_0_1px_rgba(16,185,129,0.2),0_0_30px_rgba(16,185,129,0.28)]"
            />
            <motion.div
              style={{ opacity: redGlow }}
              className="pointer-events-none absolute inset-0 border-[3px] border-rose-400/90 rounded-[34px] shadow-[0_0_0_1px_rgba(244,63,94,0.18),0_0_30px_rgba(244,63,94,0.24)]"
            />

            <motion.div
              style={{ opacity: nopeOpacity, scale: rejectScale }}
              className="absolute left-5 top-5 z-20 rounded-2xl border-2 border-rose-300 bg-rose-500/12 px-4 py-2 text-base font-black uppercase tracking-[0.16em] text-rose-200 shadow-lg shadow-rose-900/20"
            >
              <div className="flex items-center gap-2"><X className="h-5 w-5" />Nope</div>
            </motion.div>
            <motion.div
              style={{ opacity: likeOpacity, scale: acceptScale }}
              className="absolute right-5 top-5 z-20 rounded-2xl border-2 border-emerald-300 bg-emerald-500/14 px-4 py-2 text-base font-black uppercase tracking-[0.16em] text-emerald-200 shadow-lg shadow-emerald-900/20"
            >
              <div className="flex items-center gap-2"><Check className="h-5 w-5" />Join</div>
            </motion.div>

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.07),transparent_18%)]" />
            <div className="absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-black via-black/70 to-transparent" />

            <div className="relative flex h-full flex-col justify-end p-4">
              <div className="rounded-[30px] border border-white/10 bg-black/28 p-5 backdrop-blur-md">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded-full bg-violet-500/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-violet-100">
                      {new Date(hangout.fecha_hora).toLocaleDateString([], { day: "2-digit", month: "short" }).replace(".", "").toUpperCase()} · {new Date(hangout.fecha_hora).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-emerald-200">{spotsLeft} plazas libres</span>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-stone-200">
                    {hangout.vibe}
                  </span>
                  <span className="rounded-full bg-red-600 px-3 py-1 text-[11px] font-black text-white">{hangout.priceLabel}</span>
                </div>

                <h1 className="mt-4 text-[2.75rem] font-black leading-[0.92] tracking-tight text-white">{hangout.titulo}</h1>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-stone-200">
                  <span className="font-semibold">{hangout.pizzeria_nombre}</span>
                  <span className="inline-flex items-center gap-1 text-stone-300"><MapPin className="h-3.5 w-3.5" />{hangout.place?.neighborhood || "NYC"}</span>
                </div>

                <p className="mt-4 text-[15px] leading-7 text-stone-200/92">{hangout.descripcion}</p>

                <div className="mt-5 flex items-end justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br ${hangout.host?.avatar_color || "from-red-500 to-orange-500"} text-sm font-bold text-white`}>
                      {avatarLabel(hangout.host)}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs text-stone-400">Creado por</div>
                      <div className="truncate font-bold text-white">{hangout.host?.full_name || hangout.creador_nombre}</div>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="flex items-center justify-end -space-x-2">
                      {hangout.participants.slice(0, 3).map((person) => (
                        <div key={person.email} className={`flex h-9 w-9 items-center justify-center rounded-full border border-black/40 bg-gradient-to-br ${person.avatar_color || "from-stone-500 to-stone-700"} text-[11px] font-bold text-white`}>
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
        </div>
      </div>

      <div className="relative z-20 flex items-center justify-center gap-7 pb-2 pt-1">
        <button
          className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-stone-300 shadow-lg shadow-black/30 transition hover:bg-white/[0.08] hover:text-white"
          onClick={() => triggerDecision("dislike")}
        >
          <X className="h-8 w-8" />
        </button>
        <button
          className="flex h-18 w-18 items-center justify-center rounded-full bg-red-600 text-white shadow-[0_18px_40px_rgba(220,38,38,0.35)] transition hover:bg-red-500"
          onClick={() => triggerDecision("like")}
        >
          <Heart className="h-9 w-9 fill-current" />
        </button>
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
    queryKey: ["discover-hangouts-v5", user?.email],
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
      queryClient.invalidateQueries({ queryKey: ["discover-hangouts-v5", user?.email] });
      queryClient.invalidateQueries({ queryKey: ["my-groups-v4", user?.email] });
      if (vars.decision === "like") {
        const joined = visible.find((item) => item.id === vars.id);
        setJoinedToast(joined);
        setTimeout(() => setJoinedToast(null), 2200);
      }
    },
  });

  if (!user || isLoading) return <div className="flex h-[calc(100vh-56px)] items-center justify-center bg-[#060606] text-white">Cargando…</div>;

  if (!current) {
    return (
      <div className="flex h-[calc(100vh-56px)] items-center justify-center bg-[#060606] px-4">
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
    <div className="h-[calc(100vh-56px)] overflow-hidden bg-[#060606]">
      <SwipeCard hangout={current} nextHangout={next} onDecision={(id, decision) => mutate.mutate({ id, decision })} />
      <AnimatePresence>
        {joinedToast ? (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="fixed inset-x-4 bottom-24 z-[1300] mx-auto max-w-sm rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white shadow-lg">
            Te has unido a {joinedToast.titulo}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
