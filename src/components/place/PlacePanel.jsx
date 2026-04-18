import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Clock, ChevronLeft, Heart, Share2, Coins, Users, MessageCircle, CalendarDays, Sparkles, Star, ArrowUpRight, Navigation, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import StarRating from "../shared/StarRating";
import CommentsSection from "./CommentsSection";
import PhotoGallery from "./PhotoGallery";
import LoginPrompt from "../shared/LoginPrompt";
import { ZINDEX } from "@/lib/zindex";
import {
  formatPrice,
  formatUpdateRecency,
  getHangoutVibe,
  getValueLabel,
  getValueTone,
  getQuickTake,
  getEditorialBullets,
  getOpenStatusLabel,
  formatHangoutDate,
  getBestFor,
  getQueueHint,
  getNearbyComparisons,
  getAtmosphereTags,
  getGoogleMapsUrl,
} from "@/lib/place-helpers";

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

export default function PlacePanel({ place, onClose, user }) {
  const [activeTab, setActiveTab] = useState("info");
  const [loginPrompt, setLoginPrompt] = useState({ open: false, message: "" });
  const [userRating, setUserRating] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const queryClient = useQueryClient();

  const { data: ratings = [] } = useQuery({
    queryKey: ["ratings", place?.id],
    queryFn: () => base44.entities.Rating.filter({ place_id: place.id }),
    enabled: !!place,
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["comments", place?.id],
    queryFn: () => base44.entities.Comment.filter({ place_id: place.id, status: "visible" }, "-created_date"),
    enabled: !!place,
  });

  const { data: photos = [] } = useQuery({
    queryKey: ["photos", place?.id],
    queryFn: () => base44.entities.Photo.filter({ place_id: place.id, status: "visible" }, "-created_date"),
    enabled: !!place,
  });

  const { data: nearbyHangouts = [] } = useQuery({
    queryKey: ["place-hangouts", place?.id],
    queryFn: () => base44.entities.Quedada.filter({ pizzeria_id: place.id, estado: "activa" }, "fecha_hora"),
    enabled: !!place,
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ["favorites", user?.email],
    queryFn: () => (user ? base44.entities.Favorite.filter({ user_email: user.email }) : []),
    enabled: !!user,
  });

  const { data: allPlaces = [] } = useQuery({
    queryKey: ["places-for-panel"],
    queryFn: () => base44.entities.PizzaPlace.filter({ status: "active" }, "standard_slice_price"),
    enabled: !!place,
  });

  useEffect(() => {
    if (user && ratings.length > 0) {
      const myRating = ratings.find((r) => r.user_email === user.email);
      setUserRating(myRating ? myRating.score : 0);
    }
  }, [user, ratings]);

  useEffect(() => {
    if (user && place) {
      const fav = favorites.find((f) => f.place_id === place.id);
      setIsFavorited(!!fav);
    }
  }, [user, place, favorites]);

  const rateMutation = useMutation({
    mutationFn: async (score) => {
      const existing = ratings.find((r) => r.user_email === user.email);
      if (existing) {
        await base44.entities.Rating.update(existing.id, { score });
      } else {
        await base44.entities.Rating.create({
          place_id: place.id,
          user_email: user.email,
          user_name: user.full_name || "",
          score,
          status: "visible",
        });
      }
      const allRatings = await base44.entities.Rating.filter({ place_id: place.id });
      const avg = allRatings.reduce((s, r) => s + r.score, 0) / allRatings.length;
      await base44.entities.PizzaPlace.update(place.id, {
        average_rating: Math.round(avg * 10) / 10,
        ratings_count: allRatings.length,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ratings", place.id] });
      queryClient.invalidateQueries({ queryKey: ["places"] });
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke("toggleFavorite", {
        place_id: place.id,
        place_name: place.name,
      });
      return res.data;
    },
    onSuccess: (data) => {
      setIsFavorited(data.favorited);
      if (user?.email) queryClient.invalidateQueries({ queryKey: ["favorites", user.email] });
    },
  });

  if (!place) return null;

  const handleRate = (score) => {
    if (!user) {
      setLoginPrompt({ open: true, message: "Sign in to rate this pizza place." });
      return;
    }
    setUserRating(score);
    rateMutation.mutate(score);
  };

  const handleToggleFavorite = () => {
    if (!user) {
      setLoginPrompt({ open: true, message: "Sign in to save favorites." });
      return;
    }
    toggleFavoriteMutation.mutate();
  };

  const handleShare = async () => {
    const shareText = `Check out ${place.name} on Pizzapolis 🍕`;
    if (navigator.share) {
      try {
        await navigator.share({ title: place.name, text: shareText, url: window.location.href });
      } catch {
        return;
      }
    } else {
      navigator.clipboard.writeText(`${shareText} - ${window.location.href}`);
      alert("Link copied to clipboard!");
    }
  };

  const avgRating = useMemo(() => (
    ratings.length > 0
      ? (ratings.reduce((s, r) => s + r.score, 0) / ratings.length).toFixed(1)
      : (Number(place?.average_rating || 0) ? Number(place.average_rating).toFixed(1) : "—")
  ), [ratings, place]);

  const tabs = [
    { id: "info", label: "Info" },
    { id: "comments", label: "Comments", count: comments.length },
    { id: "photos", label: "Photos", count: photos.length },
  ];

  const statusLabel = getOpenStatusLabel(place);
  const editorialBullets = getEditorialBullets(place);
  const bestFor = getBestFor(place);
  const quickTake = getQuickTake(place);
  const queueHint = getQueueHint(place);
  const atmosphereTags = getAtmosphereTags(place);
  const nearbyComparisons = getNearbyComparisons(place, allPlaces);
  const googleMapsUrl = getGoogleMapsUrl(place);

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ x: "100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "100%", opacity: 0 }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="fixed top-14 right-0 bottom-0 w-full sm:w-[470px] overflow-y-auto border-l border-white/5 bg-[#0d0d0d]"
          style={{ zIndex: ZINDEX.PLACE_PANEL }}
        >
          <div className="border-b border-white/5 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.22),transparent_34%),linear-gradient(180deg,#131313_0%,#0d0d0d_100%)] px-5 pb-6 pt-5">
            <button
              onClick={onClose}
              className="mb-5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-black/40 text-white transition hover:bg-black/60"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${getValueTone(place)}`}>
                {getValueLabel(place)}
              </span>
              {place.featured ? <Badge className="border-0 bg-white text-black">Featured</Badge> : null}
              {place.best_known_slice ? <Badge variant="outline" className="border-white/15 text-stone-300">Best slice · {place.best_known_slice}</Badge> : null}
            </div>

            <h2 className="text-[2rem] font-black leading-tight text-white">{place.name}</h2>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-stone-400">
              <MapPin className="h-4 w-4" />
              {place.address || [place.neighborhood, place.borough].filter(Boolean).join(", ") || "Open in maps"}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <InfoCard label="Slice price" value={formatPrice(place.standard_slice_price)} icon={Coins} accent="text-stone-500" />
              <InfoCard label="Rating" value={avgRating} icon={Star} accent="text-red-300" />
              <InfoCard label="Open status" value={statusLabel} icon={Clock} accent={statusLabel === "Open now" ? "text-emerald-300" : "text-stone-500"} />
              <InfoCard label="Best slice" value={place.best_known_slice || "Optional"} icon={Sparkles} accent="text-stone-500" />
            </div>

            <div className="mt-4 rounded-[24px] border border-red-500/15 bg-black/30 p-4">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-red-300">
                <Sparkles className="h-3.5 w-3.5" />
                Quick note
              </div>
              <p className="mt-2 text-sm leading-6 text-stone-300">{place.description || quickTake}</p>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <Button
                onClick={handleToggleFavorite}
                variant="outline"
                className={`h-11 flex-1 rounded-2xl border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08] ${isFavorited ? "border-red-500/30 text-red-300" : ""}`}
              >
                <Heart className={`mr-2 h-4 w-4 ${isFavorited ? "fill-current" : ""}`} />
                {isFavorited ? "Saved" : "Save"}
              </Button>
              <Button
                onClick={handleShare}
                variant="outline"
                className="h-11 flex-1 rounded-2xl border-white/10 bg-white/[0.03] text-white hover:bg-white/[0.08]"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
            </div>
          </div>

          <div className="space-y-5 px-5 py-5">
            <section className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">Best known slice</div>
                  <div className="mt-2 text-lg font-bold text-white">{place.best_known_slice || "Cheese slice"}</div>
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">Best for</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {bestFor.length ? bestFor.map((item) => (
                      <span key={item} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-medium text-stone-200">{item}</span>
                    )) : <span className="text-sm text-stone-400">Quick slice stop</span>}
                  </div>
                </div>
              </div>
              <div className="mt-4 grid gap-3 border-t border-white/8 pt-4 sm:grid-cols-2">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">Why go</div>
                  <p className="mt-2 text-sm leading-6 text-stone-300">{place.description || quickTake}</p>
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">What to expect</div>
                  <p className="mt-2 text-sm leading-6 text-stone-300">{queueHint}</p>
                </div>
              </div>
            </section>

            <section className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
              <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">Spot vibe</div>
              <div className="flex flex-wrap gap-2">
                {atmosphereTags.length ? atmosphereTags.map((tag) => (
                  <span key={tag} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-medium text-stone-200">{tag}</span>
                )) : <span className="text-sm text-stone-400">Simple neighborhood stop</span>}
              </div>
            </section>

            {nearbyComparisons.length > 0 ? (
              <section className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">Compared to nearby spots</div>
                <div className="space-y-3">
                  {nearbyComparisons.map((comparison) => (
                    <div key={comparison.id} className="rounded-2xl border border-white/8 bg-black/25 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-white">{comparison.name}</div>
                          <div className="mt-1 text-xs text-stone-400">{comparison.neighborhood} · {comparison.diffLabel}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black text-white">{formatPrice(comparison.standard_slice_price)}</div>
                          <div className="mt-1 text-[11px] text-stone-500">{getValueLabel(comparison)}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            {nearbyHangouts.length > 0 ? (
              <section className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">
                  <Users className="h-3.5 w-3.5 text-red-400" />
                  Active hangouts here
                </div>
                <div className="space-y-3">
                  {nearbyHangouts.slice(0, 3).map((hangout) => (
                    <div key={hangout.id} className="rounded-2xl border border-white/8 bg-black/25 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-white">{hangout.titulo}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-stone-400">
                            <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{formatHangoutDate(hangout.fecha_hora)}</span>
                            <span className="inline-flex rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[10px] font-bold text-stone-200">{getHangoutVibe(hangout)}</span>
                          </div>
                        </div>
                        <div className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-semibold text-stone-200">{hangout.max_participantes} spots</div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : (
              <section className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-white">No hangouts here yet</div>
                    <p className="mt-1 text-sm leading-6 text-stone-400">This would be a good spot for a simple meet-up if you want to turn one slice into a small plan.</p>
                  </div>
                  <div className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] font-semibold text-stone-300">Be first</div>
                </div>
              </section>
            )}

            <section className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
              <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">Your take</div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-stone-300">Rate this spot</div>
                  <div className="mt-1 text-xs text-stone-500">Keep it simple: good value or not.</div>
                </div>
                <StarRating rating={userRating} onRate={handleRate} interactive />
              </div>
            </section>

            <section className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
              <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">Worth knowing</div>
              <div className="space-y-3">
                {editorialBullets.map((bullet) => (
                  <div key={bullet} className="flex gap-2 text-sm leading-6 text-stone-300">
                    <span className="mt-[9px] h-1.5 w-1.5 rounded-full bg-red-400" />
                    <span>{bullet}</span>
                  </div>
                ))}
                {!editorialBullets.length ? <p className="text-sm text-stone-400">Solid stop when you want a simple pizza decision.</p> : null}
              </div>
            </section>

            <div className="border-b border-white/8">
              <div className="flex items-center gap-5 overflow-x-auto">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`relative pb-3 pt-1 text-sm font-medium transition ${activeTab === tab.id ? "text-white" : "text-stone-500 hover:text-stone-300"}`}
                  >
                    {tab.label}{tab.count ? ` (${tab.count})` : ""}
                    {activeTab === tab.id ? <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-red-500" /> : null}
                  </button>
                ))}
              </div>
            </div>

            {activeTab === "info" ? (
              <section className="space-y-4 pb-6">
                <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                  <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">Local details</div>
                  <div className="space-y-3 text-sm text-stone-300">
                    <div className="flex items-start gap-2"><MapPin className="mt-0.5 h-4 w-4 text-red-400" /><span>{place.address || "Address unavailable"}</span></div>
                    <div className="flex items-start gap-2"><Clock className="mt-0.5 h-4 w-4 text-red-400" /><span>{place.hours || "Hours unavailable"}</span></div>
                    <div className="flex items-start gap-2"><MessageCircle className="mt-0.5 h-4 w-4 text-red-400" /><span>{comments.length} comment{comments.length === 1 ? "" : "s"} from the community.</span></div>
                  </div>
                </div>
                <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                  <div className="mb-3 text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">Price context</div>
                  <p className="text-sm leading-6 text-stone-300">Pizzapolis treats the standard slice price as the main comparison point. This makes it easier to compare cheap spots, premium stops and places that only make sense for a planned visit.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Link to={`${createPageUrl('CrearQuedada')}?place=${place.id}`} className="block">
                    <Button className="h-12 w-full rounded-2xl bg-red-600 text-white font-semibold hover:bg-red-500">
                      <Plus className="mr-2 h-4 w-4" />
                      Create hangout here
                    </Button>
                  </Link>
                  <a href={googleMapsUrl} target="_blank" rel="noreferrer" className="block">
                    <Button className="h-12 w-full rounded-2xl bg-white text-black font-semibold hover:bg-stone-200">
                    <Navigation className="mr-2 h-4 w-4" />
                    Open in Google Maps
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Button>
                  </a>
                </div>
              </section>
            ) : null}

            {activeTab === "comments" ? <CommentsSection placeId={place.id} user={user} comments={comments} onRequireAuth={() => setLoginPrompt({ open: true, message: "Sign in to comment on places." })} /> : null}
            {activeTab === "photos" ? <PhotoGallery placeId={place.id} user={user} photos={photos} onRequireAuth={() => setLoginPrompt({ open: true, message: "Sign in to add photos." })} /> : null}
          </div>
        </motion.div>
      </AnimatePresence>

      <LoginPrompt
        open={loginPrompt.open}
        onOpenChange={(open) => setLoginPrompt({ open, message: loginPrompt.message })}
        message={loginPrompt.message}
      />
    </>
  );
}
