import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MapPin, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice, getValueLabel } from "@/lib/place-helpers";
import { ZINDEX } from "@/lib/zindex";

export default function PinPopup({ place, onClose, onViewDetails }) {
  if (!place) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 18 }}
        transition={{ duration: 0.18 }}
        style={{ zIndex: ZINDEX.PIN_POPUP }}
        className="fixed left-3 right-3 bottom-[96px] sm:left-1/2 sm:right-auto sm:w-[360px] sm:-translate-x-1/2 sm:bottom-6"
      >
        <div className="overflow-hidden rounded-[26px] border border-white/10 bg-[#111111]/96 shadow-[0_24px_60px_rgba(0,0,0,0.52)] backdrop-blur-xl">
          <div className="flex items-start gap-3 p-4">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-red-300">
                  {getValueLabel(place)}
                </span>
                {place.active_hangouts_count > 0 ? (
                  <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-300">
                    {place.active_hangouts_count} plan{place.active_hangouts_count > 1 ? "es" : ""}
                  </span>
                ) : null}
              </div>
              <h3 className="truncate text-lg font-black text-white">{place.name}</h3>
              <div className="mt-1 flex items-center gap-1.5 text-sm text-stone-400">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{place.neighborhood || place.borough}</span>
              </div>
            </div>
            <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-stone-400 transition hover:bg-white/[0.08] hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 px-4 pb-4">
            <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">Slice</div>
              <div className="mt-1 text-lg font-black text-white">{formatPrice(place.standard_slice_price)}</div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-3">
              <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500"><Star className="h-3.5 w-3.5 fill-red-500 text-red-500" />Rating</div>
              <div className="mt-1 text-lg font-black text-white">{Number(place.average_rating || 0).toFixed(1)}</div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">Best</div>
              <div className="mt-1 line-clamp-2 text-sm font-bold leading-tight text-white">{place.best_known_slice || "Cheese slice"}</div>
            </div>
          </div>

          <div className="px-4 pb-4">
            <Button onClick={onViewDetails} className="h-11 w-full rounded-2xl bg-red-600 text-white font-bold hover:bg-red-500">
              Ver place details
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
