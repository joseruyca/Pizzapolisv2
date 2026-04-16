import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  AnimatePresence,
  motion,
  useAnimationControls,
  useMotionTemplate,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  ChevronLeft,
  Clock3,
  DollarSign,
  MapPin,
  Settings2,
  Users,
  X,
  Moon,
  Sparkles,
} from "lucide-react";
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

function imageForVibe(vibe) {
  const v = (vibe || "").toLowerCase();
  if (v.includes("late")) return "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1200&auto=format&fit=crop";
  if (v.includes("budget")) return "https://images.unsplash.com/photo-1528137871618-79d2761e3fd5?q=80&w=1200&auto=format&fit=crop";
  if (v.includes("premium") || v.includes("foodie")) return "https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?q=80&w=1200&auto=format&fit=crop";
  return "https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=1200&auto=format&fit=crop";
}

function FilterChip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${
        active ? "bg-red-500 text-white shadow-[0_0_24px_rgba(239,68,68,0.45)]" : "bg-white/[0.06] text-stone-300"
      }`}
    >
      {children}
    </button>
  );
}

function FilterSheet({ open, filters, setFilters, onClose }) {
  if (!open) return null;

  const toggleWhen = (value) => {
    setFilters((current) => ({ ...current, when: current.when === value ? "all" : value }));
  };

  const toggleVibe = (value) => {
    setFilters((current) => ({ ...current, vibe: current.vibe === value ? "all" : value }));
  };

  const vibes = [
    ["Casual", "🍕"],
    ["Foodie Crew", "🧑‍🍳"],
    ["Adventure Mode", "🗺️"],
    ["Low-Key Hangout", "✨"],
  ];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[1600] bg-black/72 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 16, opacity: 0.8 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 16, opacity: 0.8 }}
          transition={{ type: "spring", stiffness: 280, damping: 28 }}
          className="absolute inset-x-4 top-6 bottom-6 mx-auto max-w-md overflow-hidden rounded-[28px] border border-white/10 bg-[#151515] shadow-[0_30px_90px_rgba(0,0,0,0.62)]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-white/8 px-5 py-5 shrink-0">
              <h2 className="text-2xl font-black text-white">Filters</h2>
              <button type="button" onClick={onClose} className="text-stone-400 transition hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 space-y-7">
              <div>
                <div className="mb-4 flex items-center gap-2 text-sm font-bold text-white"><DollarSign className="h-4 w-4 text-red-400" />Max Slice Price</div>
                <div className="px-1">
                  <input
                    type="range"
                    min="3"
                    max="15"
                    step="0.5"
                    value={filters.maxPrice}
                    onChange={(event) => setFilters((current) => ({ ...current, maxPrice: Number(event.target.value) }))}
                    className="w-full accent-red-500"
                  />
                  <div className="mt-3 flex items-center justify-between text-sm text-stone-500">
                    <span>$3</span>
                    <span className="text-lg font-black text-white">${filters.maxPrice.toFixed(0)}</span>
                    <span>$15</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-4 flex items-center gap-2 text-sm font-bold text-white"><Clock3 className="h-4 w-4 text-red-400" />When</div>
                <div className="flex flex-wrap gap-3">
                  <FilterChip active={filters.when === "today"} onClick={() => toggleWhen("today")}>Today</FilterChip>
                  <FilterChip active={filters.when === "tomorrow"} onClick={() => toggleWhen("tomorrow")}>Tomorrow</FilterChip>
                  <FilterChip active={filters.when === "week"} onClick={() => toggleWhen("week")}>This Week</FilterChip>
                </div>
              </div>

              <div className="rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-base font-bold text-white"><Moon className="h-4 w-4 text-stone-300" />Late Night Only</div>
                    <div className="mt-1 text-sm text-stone-400">After 9 PM</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFilters((current) => ({ ...current, lateNightOnly: !current.lateNightOnly }))}
                    className={`relative h-7 w-12 rounded-full transition ${filters.lateNightOnly ? "bg-red-500" : "bg-white/12"}`}
                  >
                    <span className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${filters.lateNightOnly ? "left-6" : "left-1"}`} />
                  </button>
                </div>
              </div>

              <div>
                <div className="mb-4 flex items-center gap-2 text-sm font-bold text-white"><Sparkles className="h-4 w-4 text-red-400" />Vibes</div>
                <div className="grid grid-cols-2 gap-3">
                  {vibes.map(([value, icon]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleVibe(value)}
                      className={`rounded-[20px] border px-4 py-5 text-left transition ${filters.vibe === value ? "border-red-500/30 bg-red-500/10" : "border-white/8 bg-white/[0.03]"}`}
                    >
                      <div className="text-2xl">{icon}</div>
                      <div className="mt-3 text-base font-semibold text-white">{value}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-white/8 px-5 py-4 shrink-0 bg-[#151515]">
              <button
                type="button"
                onClick={() => setFilters({ maxPrice: 10, when: "all", vibe: "all", lateNightOnly: false })}
                className="h-14 rounded-2xl bg-white/[0.06] text-base font-bold text-stone-300"
              >
                Reset
              </button>
              <button type="button" onClick={onClose} className="h-14 rounded-2xl bg-red-500 text-base font-bold text-white shadow-[0_0_28px_rgba(239,68,68,0.38)]">
                Apply Filters
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


function normalizeHangout(hangout) {
  const dateValue = hangout.fecha_hora || (hangout.fecha && hangout.hora ? `${hangout.fecha}T${hangout.hora}` : null);
  const when = dateValue ? new Date(dateValue) : new Date();
  const maxParticipants = hangout.max_participantes || hangout.max_personas || 0;
  const joinedCount = hangout.joined_count || hangout.asistentes_count || hangout.participants?.length || 0;
  const placeName = hangout.pizzeria_nombre || hangout.pizza_place_name || hangout.place?.name || hangout.pizza_place?.name || 'Pizza spot';
  const neighborhood = hangout.place?.neighborhood || hangout.neighborhood || hangout.barrio || 'NYC';
  const title = hangout.titulo || hangout.title || 'Pizza plan';
  const description = hangout.descripcion || hangout.description || 'Casual slice plan with good pizza and easy vibes.';
  const hostName = hangout.host?.full_name || hangout.creador_nombre || hangout.host_name || 'Host';
  const vibe = hangout.vibe || 'Chill & Social';
  return {
    ...hangout,
    when,
    maxParticipants,
    joinedCount,
    spotsLeft: Math.max(maxParticipants - joinedCount, 0),
    placeName,
    neighborhood,
    title,
    description,
    hostName,
    vibe,
    cover: hangout.foto_url || hangout.coverImage || imageForVibe(vibe),
    priceLabel: hangout.priceLabel || formatPrice(hangout.place?.standard_slice_price || hangout.standard_slice_price || 4.5),
  };
}

function SwipeCard({ hangout, onDecision, disabled }) {
  const item = normalizeHangout(hangout);
  const controls = useAnimationControls();
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-220, 0, 220], [-6, 0, 6]);
  const joinOpacity = useTransform(x, [0, 60, 160], [0, 0.45, 1]);
  const nopeOpacity = useTransform(x, [-160, -60, 0], [1, 0.45, 0]);
  const joinScale = useTransform(x, [0, 160], [0.86, 1]);
  const nopeScale = useTransform(x, [-160, 0], [1, 0.86]);
  const overlay = useMotionTemplate`linear-gradient(180deg, rgba(0,0,0,0.06) 0%, rgba(0,0,0,0.18) 100%), linear-gradient(135deg, rgba(239,68,68,${nopeOpacity}) 0%, rgba(239,68,68,0.14) 40%, rgba(0,0,0,0) 75%), linear-gradient(225deg, rgba(16,185,129,${joinOpacity}) 0%, rgba(16,185,129,0.14) 40%, rgba(0,0,0,0) 75%)`;
  const borderColor = useTransform(x, [-180, -60, 0, 60, 180], [
    'rgba(239,68,68,0.9)',
    'rgba(239,68,68,0.28)',
    'rgba(255,255,255,0.12)',
    'rgba(16,185,129,0.28)',
    'rgba(16,185,129,0.9)',
  ]);
  const cardShadow = useMotionTemplate`0 24px 70px rgba(0,0,0,0.52), 0 0 0 1px ${borderColor}`;

  async function finishVote(decision) {
    if (disabled) return;
    const travel = typeof window !== 'undefined' ? Math.max(window.innerWidth, 540) : 540;
    await controls.start({
      x: decision === 'like' ? travel : -travel,
      rotate: decision === 'like' ? 8 : -8,
      opacity: 0,
      transition: { duration: 0.24, ease: 'easeIn' },
    });
    onDecision(item.id, decision);
    x.set(0);
    controls.set({ x: 0, rotate: 0, opacity: 1 });
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="relative flex-1 min-h-0">
        <motion.div className="pointer-events-none absolute left-5 top-5 z-20 rounded-2xl border border-red-400/70 bg-red-500/14 px-4 py-2 text-sm font-black uppercase tracking-[0.22em] text-red-200" style={{ opacity: nopeOpacity, scale: nopeScale }}>NOPE</motion.div>
        <motion.div className="pointer-events-none absolute right-5 top-5 z-20 rounded-2xl border border-emerald-400/70 bg-emerald-500/14 px-4 py-2 text-sm font-black uppercase tracking-[0.22em] text-emerald-200" style={{ opacity: joinOpacity, scale: joinScale }}>JOIN</motion.div>

        <motion.div
          drag={disabled ? false : 'x'}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.1}
          style={{ x, rotate, boxShadow: cardShadow }}
          animate={controls}
          onDragEnd={async (_, info) => {
            if (disabled) return;
            if (info.offset.x > 120) return finishVote('like');
            if (info.offset.x < -120) return finishVote('dislike');
            controls.start({ x: 0, rotate: 0, transition: { type: 'spring', stiffness: 360, damping: 30 } });
          }}
          className="relative h-full overflow-hidden rounded-[34px] border border-white/10 bg-[#121212]"
        >
          <motion.div className="absolute inset-0 z-0" style={{ background: overlay }} />
          <div className="relative z-10 flex h-full flex-col overflow-hidden">
            <div className="relative h-[38%] min-h-[170px] w-full shrink-0 overflow-hidden">
              <img src={item.cover} alt={item.placeName} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/45" />
              <div className="absolute left-4 top-4 inline-flex max-w-[74%] items-center gap-2 rounded-full bg-[#2a2a2a]/94 px-4 py-2 text-sm font-bold text-white shadow-lg">
                <span>{item.vibeEmoji || '🌙'}</span>
                <span className="truncate">{item.vibe}</span>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col px-5 py-4">
              <div className="grid grid-cols-2 gap-4 text-[13px] font-black uppercase tracking-[0.24em] text-stone-100">
                <div className="leading-5">{item.when.toLocaleDateString([], { day: '2-digit', month: 'short' }).toUpperCase()} · {item.when.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                <div className="text-right leading-5 text-emerald-200">{item.spotsLeft} spots left</div>
              </div>

              <div className="mt-3 flex flex-wrap gap-3">
                <span className="rounded-full bg-white/[0.06] px-4 py-2 text-sm font-bold uppercase tracking-[0.18em] text-white">{item.vibe.toUpperCase()}</span>
                <span className="rounded-full bg-red-500 px-4 py-2 text-sm font-black text-white">{item.priceLabel}</span>
              </div>

              <h1 className="mt-4 line-clamp-2 text-[clamp(1.8rem,5vw,2.5rem)] font-black leading-[0.94] tracking-[-0.055em] text-white">{item.title}</h1>

              <div className="mt-3">
                <div className="flex items-start gap-2 text-[17px] font-semibold text-white">
                  <MapPin className="mt-1 h-4 w-4 shrink-0 text-red-400" />
                  <div className="min-w-0">
                    <div className="truncate">{item.placeName}</div>
                    <div className="truncate text-sm font-medium text-stone-400">{item.neighborhood}</div>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3 text-[15px] leading-6 text-stone-100">
                <div className="flex items-center gap-2 truncate"><Clock3 className="h-4 w-4 shrink-0 text-stone-500" /><span className="truncate">{item.when.toLocaleDateString([], { weekday: 'long' }).replace(/^./, c => c.toUpperCase())} at {item.when.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span></div>
                <div className="flex items-center gap-2"><Users className="h-4 w-4 shrink-0 text-stone-500" />{item.joinedCount} / {item.maxParticipants || item.joinedCount} going</div>
              </div>

              <p className="mt-3 line-clamp-3 text-[15px] leading-6 text-stone-200">“{item.description}”</p>

              <div className="mt-auto border-t border-white/10 pt-4">
                <div className="flex items-center gap-3">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${item.host?.avatar_color || 'from-orange-500 to-red-500'} text-sm font-bold text-white shadow-lg`}>
                    {avatarLabel(item.host) || avatarLabel({full_name:item.hostName})}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs text-stone-500">Hosted by</div>
                    <div className="truncate font-bold text-white">{item.hostName}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="pointer-events-auto mt-4 flex shrink-0 items-center justify-center gap-4 pb-2 pl-16 pr-0">
        <button
          type="button"
          disabled={disabled}
          onClick={() => finishVote('dislike')}
          className="grid h-[58px] w-[58px] place-items-center rounded-full border border-white/10 bg-white/[0.04] text-stone-300 transition hover:border-red-400/40 hover:text-red-200 disabled:opacity-60"
        >
          <X className="h-7 w-7" />
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => finishVote('like')}
          className="grid h-[76px] w-[76px] place-items-center rounded-full bg-emerald-500 text-white shadow-[0_0_40px_rgba(16,185,129,0.36)] transition hover:scale-[1.02] disabled:opacity-60"
        >
          <Check className="h-9 w-9" />
        </button>
      </div>
    </div>
  );
}


export default function Descubrir() {
  const [user, setUser] = useState(null);
  const [joinedToast, setJoinedToast] = useState(null);
  const [pendingDecisionIds, setPendingDecisionIds] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({ maxPrice: 10, when: "all", vibe: "all", lateNightOnly: false });
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

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

  const focusId = searchParams.get("focus");
  const visible = useMemo(() => {
    const now = new Date();
    const base = hangouts.filter((item) => !item.skipped && !item.joined && !pendingDecisionIds.includes(item.id));
    return base.filter((item) => {
      const price = Number(item.place?.standard_slice_price || 0);
      if (price > filters.maxPrice) return false;
      if (filters.vibe !== "all" && item.vibe !== filters.vibe) return false;
      const date = new Date(item.fecha_hora);
      if (filters.when === "today" && date.toDateString() !== now.toDateString()) return false;
      if (filters.when === "tomorrow") {
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);
        if (date.toDateString() !== tomorrow.toDateString()) return false;
      }
      if (filters.when === "week" && (date - now) / (1000 * 60 * 60 * 24) > 7) return false;
      if (filters.lateNightOnly) {
        const hour = date.getHours();
        if (hour < 21 && hour > 3) return false;
      }
      return true;
    });
  }, [hangouts, pendingDecisionIds, filters]);

  const orderedVisible = useMemo(() => {
    if (!focusId) return visible;
    const focused = visible.find((item) => item.id === focusId);
    if (!focused) return visible;
    return [focused, ...visible.filter((item) => item.id !== focusId)];
  }, [visible, focusId]);

  const current = orderedVisible[0];

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
          const nextParams = new URLSearchParams(params);
          nextParams.delete("focus");
          return nextParams;
        }, { replace: true });
      }
      setPendingDecisionIds((currentIds) => currentIds.filter((id) => id !== vars.id));
    },
  });

  if (!user || isLoading) return <div className="flex min-h-screen items-center justify-center bg-[#060606] text-white">Loading…</div>;

  if (!current) {
    return (
      <div className="h-[100dvh] overflow-hidden bg-[#060606] px-5 py-6">
        <div className="mx-auto flex h-[calc(100dvh-48px)] max-w-md flex-col rounded-[34px] bg-[#070707] p-6 overflow-hidden">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <div className="text-3xl font-black text-white">Pizzapolis</div>
              <div className="mt-1 text-sm text-stone-400">Discover Plans</div>
            </div>
            <button type="button" onClick={() => navigate(-1)} className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-stone-200"><ChevronLeft className="h-5 w-5" /></button>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center rounded-[30px] border border-white/10 bg-[#111] p-8 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-white/[0.04] text-4xl">🍕</div>
            <h1 className="mt-6 text-3xl font-black text-white">No more plans right now</h1>
            <p className="mt-3 text-sm leading-7 text-stone-400">When someone proposes a pizza meetup, it will show up here for you to join or skip.</p>
            <div className="mt-6 grid w-full gap-3">
              <Link to={createPageUrl("CrearQuedada")} className="inline-flex h-12 items-center justify-center rounded-2xl bg-red-600 text-sm font-bold text-white">Create a plan</Link>
              <Link to={createPageUrl("MisMatches") + (joinedToast ? `?focus=${joinedToast.id}` : "")} className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-sm font-bold text-stone-200">See my groups</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="h-[100dvh] overflow-hidden bg-[#060606] px-5 py-6">
        <div className="mx-auto flex h-[calc(100dvh-48px)] max-w-md flex-col rounded-[34px] bg-[#070707] px-4 pb-5 pt-5 overflow-hidden relative">
          <div className="shrink-0 flex items-start justify-between gap-4 pb-4">
            <div>
              <div className="text-[2.15rem] font-black leading-none tracking-tight text-white">Pizzapolis</div>
              <p className="mt-1 text-[14px] font-medium text-stone-400">Discover Plans</p>
            </div>
            <button type="button" onClick={() => setFiltersOpen(true)} className="grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-stone-200 shrink-0">
              <Settings2 className="h-5 w-5" />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden pb-0">
            <SwipeCard hangout={current} disabled={mutate.isPending} onDecision={(id, decision) => mutate.mutate({ id, decision })} />
          </div>

          <button type="button" onClick={() => navigate(-1)} className="absolute bottom-7 left-4 z-30 grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-white shadow-[0_12px_40px_rgba(0,0,0,0.4)]">
            <ChevronLeft className="h-5 w-5" />
          </button>

          <AnimatePresence>
            {joinedToast ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="absolute inset-x-4 bottom-24 z-[1300] rounded-2xl border border-emerald-500/30 bg-emerald-600 px-4 py-3 text-white shadow-xl">
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
      </div>

      <FilterSheet open={filtersOpen} filters={filters} setFilters={setFilters} onClose={() => setFiltersOpen(false)} />
    </>
  );
}
