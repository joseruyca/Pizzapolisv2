import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, DollarSign, MapPin, Settings2, Star, Users, X } from "lucide-react";
import LoginPrompt from "@/components/shared/LoginPrompt";
import { useAuth } from "@/lib/AuthContext";
import { createPageUrl } from "@/utils";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/place-helpers";

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
    };
  });
}

function FilterChip({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2.5 text-sm font-semibold transition whitespace-nowrap ${active ? "bg-[#efbf3a] text-[#141414] shadow-[0_10px_26px_rgba(239,191,58,0.22)]" : "bg-white text-[#6d665b] border border-black/8"}`}
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

export default function Descubrir() {
  const { user } = useAuth();
  const [index, setIndex] = useState(0);
  const [loginPrompt, setLoginPrompt] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [maxPrice, setMaxPrice] = useState(10);
  const [minSeatsLeft, setMinSeatsLeft] = useState(1);
  const [minRating, setMinRating] = useState(0);
  const [sortMode, setSortMode] = useState("all");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["discover-plans"],
    queryFn: fetchDiscoverPlans,
  });

  const filtered = useMemo(() => {
    let next = plans.filter((plan) => {
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
  }, [plans, maxPrice, minSeatsLeft, minRating, sortMode]);

  React.useEffect(() => {
    if (index > filtered.length - 1) setIndex(0);
  }, [filtered.length, index]);

  const current = filtered[index] || null;

  const joinMutation = useMutation({
    mutationFn: async () => {
      if (!user || !current) throw new Error("Login required");
      const { error } = await supabase.from("plan_members").upsert({
        plan_id: current.id,
        user_id: user.id,
        status: "joined",
      }, { onConflict: "plan_id,user_id" });
      if (error) throw error;
      return true;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["discover-plans"] });
      navigate(createPageUrl("MisMatches"));
    },
  });

  const handleJoin = async () => {
    if (!user) {
      setLoginPrompt(true);
      return;
    }
    await joinMutation.mutateAsync();
  };

  const handleSkip = () => {
    if (filtered.length <= 1) return;
    setIndex((prev) => Math.min(prev + 1, filtered.length - 1));
  };

  const handleBackCard = () => {
    setIndex((prev) => Math.max(prev - 1, 0));
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#f3eee6] text-[#141414]">
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col overflow-hidden border-x border-black/6 bg-[#f3eee6] px-4 pt-5 pb-4">
        <div className="shrink-0">
          <div className="flex items-start justify-between gap-3">
            <button
              type="button"
              onClick={() => navigate(createPageUrl("Home"))}
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-black/10 bg-white text-[#141414]"
              aria-label="Back to map"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-black uppercase tracking-[0.22em] text-[#8a8174]">Tonight</div>
              <h1 className="mt-1 text-[3rem] leading-[0.92] font-black tracking-tight text-[#141414]">Descubrir planes</h1>
            </div>
            <button
              type="button"
              onClick={() => setFiltersOpen((prev) => !prev)}
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-black/10 bg-white text-[#141414]"
              aria-label="Toggle filters"
            >
              <Settings2 className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {filtersOpen ? (
              <div className="rounded-[28px] border border-black/8 bg-white p-4 shadow-[0_12px_30px_rgba(39,29,14,0.06)]">
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#141414]">
                      <DollarSign className="h-4 w-4 text-[#dbab23]" />
                      Max slice price
                    </div>
                    <input type="range" min="3" max="15" step="0.5" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full accent-red-500" />
                    <div className="mt-1 flex items-center justify-between text-sm text-[#8e8578]"><span>$3</span><span className="font-black text-[#141414]">${maxPrice.toFixed(0)}</span><span>$15</span></div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#141414]">
                      <Users className="h-4 w-4 text-[#dbab23]" />
                      Minimum free spots
                    </div>
                    <input type="range" min="1" max="6" step="1" value={minSeatsLeft} onChange={(e) => setMinSeatsLeft(Number(e.target.value))} className="w-full accent-red-500" />
                    <div className="mt-1 flex items-center justify-between text-sm text-[#8e8578]"><span>1</span><span className="font-black text-[#141414]">{minSeatsLeft}+</span><span>6</span></div>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#141414]">
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
                </div>
              </div>
            ) : null}

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <FilterChip active={sortMode === "cheap"} onClick={() => setSortMode("cheap")}>Cheap first</FilterChip>
              <FilterChip active={sortMode === "mid"} onClick={() => setSortMode("mid")}>Mid range</FilterChip>
              <FilterChip active={sortMode === "all"} onClick={() => setSortMode("all")}>All plans</FilterChip>
              <FilterChip active={sortMode === "top"} onClick={() => setSortMode("top")}>Top rated</FilterChip>
              <FilterChip active={sortMode === "spots"} onClick={() => setSortMode("spots")}>More spots</FilterChip>
            </div>
          </div>
        </div>

        <div className="mt-4 min-h-0 flex-1 overflow-hidden">
          {isLoading ? (
            <div className="grid h-full place-items-center rounded-[30px] border border-black/8 bg-white">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-stone-300 border-t-red-500" />
            </div>
          ) : current ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.22}
                onDragEnd={(_, info) => {
                  if (info.offset.x <= -120) handleSkip();
                  if (info.offset.x >= 120) handleJoin();
                }}
                initial={{ opacity: 0, y: 18, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, y: -12, scale: 0.985 }}
                transition={{ type: "spring", damping: 28, stiffness: 320 }}
                className="flex h-full min-h-0 flex-col overflow-hidden rounded-[32px] border border-black/8 bg-[#fbf6ed] p-4 shadow-[0_24px_60px_rgba(39,29,14,0.12)]"
              >
                <div className="relative h-[25vh] min-h-[180px] max-h-[220px] shrink-0 overflow-hidden rounded-[28px] border border-black/8 bg-black">
                  {current.spot?.photo_url ? <img src={current.spot.photo_url} alt={current.spot?.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-6xl">🍕</div>}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/70" />
                  <div className="absolute left-4 top-4 rounded-full bg-black/75 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#efbf3a]">Slice plan</div>
                  <div className="absolute right-4 top-4 rounded-full bg-black/75 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#7bc18a]">{Math.max(current.max_people - current.joined_count, 0)} spots left</div>
                </div>

                <div className="mt-4 flex min-h-0 flex-1 flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8a8174]">{current.plan_date} · {String(current.plan_time).slice(0, 5)}</div>
                      <h2 className="mt-2 text-[2rem] font-black leading-none text-[#141414]" style={clampTwoLines}>{current.title}</h2>
                    </div>
                    <div className="shrink-0 rounded-full border border-black/8 bg-white px-3 py-2 text-sm font-black text-[#141414]">{formatPrice(current.slice_price)}</div>
                  </div>

                  <div className="flex items-start gap-3 text-[#605747]">
                    <MapPin className="mt-1 h-4 w-4 shrink-0 text-[#df5b43]" />
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-[#141414]" style={clampOneLine}>{current.spot?.name || "Pizza spot"}</div>
                      <div className="text-sm leading-6" style={clampThreeLines}>{current.spot?.address || "NYC"}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-[22px] border border-black/8 bg-[#fffaf2] p-3">
                      <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8a8174]">People</div>
                      <div className="mt-2 text-xl font-black text-[#141414]">{current.joined_count}/{current.max_people}</div>
                    </div>
                    <div className="rounded-[22px] border border-black/8 bg-[#fffaf2] p-3">
                      <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8a8174]">Rating</div>
                      <div className="mt-2 flex items-center gap-1 text-xl font-black text-[#141414]"><Star className="h-4 w-4 fill-[#efbf3a] text-[#efbf3a]" />{Number(current.average_rating || 0).toFixed(1)}</div>
                    </div>
                    <div className="rounded-[22px] border border-black/8 bg-[#fffaf2] p-3">
                      <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#8a8174]">Best slice</div>
                      <div className="mt-2 text-sm font-black leading-tight text-[#141414]" style={clampTwoLines}>{current.best_slice}</div>
                    </div>
                  </div>

                  <div className="rounded-[22px] border border-black/8 bg-[#fffaf2] p-4">
                    <div className="flex items-center gap-3">
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#efbf3a] text-sm font-black text-[#141414]">{avatarLabel(current.host?.username || current.host?.email)}</div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8a8174]">Hosted by</div>
                        <div className="truncate text-lg font-black text-[#141414]">{current.host?.username || current.host?.email || "Host"}</div>
                      </div>
                    </div>
                    {current.quick_note ? <p className="mt-3 text-sm leading-6 text-[#605747]" style={clampTwoLines}>{current.quick_note}</p> : null}
                  </div>

                  <div className="mt-auto space-y-3 pt-1">
                    <div className="text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a8174]">Swipe left to skip · swipe right to join</div>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={handleBackCard}
                        disabled={index === 0}
                        className="inline-flex h-16 items-center justify-center rounded-full border border-black/10 bg-white text-[#8a8174] disabled:opacity-40"
                        aria-label="Previous plan"
                      >
                        <ArrowLeft className="h-7 w-7" />
                      </button>
                      <button
                        type="button"
                        onClick={handleSkip}
                        disabled={filtered.length <= 1 || index >= filtered.length - 1}
                        className="inline-flex h-16 items-center justify-center rounded-full bg-[#f3dcd8] text-[#d94b3d] shadow-[0_16px_32px_rgba(217,75,61,0.12)] disabled:opacity-40"
                        aria-label="Skip plan"
                      >
                        <X className="h-8 w-8" />
                      </button>
                      <button
                        type="button"
                        onClick={handleJoin}
                        disabled={joinMutation.isPending}
                        className="inline-flex h-16 items-center justify-center rounded-full bg-[#43a047] text-white shadow-[0_16px_32px_rgba(67,160,71,0.28)] disabled:opacity-60"
                        aria-label="Join plan"
                      >
                        {joinMutation.isPending ? <Users className="h-7 w-7 animate-pulse" /> : <Check className="h-8 w-8" />}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="flex h-full flex-col justify-center rounded-[30px] border border-black/8 bg-white p-8 text-center">
              <div className="mx-auto text-5xl">🍕</div>
              <h2 className="mt-4 text-2xl font-black text-[#141414]">No plans match now</h2>
              <p className="mt-2 text-sm leading-7 text-[#6d665b]">Try relaxing the filters or create your own plan.</p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <button type="button" onClick={() => navigate(createPageUrl("Home"))} className="inline-flex h-12 items-center justify-center rounded-2xl border border-black/10 bg-white px-5 text-sm font-black text-[#141414]">Back to map</button>
                <Link to={createPageUrl("CrearQuedada")} className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#efbf3a] px-5 text-sm font-black text-[#141414]">Create plan</Link>
              </div>
            </div>
          )}
        </div>
      </div>

      <LoginPrompt open={loginPrompt} onClose={() => setLoginPrompt(false)} message="Sign in to join plans and enter the group chat." />
    </div>
  );
}
