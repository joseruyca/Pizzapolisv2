import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, DollarSign, MapPin, Settings2, Star, Users, X } from "lucide-react";
import LoginPrompt from "@/components/shared/LoginPrompt";
import { useAuth } from "@/lib/AuthContext";
import { createPageUrl } from "@/utils";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/place-helpers";
import { toast } from "@/components/ui/use-toast";

async function resolveSpotPhoto(value) {
  if (!value) return null;
  if (String(value).startsWith("http")) return value;
  const { data } = await supabase.storage.from("spot-photos").createSignedUrl(value, 60 * 60);
  return data?.signedUrl || null;
}

function avatarLabel(text) {
  return text?.slice(0, 1)?.toUpperCase() || "?";
}

async function fetchDiscoverPlans() {
  const { data: plans, error } = await supabase
    .from("plans")
    .select("id,title,plan_date,plan_time,max_people,quick_note,status,created_by,spot_id")
    .eq("status", "active")
    .order("plan_date", { ascending: true });
  if (error) throw error;

  const rows = plans || [];
  const creatorIds = Array.from(new Set(rows.map((row) => row.created_by).filter(Boolean)));
  const spotIds = Array.from(new Set(rows.map((row) => row.spot_id).filter(Boolean)));

  const [{ data: profiles }, { data: spots }, { data: members }] = await Promise.all([
    creatorIds.length ? supabase.from("profiles").select("id,email,username,role").in("id", creatorIds) : Promise.resolve({ data: [] }),
    spotIds.length
      ? supabase.from("spots").select("id,name,address,slice_price,best_slice,photo_url,quick_note,status,average_rating,ratings_count").in("id", spotIds)
      : Promise.resolve({ data: [] }),
    rows.length ? supabase.from("plan_members").select("plan_id,user_id,status").in("plan_id", rows.map((row) => row.id)) : Promise.resolve({ data: [] }),
  ]);

  const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile]));
  const resolvedSpots = await Promise.all((spots || []).map(async (spot) => ({ ...spot, photo_url: await resolveSpotPhoto(spot.photo_url) })));
  const spotMap = new Map(resolvedSpots.map((spot) => [spot.id, spot]));

  return rows.map((plan) => {
    const host = profileMap.get(plan.created_by) || null;
    const spot = spotMap.get(plan.spot_id) || null;
    const joinedMembers = (members || []).filter((member) => member.plan_id === plan.id && member.status === "joined");
    return {
      ...plan,
      host,
      spot,
      joined_count: joinedMembers.length,
      slice_price: Number(spot?.slice_price ?? 0),
      average_rating: Number(spot?.average_rating ?? 0),
      best_slice: spot?.best_slice || "Optional",
      description: plan.quick_note || spot?.quick_note || "Quick pizza plan. Easy join, clear time, no vueltas.",
    };
  });
}

function FilterChip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2.5 text-sm font-semibold transition whitespace-nowrap ${active ? "bg-[#efbf3a] text-[#141414] shadow-[0_10px_26px_rgba(239,191,58,0.22)]" : "bg-white/8 text-white border border-white/10"}`}
    >
      {children}
    </button>
  );
}

const clampOneLine = {
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const clampTwoLines = {
  display: "-webkit-box",
  WebkitLineClamp: 2,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

const clampThreeLines = {
  display: "-webkit-box",
  WebkitLineClamp: 3,
  WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

function SwipeBadge({ side, visible }) {
  return (
    <div
      className={`pointer-events-none absolute top-5 z-20 ${side === "left" ? "left-5" : "right-5"} rounded-full border px-4 py-2 text-sm font-black uppercase tracking-[0.18em] transition-all duration-150 ${
        side === "left"
          ? visible
            ? "border-[#d94b3d] bg-[#fff1ef] text-[#d94b3d] opacity-100"
            : "border-[#d94b3d]/25 bg-white/80 text-[#d94b3d]/55 opacity-0"
          : visible
            ? "border-[#43a047] bg-[#edf8ee] text-[#43a047] opacity-100"
            : "border-[#43a047]/25 bg-white/80 text-[#43a047]/55 opacity-0"
      }`}
    >
      {side === "left" ? "Nope" : "Like"}
    </div>
  );
}

function StatBox({ label, children }) {
  return (
    <div className="rounded-[18px] border border-black/8 bg-[#fffaf2] p-3">
      <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8a8174]">{label}</div>
      <div className="mt-1 text-base font-black leading-tight text-[#141414]">{children}</div>
    </div>
  );
}

function DiscoverCard({ current, onSkip, onJoin }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-240, 0, 240], [-12, 0, 12]);
  const leftOpacity = useTransform(x, [-240, -60, 0], [1, 0.9, 0]);
  const rightOpacity = useTransform(x, [0, 60, 240], [0, 0.9, 1]);
  const tintOpacity = useTransform(x, [-240, -70, 0, 70, 240], [0.42, 0.24, 0, 0.24, 0.42]);
  const tintColor = useTransform(x, [-240, 0, 240], ["rgba(217,75,61,1)", "rgba(0,0,0,0)", "rgba(67,160,71,1)"]);
  const borderColor = useTransform(
    x,
    [-240, -70, 0, 70, 240],
    ["rgba(217,75,61,1)", "rgba(217,75,61,0.85)", "rgba(255,255,255,0.08)", "rgba(67,160,71,0.85)", "rgba(67,160,71,1)"]
  );
  const glow = useTransform(
    x,
    [-240, -70, 0, 70, 240],
    [
      "0 32px 86px rgba(217,75,61,0.28)",
      "0 26px 66px rgba(217,75,61,0.18)",
      "0 24px 60px rgba(0,0,0,0.34)",
      "0 26px 66px rgba(67,160,71,0.18)",
      "0 32px 86px rgba(67,160,71,0.28)",
    ]
  );
  const seatsLeft = Math.max(current.max_people - current.joined_count, 0);

  const triggerExit = (direction) => {
    animate(x, direction === "left" ? -320 : 320, {
      type: "spring",
      stiffness: 280,
      damping: 28,
      onComplete: () => {
        if (direction === "left") onSkip();
        else onJoin();
        x.set(0);
      },
    });
  };

  return (
    <motion.div
      key={current.id}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.16}
      dragMomentum={false}
      style={{ x, rotate, borderColor, boxShadow: glow }}
      onDragEnd={(_, info) => {
        if (info.offset.x <= -95) {
          triggerExit("left");
          return;
        }
        if (info.offset.x >= 95) {
          triggerExit("right");
          return;
        }
        animate(x, 0, { type: "spring", stiffness: 380, damping: 30 });
      }}
      initial={{ opacity: 0, y: 16, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.985 }}
      transition={{ type: "spring", damping: 28, stiffness: 320 }}
      className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-[30px] border bg-[#f5efe5] p-3"
    >
      <motion.div style={{ opacity: leftOpacity }}><SwipeBadge side="left" visible /></motion.div>
      <motion.div style={{ opacity: rightOpacity }}><SwipeBadge side="right" visible /></motion.div>
      <motion.div className="pointer-events-none absolute inset-0 z-0 rounded-[30px]" style={{ backgroundColor: tintColor, opacity: tintOpacity }} />

      <div className="relative z-10 flex h-full min-h-0 flex-col">
        <div className="relative h-[21vh] min-h-[148px] max-h-[200px] shrink-0 overflow-hidden rounded-[24px] border border-black/10 bg-black">
          {current.spot?.photo_url ? (
            <img src={current.spot.photo_url} alt={current.spot?.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-6xl">🍕</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/18 via-black/12 to-black/72" />
          <div className="absolute left-3 top-3 rounded-full bg-black/82 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#efbf3a]">Slice plan</div>
          <div className="absolute right-3 top-3 rounded-full bg-black/82 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#7bc18a]">{seatsLeft} spots left</div>
        </div>

        <div className="mt-3 flex min-h-0 flex-1 flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8a8174]">
                {current.plan_date} · {String(current.plan_time).slice(0, 5)}
              </div>
              <h2 className="mt-1 text-[clamp(1.7rem,6.3vw,2.2rem)] font-black leading-[0.9] tracking-[-0.05em] text-[#141414]" style={clampTwoLines}>
                {current.title}
              </h2>
            </div>
            <div className="shrink-0 rounded-full border border-black/10 bg-white px-3 py-2 text-base font-black text-[#141414]">
              {formatPrice(current.slice_price)}
            </div>
          </div>

          <div className="rounded-[20px] border border-black/8 bg-[#fffaf2] p-3.5">
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8a8174]">Plan description</div>
            <p className="mt-2 text-[15px] font-semibold leading-6 text-[#141414]" style={clampThreeLines}>
              {current.description}
            </p>
          </div>

          <div className="flex items-start gap-2.5 text-[#605747]">
            <MapPin className="mt-1 h-4 w-4 shrink-0 text-[#df5b43]" />
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-[#141414]" style={clampOneLine}>{current.spot?.name || "Pizza spot"}</div>
              <div className="text-sm leading-6" style={clampTwoLines}>{current.spot?.address || "NYC"}</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <StatBox label="People">{current.joined_count}/{current.max_people}</StatBox>
            <StatBox label="Rating"><span className="flex items-center gap-1"><Star className="h-4 w-4 fill-[#efbf3a] text-[#efbf3a]" />{Number(current.average_rating || 0).toFixed(1)}</span></StatBox>
            <StatBox label="Best"><span style={clampTwoLines}>{current.best_slice}</span></StatBox>
          </div>

          <div className="rounded-[20px] border border-black/8 bg-[#fffaf2] p-3">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#efbf3a] text-sm font-black text-[#141414]">{avatarLabel(current.host?.username || current.host?.email)}</div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8a8174]">Hosted by</div>
                <div className="truncate text-base font-black text-[#141414]">{current.host?.username || current.host?.email || "Host"}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Descubrir() {
  const { user } = useAuth();
  const [index, setIndex] = useState(0);
  const [loginPrompt, setLoginPrompt] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [maxPrice, setMaxPrice] = useState(10);
  const [minSeatsLeft, setMinSeatsLeft] = useState(1);
  const [minRating, setMinRating] = useState(0);
  const [sortMode, setSortMode] = useState("all");
  const [dismissedIds, setDismissedIds] = useState([]);
  const [joinedHiddenIds, setJoinedHiddenIds] = useState([]);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["discover-plans"],
    queryFn: fetchDiscoverPlans,
  });

  const { data: joinedPlanIds = [] } = useQuery({
    queryKey: ["discover-joined-plan-ids", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plan_members")
        .select("plan_id,status")
        .eq("user_id", user.id)
        .eq("status", "joined");
      if (error) throw error;
      return (data || []).map((row) => row.plan_id);
    },
  });

  const filtered = useMemo(() => {
    const blockedIds = new Set([...(dismissedIds || []), ...(joinedHiddenIds || []), ...(joinedPlanIds || [])]);
    let next = plans.filter((plan) => {
      if (blockedIds.has(plan.id)) return false;
      const seatsLeft = Math.max((plan.max_people || 0) - (plan.joined_count || 0), 0);
      const price = Number(plan.slice_price || 0);
      const rating = Number(plan.average_rating || 0);
      return price <= maxPrice && seatsLeft >= minSeatsLeft && rating >= minRating;
    });

    if (sortMode === "cheap") next = [...next].sort((a, b) => Number(a.slice_price || 0) - Number(b.slice_price || 0));
    if (sortMode === "mid") next = [...next].sort((a, b) => Math.abs(Number(a.slice_price || 0) - 6) - Math.abs(Number(b.slice_price || 0) - 6));
    if (sortMode === "top") next = [...next].sort((a, b) => Number(b.average_rating || 0) - Number(a.average_rating || 0));
    if (sortMode === "spots") next = [...next].sort((a, b) => ((b.max_people || 0) - (b.joined_count || 0)) - ((a.max_people || 0) - (a.joined_count || 0)));

    return next;
  }, [plans, maxPrice, minSeatsLeft, minRating, sortMode, dismissedIds, joinedHiddenIds, joinedPlanIds]);

  React.useEffect(() => {
    if (index > filtered.length - 1) setIndex(0);
  }, [filtered.length, index]);

  const current = filtered[index] || null;

  const joinMutation = useMutation({
    mutationFn: async () => {
      if (!user || !current) throw new Error("Login required");
      const { error } = await supabase.from("plan_members").upsert(
        {
          plan_id: current.id,
          user_id: user.id,
          status: "joined",
        },
        { onConflict: "plan_id,user_id" }
      );
      if (error) throw error;
      return true;
    },
    onSuccess: async () => {
      setJoinedHiddenIds((prev) => [...new Set([...prev, current.id])]);
      toast({
        title: "Te has unido al plan",
        description: "Ya estás dentro del grupo. Puedes seguir deslizando.",
      });
      await queryClient.invalidateQueries({ queryKey: ["discover-plans"] });
      await queryClient.invalidateQueries({ queryKey: ["discover-joined-plan-ids", user?.id] });
      await queryClient.invalidateQueries({ queryKey: ["my-groups-supabase", user?.id] });
      setIndex(0);
    },
  });

  const handleJoin = async () => {
    if (!current) return;
    if (!user) {
      setLoginPrompt(true);
      return;
    }
    await joinMutation.mutateAsync();
  };

  const handleSkip = () => {
    if (!current) return;
    setDismissedIds((prev) => [...new Set([...prev, current.id])]);
    setIndex(0);
  };

  return (
    <div className="h-dvh overflow-hidden bg-[#050505] text-white">
      <div className="mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden bg-[#050505] px-4 pb-4 pt-5">
        <div className="relative shrink-0">
          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate(createPageUrl("Home"))}
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/10 bg-white/6 text-white backdrop-blur-sm"
              aria-label="Back to map"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="text-center text-[11px] font-black uppercase tracking-[0.24em] text-white/48">Swipe plans</div>
            <button
              type="button"
              onClick={() => setFiltersOpen((prev) => !prev)}
              className={`grid h-12 w-12 shrink-0 place-items-center rounded-full border border-white/10 ${filtersOpen ? "bg-[#efbf3a] text-[#141414]" : "bg-white/6 text-white"}`}
              aria-label="Toggle filters"
            >
              <Settings2 className="h-5 w-5" />
            </button>
          </div>

          <AnimatePresence>
            {filtersOpen ? (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute inset-x-0 top-[calc(100%+12px)] z-30 rounded-[28px] border border-white/10 bg-[#111111] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.42)]"
              >
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-sm font-bold text-white">
                      <DollarSign className="h-4 w-4 text-[#dbab23]" />
                      Max slice price
                    </div>
                    <input type="range" min="3" max="15" step="0.5" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full accent-[#df5b43]" />
                    <div className="mt-1 flex items-center justify-between text-sm text-white/50"><span>$3</span><span className="font-black text-white">${maxPrice.toFixed(0)}</span><span>$15</span></div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center gap-2 text-sm font-bold text-white">
                      <Users className="h-4 w-4 text-[#dbab23]" />
                      Minimum free spots
                    </div>
                    <input type="range" min="1" max="6" step="1" value={minSeatsLeft} onChange={(e) => setMinSeatsLeft(Number(e.target.value))} className="w-full accent-[#df5b43]" />
                    <div className="mt-1 flex items-center justify-between text-sm text-white/50"><span>1</span><span className="font-black text-white">{minSeatsLeft}+</span><span>6</span></div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center gap-2 text-sm font-bold text-white">
                      <Star className="h-4 w-4 text-[#dbab23]" />
                      Minimum rating
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {[0, 3, 4, 4.5].map((value) => (
                        <FilterChip key={value} active={minRating === value} onClick={() => setMinRating(value)}>
                          {value === 0 ? "Any" : `${value}+`}
                        </FilterChip>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 text-sm font-bold text-white">Sort plans</div>
                    <div className="flex flex-wrap gap-2">
                      <FilterChip active={sortMode === "all"} onClick={() => setSortMode("all")}>All plans</FilterChip>
                      <FilterChip active={sortMode === "cheap"} onClick={() => setSortMode("cheap")}>Cheap first</FilterChip>
                      <FilterChip active={sortMode === "mid"} onClick={() => setSortMode("mid")}>Mid range</FilterChip>
                      <FilterChip active={sortMode === "top"} onClick={() => setSortMode("top")}>Top rated</FilterChip>
                      <FilterChip active={sortMode === "spots"} onClick={() => setSortMode("spots")}>More spots</FilterChip>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        <div className="relative mt-4 flex min-h-0 flex-1 flex-col overflow-hidden pt-2">
          {isLoading ? (
            <div className="grid h-full place-items-center rounded-[32px] border border-white/10 bg-[#111111]">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-stone-700 border-t-[#df5b43]" />
            </div>
          ) : current ? (
            <>
              <div className="min-h-0 flex-1 overflow-hidden pb-[5.2rem]">
                <AnimatePresence mode="wait">
                  <DiscoverCard key={current.id} current={current} onSkip={handleSkip} onJoin={handleJoin} />
                </AnimatePresence>
              </div>

              <div className="absolute inset-x-0 bottom-0 z-20 flex items-center gap-3 px-1 pb-1 pt-4 bg-gradient-to-t from-[#050505] via-[#050505] to-transparent">
                <button
                  type="button"
                  onClick={handleSkip}
                  className="flex h-14 flex-1 items-center justify-center gap-2 rounded-[22px] border border-[#d94b3d]/25 bg-[#2a120f] text-[#ffb5ad] shadow-[0_16px_32px_rgba(217,75,61,0.12)]"
                >
                  <X className="h-5 w-5" />
                  <span className="text-sm font-black uppercase tracking-[0.16em]">Nope</span>
                </button>
                <button
                  type="button"
                  onClick={handleJoin}
                  disabled={joinMutation.isPending}
                  className="flex h-14 flex-1 items-center justify-center gap-2 rounded-[22px] bg-[#43a047] text-white shadow-[0_16px_32px_rgba(67,160,71,0.28)] disabled:opacity-60"
                >
                  {joinMutation.isPending ? <Users className="h-5 w-5 animate-pulse" /> : <Check className="h-5 w-5" />}
                  <span className="text-sm font-black uppercase tracking-[0.16em]">Like</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col justify-center rounded-[32px] border border-white/10 bg-[#111111] p-8 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-white/[0.04] text-4xl">🍕</div>
              <h1 className="mt-6 text-3xl font-black text-white">No hay más planes ahora mismo</h1>
              <p className="mt-3 text-sm leading-7 text-stone-400">Prueba a relajar filtros o vuelve más tarde.</p>
              <button
                type="button"
                onClick={() => navigate(createPageUrl("Home"))}
                className="mt-6 inline-flex h-12 items-center justify-center rounded-2xl bg-red-600 px-5 text-sm font-bold text-white"
              >
                Volver al mapa
              </button>
            </div>
          )}
        </div>
      </div>

      <LoginPrompt open={loginPrompt} onClose={() => setLoginPrompt(false)} message="Sign in to join plans and enter the group chat." />
    </div>
  );
}
