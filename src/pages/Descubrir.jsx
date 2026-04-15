import React, { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion, useAnimationControls, useMotionTemplate, useMotionValue, useTransform } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Heart, MapPin, Users, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
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
  const controls = useAnimationControls();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-260, 0, 260], [-12, 0, 12]);
  const rightProgress = useTransform(x, [0, 60, 220], [0, 0.35, 1]);
  const leftProgress = useTransform(x, [-220, -60, 0], [1, 0.35, 0]);
  const leftScale = useTransform(leftProgress, [0, 1], [0.78, 1]);
  const rightScale = useTransform(rightProgress, [0, 1], [0.78, 1]);
  const borderColor = useTransform(x, [-220, -70, 0, 70, 220], [
    "rgba(248,113,113,0.96)",
    "rgba(248,113,113,0.38)",
    "rgba(255,255,255,0.08)",
    "rgba(34,197,94,0.38)",
    "rgba(34,197,94,0.96)",
  ]);
  const cardScale = useTransform(x, [-220, 0, 220], [0.985, 1, 0.985]);
  const glow = useMotionTemplate`0 28px 80px rgba(0,0,0,0.72), 0 0 0 1px ${borderColor}`;
  const spotsLeft = Math.max((hangout.max_participantes || 0) - hangout.joined_count, 0);

  async function finishVote(decision) {
    if (disabled) return;
    const travel = typeof window !== "undefined" ? Math.max(window.innerWidth, 540) : 560;
    await controls.start({
      x: decision === "like" ? travel : -travel,
      rotate: decision === "like" ? 17 : -17,
      opacity: 0,
      scale: 0.96,
      transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
    });
    x.set(0);
    controls.set({ x: 0, rotate: 0, opacity: 1, scale: 1 });
    onDecision(hangout.id, decision);
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-md flex-col">
      <div className="relative flex-1 overflow-hidden">
        {nextHangout ? (
          <>
            <motion.div
              aria-hidden
              className="absolute inset-x-5 bottom-[116px] top-10 rounded-[34px] border border-white/7 bg-[#0b0b0b] opacity-35"
              style={{ rotate: useTransform(x, [-220, 0, 220], [-3, 0, 3]) }}
            />
            <motion.div
              aria-hidden
              className="absolute inset-x-4 bottom-[108px] top-7 rounded-[34px] border border-white/7 bg-[linear-gradient(180deg,#0f0f0f_0%,#080808_100%)] opacity-55"
              style={{ rotate: useTransform(x, [-220, 0, 220], [-1.6, 0, 1.6]) }}
            />
          </>
        ) : null}

        <motion.div
          drag={disabled ? false : "x"}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.16}
          style={{ x, rotate, boxShadow: glow, scale: cardScale }}
          animate={controls}
          onDragEnd={async (_, info) => {
            if (disabled) return;
            if (info.offset.x > 118) await finishVote("like");
            else if (info.offset.x < -118) await finishVote("dislike");
            else controls.start({ x: 0, rotate: 0, scale: 1, transition: { type: "spring", stiffness: 360, damping: 28 } });
          }}
          className="relative z-10 h-[calc(100%-108px)] overflow-hidden rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(220,38,38,0.22),transparent_24%),linear-gradient(180deg,#121212_0%,#060606_100%)]"
        >
          <motion.div style={{ opacity: leftProgress }} className="absolute inset-0 bg-gradient-to-br from-red-500/32 via-red-500/8 to-transparent" />
          <motion.div style={{ opacity: rightProgress }} className="absolute inset-0 bg-gradient-to-bl from-emerald-500/30 via-emerald-500/7 to-transparent" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.08),transparent_20%)]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

          <motion.div style={{ opacity: leftProgress, scale: leftScale }} className="absolute left-5 top-5 z-20 rounded-2xl border-2 border-red-400/90 bg-red-500/14 px-4 py-2 text-[14px] font-black uppercase tracking-[0.22em] text-red-100">NOPE</motion.div>
          <motion.div style={{ opacity: rightProgress, scale: rightScale }} className="absolute right-5 top-5 z-20 rounded-2xl border-2 border-emerald-400/90 bg-emerald-500/14 px-4 py-2 text-[14px] font-black uppercase tracking-[0.22em] text-emerald-100">JOIN</motion.div>

          <div className="relative flex h-full flex-col justify-between p-5">
            <div className="flex items-center justify-between gap-3 text-[11px] font-bold uppercase tracking-[0.16em] text-white/90">
              <span className="rounded-full bg-violet-500/22 px-3 py-1 text-violet-100">{new Date(hangout.fecha_hora).toLocaleDateString([], { month: "short", day: "numeric" })} · {new Date(hangout.fecha_hora).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              <span className="rounded-full bg-emerald-500/18 px-3 py-1 text-emerald-100">{spotsLeft} plazas libres</span>
            </div>

            <div className="rounded-[30px] border border-white/10 bg-black/40 p-5 backdrop-blur-md">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em]">
                <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-white/88">{hangout.vibe}</span>
                <span className="rounded-full border border-red-400/15 bg-red-500 px-3 py-1 text-white">{hangout.priceLabel}</span>
              </div>

              <h1 className="mt-4 text-[2.9rem] font-black leading-[0.93] tracking-[-0.04em] text-white">{hangout.titulo}</h1>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-stone-200">
                <span className="font-semibold">{hangout.pizzeria_nombre}</span>
                <span className="inline-flex items-center gap-1 text-stone-400"><MapPin className="h-3.5 w-3.5" />{hangout.place?.neighborhood || "NYC"}</span>
              </div>
              <p className="mt-4 text-[16px] leading-8 text-stone-200/90">{hangout.descripcion}</p>
            </div>

            <div className="space-y-3">
              <div className="rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-3">
                <div className="text-xs text-stone-400">Creado por</div>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br ${hangout.host?.avatar_color || "from-red-500 to-orange-500"} text-sm font-bold text-white`}>{avatarLabel(hangout.host)}</div>
                    <div className="min-w-0">
                      <div className="truncate font-bold text-white">{hangout.host?.full_name || hangout.creador_nombre}</div>
                      <div className="truncate text-sm text-stone-400">{hangout.place?.borough || "New York"}</div>
                    </div>
                  </div>
                  <div className="flex -space-x-2">
                    {hangout.participants.slice(0, 4).map((person) => (
                      <div key={person.email} className={`flex h-9 w-9 items-center justify-center rounded-full border border-black/40 bg-gradient-to-br ${person.avatar_color || "from-stone-500 to-stone-700"} text-[11px] font-bold text-white`}>{avatarLabel(person)}</div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] border border-white/8 bg-white/[0.03] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="inline-flex items-center gap-2 text-stone-200"><Users className="h-4 w-4 text-stone-400" /><span className="font-semibold">{hangout.joined_count} / {hangout.max_participantes || hangout.joined_count} going</span></div>
                  <div className="text-sm text-stone-400">Swipe or tap a button</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="relative z-20 flex shrink-0 items-center justify-center gap-10 pt-2">
        <div className="flex flex-col items-center gap-2">
          <button type="button" disabled={disabled} onClick={() => finishVote("dislike")} className="grid h-[74px] w-[74px] place-items-center rounded-full border border-white/12 bg-[#101010] text-stone-300 shadow-[0_16px_34px_rgba(0,0,0,0.48)] backdrop-blur-md transition hover:border-red-400/45 hover:text-red-200 disabled:opacity-60"><X className="h-8 w-8" /></button>
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">Skip</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <button type="button" disabled={disabled} onClick={() => finishVote("like")} className="grid h-[82px] w-[82px] place-items-center rounded-full bg-red-600 text-white shadow-[0_18px_44px_rgba(220,38,38,0.42)] transition hover:scale-[1.02] hover:bg-red-500 disabled:opacity-60"><Heart className="h-9 w-9 fill-current" /></button>
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-500">Join</span>
        </div>
      </div>
    </div>
  );
}

export default function Descubrir() {
  const [user, setUser] = useState(null);
  const [joinedToast, setJoinedToast] = useState(null);
  const [pendingDecisionIds, setPendingDecisionIds] = useState([]);
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

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

  const visible = useMemo(() => hangouts.filter((item) => !item.skipped && !item.joined && !pendingDecisionIds.includes(item.id)), [hangouts, pendingDecisionIds]);
  const focusId = searchParams.get("focus");
  const orderedVisible = useMemo(() => {
    if (!focusId) return visible;
    const focused = visible.find((item) => item.id === focusId);
    if (!focused) return visible;
    return [focused, ...visible.filter((item) => item.id !== focusId)];
  }, [visible, focusId]);
  const current = orderedVisible[0];
  const next = orderedVisible[1];

  const mutate = useMutation({
    mutationFn: async ({ id, decision }) => base44.functions.invoke("recordarInteres", { quedada_id: id, tipo_interes: decision }),
    onMutate: ({ id }) => setPendingDecisionIds((currentIds) => [...currentIds, id]),
    onError: (_, vars) => setPendingDecisionIds((currentIds) => currentIds.filter((id) => id !== vars.id)),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["discover-hangouts-v5", user?.email] });
      queryClient.invalidateQueries({ queryKey: ["my-groups-v6", user?.email] });
      queryClient.invalidateQueries({ queryKey: ["active-hangouts"] });
      if (vars.decision === "like") {
        const joined = hangouts.find((item) => item.id === vars.id);
        setJoinedToast(joined);
        window.setTimeout(() => setJoinedToast(null), 2200);
      }
      if (focusId === vars.id) {
        setSearchParams((params) => {
          const next = new URLSearchParams(params);
          next.delete("focus");
          return next;
        }, { replace: true });
      }
      setPendingDecisionIds((currentIds) => currentIds.filter((id) => id !== vars.id));
    },
  });

  if (!user || isLoading) return <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-[#060606] text-white">Cargando…</div>;

  if (!current) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#060606] px-4 py-8">
        <div className="mx-auto max-w-md rounded-[30px] border border-white/10 bg-[#111] p-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-white/[0.04] text-4xl">🍕</div>
          <h1 className="mt-6 text-3xl font-black text-white">No hay más planes por ahora</h1>
          <p className="mt-3 text-sm leading-7 text-stone-400">Cuando alguien proponga un plan en una pizzería aparecerá aquí para que puedas deslizar sí o no.</p>
          <div className="mt-6 grid gap-3">
            <Link to={createPageUrl("CrearQuedada")} className="inline-flex h-12 items-center justify-center rounded-2xl bg-red-600 text-sm font-bold text-white">Crear un plan</Link>
            <Link to={createPageUrl("MisMatches") + (joinedToast ? `?focus=${joinedToast.id}` : "") } className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-sm font-bold text-stone-200">Ver mis grupos</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-64px)] overflow-hidden bg-[#060606] px-4 py-4">
      <div className="mx-auto flex h-full max-w-md flex-col">
        <div className="mb-3 text-center">
          <div className="text-[12px] font-black uppercase tracking-[0.22em] text-red-300/95">Discover plans</div>
          <div className="mt-1 text-sm text-stone-400">Swipe right to join. Swipe left to skip.</div>
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
                <div className="min-w-0"><div className="font-bold">You joined the group</div><div className="truncate text-sm text-emerald-50/90">{joinedToast.titulo}</div></div>
              </div>
              <Link to={createPageUrl("MisMatches")} className="text-sm font-bold text-white/95">Open</Link>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
