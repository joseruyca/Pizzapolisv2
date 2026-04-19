import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Clock, ChevronLeft, Coins, Users, MessageCircle, Sparkles, ArrowUpRight, Plus, Star } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import CommentsSection from "./CommentsSection";
import PhotoGallery from "./PhotoGallery";
import LoginPrompt from "../shared/LoginPrompt";
import StarRating from "@/components/shared/StarRating";
import { ZINDEX } from "@/lib/zindex";
import { formatPrice, getGoogleMapsUrl } from "@/lib/place-helpers";
import { supabase } from "@/lib/supabase";
import { createPageUrl } from "@/utils";

function InfoCard({ label, value, icon: Icon, accent = "text-stone-400" }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/[0.04] p-4">
      <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] ${accent}`}>
        {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
        {label}
      </div>
      <div className="mt-2 text-lg font-black leading-tight text-white">{value}</div>
    </div>
  );
}

async function resolveSpotPhoto(value) {
  if (!value) return null;
  if (String(value).startsWith("http")) return value;
  const { data } = await supabase.storage.from("spot-photos").createSignedUrl(value, 60 * 60);
  return data?.signedUrl || null;
}

async function fetchComments(spotId) {
  const { data, error } = await supabase
    .from("spot_comments")
    .select("id,content,status,created_at,user_id")
    .eq("spot_id", spotId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = data || [];
  const userIds = Array.from(new Set(rows.map((row) => row.user_id).filter(Boolean)));
  const profiles = userIds.length
    ? ((await supabase.from("profiles").select("id,email,username").in("id", userIds)).data || [])
    : [];
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
  return rows.map((row) => ({ ...row, profile: profileMap.get(row.user_id) || null }));
}

async function fetchPhotos(spotId) {
  const { data, error } = await supabase
    .from("spot_photos")
    .select("id,photo_url,status,created_at,user_id")
    .eq("spot_id", spotId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  const rows = data || [];
  const userIds = Array.from(new Set(rows.map((row) => row.user_id).filter(Boolean)));
  const profiles = userIds.length
    ? ((await supabase.from("profiles").select("id,email,username").in("id", userIds)).data || [])
    : [];
  const profileMap = new Map(profiles.map((profile) => [profile.id, profile]));
  return Promise.all(rows.map(async (row) => ({ ...row, photo_url: await resolveSpotPhoto(row.photo_url), profile: profileMap.get(row.user_id) || null })));
}

async function fetchRelatedPlans(spotId) {
  const { data, error } = await supabase
    .from("plans")
    .select("id,title,plan_date,plan_time,max_people,status")
    .eq("spot_id", spotId)
    .eq("status", "active")
    .order("plan_date", { ascending: true })
    .limit(6);
  if (error) throw error;
  return data || [];
}

export default function PlacePanel({ place, onClose, user }) {
  const [activeTab, setActiveTab] = useState("info");
  const [loginPrompt, setLoginPrompt] = useState({ open: false, message: "" });
  const [myRating, setMyRating] = useState(0);
  const [ratingSaved, setRatingSaved] = useState(false);

  const { data: comments = [] } = useQuery({
    queryKey: ["spot-comments", place?.id],
    queryFn: () => fetchComments(place.id),
    enabled: !!place,
  });

  const { data: photos = [] } = useQuery({
    queryKey: ["spot-photos", place?.id],
    queryFn: () => fetchPhotos(place.id),
    enabled: !!place,
  });

  const { data: relatedPlans = [] } = useQuery({
    queryKey: ["spot-related-plans", place?.id],
    queryFn: () => fetchRelatedPlans(place.id),
    enabled: !!place,
  });

  const approvedComments = useMemo(() => comments.filter((comment) => comment.status === "approved" || comment.user_id === user?.id), [comments, user?.id]);
  const approvedPhotos = useMemo(() => photos.filter((photo) => photo.status === "approved" || photo.user_id === user?.id), [photos, user?.id]);
  const googleMapsUrl = getGoogleMapsUrl(place);

  useEffect(() => {
    setRatingSaved(false);
    if (!place?.id || !user?.id || typeof window === "undefined") {
      setMyRating(0);
      return;
    }

    const stored = window.localStorage.getItem(`pizzapolis:spot-rating:${user.id}:${place.id}`);
    setMyRating(stored ? Number(stored) || 0 : 0);
  }, [place?.id, user?.id]);

  const handleRatePlace = (value) => {
    if (!user?.id || typeof window === "undefined") {
      setLoginPrompt({ open: true, message: "Sign in to save your own rating for this spot." });
      return;
    }

    const normalized = Math.max(0, Math.min(5, Math.round(Number(value) * 2) / 2));
    window.localStorage.setItem(`pizzapolis:spot-rating:${user.id}:${place.id}`, String(normalized));
    setMyRating(normalized);
    setRatingSaved(true);
    window.setTimeout(() => setRatingSaved(false), 1400);
  };

  if (!place) return null;

  const tabs = [
    { id: "info", label: "Info" },
    { id: "comments", label: "Comments", count: approvedComments.length },
    { id: "photos", label: "Photos", count: approvedPhotos.length },
  ];

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="fixed top-14 right-0 bottom-[82px] w-full sm:bottom-0 sm:w-[470px] overflow-y-auto border-l border-white/5 bg-[#0d0d0d]"
          style={{ zIndex: ZINDEX.PLACE_PANEL }}
        >
          <div className="border-b border-white/5 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.22),transparent_34%),linear-gradient(180deg,#131313_0%,#0d0d0d_100%)] px-5 pb-6 pt-5">
            {place.photo_url ? (
              <div className="mb-5 overflow-hidden rounded-[24px] border border-white/10 bg-black">
                <div className="aspect-[4/3]">
                  <img src={place.photo_url} alt={place.name} className="h-full w-full object-cover" />
                </div>
              </div>
            ) : null}
            <button onClick={onClose} className="mb-5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white transition hover:bg-black/60">
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-red-300">Spot</span>
              {place.best_known_slice ? <span className="inline-flex items-center rounded-full border border-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-300">Best slice · {place.best_known_slice}</span> : null}
            </div>

            <h2 className="text-[2rem] font-black leading-tight text-white">{place.name}</h2>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-stone-400">
              <MapPin className="h-4 w-4" />
              {place.address || "Location pinned on map"}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <InfoCard label="Slice price" value={formatPrice(place.standard_slice_price)} icon={Coins} accent="text-stone-500" />
              <InfoCard label="Rating" value={Number(place.average_rating || 0).toFixed(1)} icon={Star} accent="text-red-300" />
              <InfoCard label="Best slice" value={place.best_known_slice || "Optional"} icon={Sparkles} accent="text-stone-500" />
              <InfoCard label="Comments" value={String(approvedComments.length)} icon={MessageCircle} accent="text-stone-500" />
            </div>

            <div className="mt-4 rounded-[24px] border border-red-500/15 bg-black/30 p-4">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-red-300"><Sparkles className="h-3.5 w-3.5" />Quick note</div>
              <p className="mt-2 text-sm leading-6 text-stone-300">{place.quick_note || place.description || "No quick note yet."}</p>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <a href={googleMapsUrl} target="_blank" rel="noreferrer" className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08]">
                <ArrowUpRight className="mr-2 h-4 w-4" />Open in maps
              </a>
              <Link to={`${createPageUrl('CrearQuedada')}?place=${place.id}`} className="inline-flex h-11 items-center justify-center rounded-2xl bg-red-600 text-white font-bold hover:bg-red-500">
                <Plus className="mr-2 h-4 w-4" />Create plan here
              </Link>
            </div>
          </div>

          <div className="sticky top-0 z-10 border-b border-white/5 bg-[#0d0d0d]/95 px-5 py-3 backdrop-blur-lg">
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`rounded-full px-4 py-2 text-sm font-semibold ${activeTab === tab.id ? 'bg-white text-[#111111]' : 'border border-white/10 bg-white/[0.04] text-stone-300'}`}>
                  {tab.label}{typeof tab.count === 'number' ? ` · ${tab.count}` : ''}
                </button>
              ))}
            </div>
          </div>

          <div className="px-5 py-5 pb-28 sm:pb-8">
            {activeTab === "info" ? (
              <div className="space-y-5">
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">Your rating</div>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <StarRating rating={myRating} onRate={handleRatePlace} interactive step={0.5} size="lg" showValue />
                    <span className="text-sm text-stone-400">Tap the left or right side of each star for 0.5 steps.</span>
                  </div>
                  <div className="mt-2 text-xs text-stone-500">This saves your personal rating on this device for now.</div>
                  {ratingSaved ? <div className="mt-3 inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-200">Rating saved</div> : null}
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">Address</div>
                  <div className="mt-2 text-sm leading-6 text-stone-300">{place.address || "No address yet."}</div>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">Active plans · {relatedPlans.length}</div>
                  {relatedPlans.length ? (
                    <div className="mt-3 space-y-3">
                      {relatedPlans.map((plan) => (
                        <div key={plan.id} className="rounded-2xl border border-white/8 bg-black/20 px-4 py-3">
                          <div className="font-bold text-white">{plan.title}</div>
                          <div className="mt-1 text-sm text-stone-400">{plan.plan_date} · {String(plan.plan_time).slice(0,5)} · {plan.max_people} people</div>
                        </div>
                      ))}
                    </div>
                  ) : <div className="mt-2 text-sm text-stone-400">No active plans for this spot yet.</div>}
                </div>
              </div>
            ) : null}

            {activeTab === "comments" ? <CommentsSection placeId={place.id} user={user} comments={approvedComments} onRequireAuth={() => setLoginPrompt({ open: true, message: "Sign in to comment on places." })} /> : null}
            {activeTab === "photos" ? <PhotoGallery placeId={place.id} user={user} photos={approvedPhotos} onRequireAuth={() => setLoginPrompt({ open: true, message: "Sign in to add photos." })} /> : null}
          </div>
        </motion.div>
      </AnimatePresence>

      <LoginPrompt open={loginPrompt.open} onClose={() => setLoginPrompt({ open: false, message: "" })} message={loginPrompt.message} />
    </>
  );
}
