import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Star, ChevronRight, Coins, Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ZINDEX } from "@/lib/zindex";
import { formatPrice, formatUpdateRecency, getOpenStatusLabel, getValueLabel } from "@/lib/place-helpers";

export default function PinPopup({ place, onClose, onViewDetails }) {
  if (!place) return null;

  const avgRating = place.average_rating ? Number(place.average_rating).toFixed(1) : "—";
  const area = place.neighborhood || place.borough || "NYC";
  const valueLabel = getValueLabel(place);

  return (
    <AnimatePresence>
      <motion.button
        type="button"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        style={{ zIndex: ZINDEX.PIN_POPUP - 1 }}
        className="fixed inset-0 bg-black/22 backdrop-blur-[2px]"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.98 }}
        transition={{ type: "spring", damping: 24, stiffness: 280 }}
        style={{ zIndex: ZINDEX.PIN_POPUP }}
        className="fixed left-3 right-3 bottom-[59vh] sm:left-1/2 sm:right-auto sm:w-[420px] sm:-translate-x-1/2 sm:bottom-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#111111]/96 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <div className="px-4 pt-4 pb-4">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className="inline-flex items-center rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-red-300">
                    {valueLabel}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-300">
                    {getOpenStatusLabel(place)}
                  </span>
                </div>

                <h3 className="text-white text-lg font-black leading-tight">
                  {place.name}
                </h3>

                <div className="mt-1 flex items-center gap-1.5 text-sm text-stone-400">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{area}</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] p-2 text-stone-400 transition hover:text-white hover:bg-white/[0.08]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2.5">
              <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-3">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">
                  <Coins className="w-3.5 h-3.5" />
                  Slice
                </div>
                <div className="mt-1 text-lg font-black text-white">
                  {formatPrice(place.standard_slice_price)}
                </div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-3">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">
                  <Star className="w-3.5 h-3.5 fill-red-500 text-red-500" />
                  Rating
                </div>
                <div className="mt-1 text-lg font-black text-white">
                  {avgRating}
                </div>
              </div>

              <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">
                  Best slice
                </div>
                <div className="mt-1 text-sm font-bold text-white leading-tight line-clamp-2">
                  {place.best_known_slice || "Cheese slice"}
                </div>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-stone-400">
              <Clock3 className="w-3.5 h-3.5" />
              <span>{formatUpdateRecency(place.last_price_update)}</span>
            </div>

            <div className="mt-4">
              <Button
                onClick={onViewDetails}
                className="h-11 w-full rounded-2xl bg-red-600 text-white font-bold hover:bg-red-500"
              >
                View place details
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
