import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Star, ChevronRight, Coins, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ZINDEX } from "@/lib/zindex";
import { formatPrice, getValueLabel } from "@/lib/place-helpers";

export default function PinPopup({ place, onClose, onViewDetails }) {
  if (!place) return null;

  return (
    <AnimatePresence>
      <motion.button
        type="button"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ zIndex: ZINDEX.PIN_POPUP - 1 }}
        className="fixed inset-0 bg-black/20"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ type: "spring", damping: 28, stiffness: 320 }}
        style={{ zIndex: ZINDEX.PIN_POPUP }}
        className="fixed left-3 right-3 bottom-[34vh] sm:left-1/2 sm:right-auto sm:w-[380px] sm:-translate-x-1/2 sm:bottom-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#101010]/98 shadow-[0_20px_60px_rgba(0,0,0,0.58)] backdrop-blur-xl">
          {place.photo_url ? (
            <div className="aspect-[4/3] overflow-hidden border-b border-white/8 bg-black">
              <img src={place.photo_url} alt={place.name} className="h-full w-full object-cover" />
            </div>
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center border-b border-white/8 bg-[radial-gradient(circle_at_center,rgba(214,161,30,0.18),transparent_42%),#0f0f0f] text-stone-600">
              <ImageIcon className="h-8 w-8" />
            </div>
          )}
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-red-300">
                    {getValueLabel(place)}
                  </span>
                  <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-300">
                    {place.active_hangouts_count || 0} planes
                  </span>
                </div>
                <h3 className="text-lg font-black leading-tight text-white">{place.name}</h3>
                <div className="mt-1 flex items-center gap-1.5 text-sm text-stone-400">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{place.address || place.neighborhood || place.borough || "NYC"}</span>
                </div>
              </div>
              <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-stone-400 transition hover:bg-white/[0.08] hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2">
              <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-3">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500"><Coins className="h-3.5 w-3.5" />Slice</div>
                <div className="mt-1 text-lg font-black text-white">{formatPrice(place.standard_slice_price)}</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-3">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500"><Star className="h-3.5 w-3.5 fill-red-500 text-red-500" />Rating</div>
                <div className="mt-1 text-lg font-black text-white">{Number(place.average_rating || 0).toFixed(1)}</div>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-3">
                <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-stone-500">Best slice</div>
                <div className="mt-1 line-clamp-2 text-sm font-bold leading-tight text-white">{place.best_known_slice || "Cheese slice"}</div>
              </div>
            </div>

            <Button onClick={onViewDetails} className="mt-4 h-11 w-full rounded-2xl bg-red-600 text-white font-bold hover:bg-red-500">
              Ver place details
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
