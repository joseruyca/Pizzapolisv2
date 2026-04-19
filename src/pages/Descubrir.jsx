import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Clock3, DollarSign, MapPin, Settings2, Users, X } from "lucide-react";
import LoginPrompt from "@/components/shared/LoginPrompt";
import { useAuth } from "@/lib/AuthContext";
import { createPageUrl } from "@/utils";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
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
    spotIds.length ? supabase.from("spots").select("id,name,address,slice_price,best_slice,photo_url,quick_note,status").in("id", spotIds) : Promise.resolve({ data: [] }),
    rows.length ? supabase.from("plan_members").select("plan_id,user_id,status").in("plan_id", rows.map((row) => row.id)) : Promise.resolve({ data: [] }),
  ]);

  const profileMap = new Map((profiles || []).map((profile) => [profile.id, profile]));
  const resolvedSpots = await Promise.all((spots || []).map(async (spot) => ({ ...spot, photo_url: await resolveSpotPhoto(spot.photo_url) })) );
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
      best_slice: spot?.best_slice || "Optional",
    };
  });
}

function FilterChip({ active, children, onClick }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${active ? "bg-[#efbf3a] text-[#141414] shadow-[0_10px_26px_rgba(239,191,58,0.22)]" : "bg-white text-[#6d665b] border border-black/8"}`}>
      {children}
    </button>
  );
}

export default function Descubrir() {
  const { user } = useAuth();
  const [index, setIndex] = useState(0);
  const [loginPrompt, setLoginPrompt] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [maxPrice, setMaxPrice] = useState(10);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: plans = [], isLoading } = useQuery({
    queryKey: ["discover-plans-supabase"],
    queryFn: fetchDiscoverPlans,
    enabled: Boolean(isSupabaseConfigured && supabase),
    staleTime: 10_000,
  });

  const filtered = useMemo(() => plans.filter((plan) => Number(plan.slice_price || 0) <= maxPrice), [plans, maxPrice]);
  const current = filtered[index] || null;

  const joinMutation = useMutation({
    mutationFn: async (planId) => {
      const { error } = await supabase.from("plan_members").upsert({
        plan_id: planId,
        user_id: user.id,
        status: "joined",
      }, { onConflict: 'plan_id,user_id' });
      if (error) throw error;
    },
    onSuccess: async (_data, planId) => {
      await queryClient.invalidateQueries({ queryKey: ["discover-plans-supabase"] });
      navigate(`${createPageUrl("MisMatches")}?focus=${planId}`);
    },
  });

  const nextCard = () => setIndex((currentIndex) => Math.min(currentIndex + 1, Math.max(filtered.length - 1, 0)));
  const prevCard = () => setIndex((currentIndex) => Math.max(currentIndex - 1, 0));

  if (isLoading) return <div className="min-h-screen bg-[#fffaf2]" />;

  return (
    <div className="discover-screen min-h-screen bg-[#fffaf2] px-4 py-4 pb-[120px]">
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8a8174]">Tonight</div>
            <h1 className="text-[2rem] font-black tracking-tight text-[#141414]">Descubrir planes</h1>
          </div>
          <button onClick={() => setFiltersOpen((prev) => !prev)} className="grid h-12 w-12 place-items-center rounded-full border border-black/10 bg-white text-[#141414]">
            <Settings2 className="h-5 w-5" />
          </button>
        </div>

        {filtersOpen ? (
          <div className="mt-4 rounded-[24px] border border-black/8 bg-white p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-[#141414]"><DollarSign className="h-4 w-4 text-[#dbab23]" />Max slice price</div>
            <input type="range" min="3" max="15" step="0.5" value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="mt-4 w-full accent-red-500" />
            <div className="mt-3 flex items-center justify-between text-sm text-[#8e8578]"><span>$3</span><span className="text-lg font-black text-[#141414]">${maxPrice.toFixed(0)}</span><span>$15</span></div>
          </div>
        ) : null}

        <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
          <FilterChip active={maxPrice <= 4} onClick={() => setMaxPrice(4)}>Cheap first</FilterChip>
          <FilterChip active={maxPrice <= 7 && maxPrice > 4} onClick={() => setMaxPrice(7)}>Mid range</FilterChip>
          <FilterChip active={maxPrice > 7} onClick={() => setMaxPrice(15)}>All plans</FilterChip>
        </div>

        <div className="mt-5">
          {current ? (
            <AnimatePresence mode="wait">
              <motion.div key={current.id} initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -14, scale: 0.98 }} className="rounded-[32px] border border-black/8 bg-[#fbf6ed] p-4 shadow-[0_24px_60px_rgba(39,29,14,0.12)]">
                <div className="overflow-hidden rounded-[28px] border border-black/8 bg-white">
                  <div className="relative h-56 bg-black">
                    {current.spot?.photo_url ? <img src={current.spot.photo_url} alt={current.spot?.name} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-6xl">🍕</div>}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/70" />
                    <div className="absolute left-4 top-4 rounded-full bg-black/70 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#efbf3a]">Slice plan</div>
                  </div>

                  <div className="p-5">
                    <div className="flex items-center justify-between gap-3 text-[11px] font-black uppercase tracking-[0.18em] text-[#8a8174]">
                      <span>{current.plan_date} · {String(current.plan_time).slice(0,5)}</span>
                      <span className="text-[#7bc18a]">{Math.max(current.max_people - current.joined_count, 0)} spots left</span>
                    </div>

                    <h2 className="mt-4 text-[2rem] font-black leading-none text-[#141414]">{current.title}</h2>
                    <div className="mt-4 flex items-start gap-3 text-[#605747]">
                      <MapPin className="mt-1 h-4 w-4 shrink-0 text-[#df5b43]" />
                      <div>
                        <div className="font-semibold text-[#141414]">{current.spot?.name || 'Pizza spot'}</div>
                        <div className="text-sm">{current.spot?.address || 'NYC'}</div>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <div className="rounded-[22px] border border-black/8 bg-[#fffaf2] p-4">
                        <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8a8174]">Price</div>
                        <div className="mt-2 text-3xl font-black text-[#141414]">{formatPrice(current.slice_price)}</div>
                      </div>
                      <div className="rounded-[22px] border border-black/8 bg-[#fffaf2] p-4">
                        <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8a8174]">People</div>
                        <div className="mt-2 text-3xl font-black text-[#141414]">{current.joined_count} / {current.max_people}</div>
                      </div>
                    </div>

                    <div className="mt-5 rounded-[22px] border border-black/8 bg-[#fffaf2] p-4">
                      <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8a8174]">Best slice</div>
                      <div className="mt-2 text-lg font-black text-[#141414]">{current.best_slice}</div>
                    </div>

                    <div className="mt-5 flex items-center gap-3">
                      <div className="grid h-12 w-12 place-items-center rounded-full bg-[#efbf3a] text-sm font-black text-[#141414]">{avatarLabel(current.host?.username || current.host?.email)}</div>
                      <div>
                        <div className="text-sm text-[#8a8174]">Hosted by</div>
                        <div className="text-lg font-black text-[#141414]">{current.host?.username || current.host?.email || 'Host'}</div>
                      </div>
                    </div>

                    <p className="mt-5 text-sm leading-7 text-[#605747]">{current.quick_note || current.spot?.quick_note || 'Simple pizza plan. Good place, clear time, easy join.'}</p>
                  </div>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3 px-2">
                  <button type="button" onClick={prevCard} className="grid h-14 w-14 place-items-center rounded-full border border-black/10 bg-white text-[#141414] disabled:opacity-40" disabled={index === 0}><Clock3 className="h-5 w-5" /></button>
                  <button type="button" onClick={nextCard} className="grid h-16 w-16 place-items-center rounded-full border border-black/10 bg-white text-[#141414] disabled:opacity-40" disabled={index >= filtered.length - 1}><X className="h-6 w-6" /></button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!user) {
                        setLoginPrompt(true);
                        return;
                      }
                      joinMutation.mutate(current.id);
                    }}
                    className="grid h-20 w-20 place-items-center rounded-full bg-[#3e9444] text-white shadow-[0_12px_32px_rgba(62,148,68,0.22)] disabled:opacity-50"
                    disabled={joinMutation.isPending}
                  >
                    {joinMutation.isPending ? <Clock3 className="h-7 w-7 animate-pulse" /> : <Check className="h-8 w-8" />}
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="rounded-[30px] border border-black/8 bg-white p-8 text-center">
              <div className="flex justify-start">
                <button
                  type="button"
                  onClick={() => navigate(createPageUrl("Home"))}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-[#fffaf2] text-[#141414] transition hover:bg-white"
                  aria-label="Back to map"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 text-5xl">🍕</div>
              <h2 className="mt-4 text-2xl font-black text-[#141414]">No plans match now</h2>
              <p className="mt-2 text-sm leading-7 text-[#6d665b]">Try relaxing the filters or create your own plan.</p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate(createPageUrl("Home"))}
                  className="inline-flex h-12 items-center justify-center rounded-2xl border border-black/10 bg-white px-5 text-sm font-black text-[#141414]"
                >
                  Back to map
                </button>
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
