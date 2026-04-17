import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, MapPin, ChevronUp, List, Coins, Users, ArrowUpDown } from "lucide-react";
import { ZINDEX } from "@/lib/zindex";
import { formatPrice, getValueLabel, getValueTone } from "@/lib/place-helpers";

function SortChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-2 text-[11px] font-semibold transition-all whitespace-nowrap ${
        active
          ? "border-[#f1df9c] bg-[#efbf3a] text-[#141414]"
          : "border-black/8 bg-white text-[#6d665b] hover:border-black/12 hover:text-[#141414]"
      }`}
    >
      {children}
    </button>
  );
}

export default function PlaceListPanel({
  places,
  open,
  onToggle,
  onSelectPlace,
  selectedId,
  sortMode = "value",
  onSortModeChange,
  sortDirection = "asc",
  onSortDirectionChange,
}) {
  const sortedPlaces = useMemo(() => {
    const copy = [...places];
    const directionFactor = sortDirection === "desc" ? -1 : 1;
    if (sortMode === "price") copy.sort((a, b) => (Number(a.standard_slice_price || 0) - Number(b.standard_slice_price || 0)) * directionFactor);
    else if (sortMode === "rating") copy.sort((a, b) => (Number(a.average_rating || 0) - Number(b.average_rating || 0)) * -directionFactor);
    else if (sortMode === "hangouts") copy.sort((a, b) => (Number(a.active_hangouts_count || 0) - Number(b.active_hangouts_count || 0)) * -directionFactor);
    else {
      const order = ["Steal", "Best budget", "Worth it", "Good value", "Premium", "Overpriced"];
      copy.sort((a, b) => {
        const av = order.indexOf(getValueLabel(a));
        const bv = order.indexOf(getValueLabel(b));
        return (av - bv || Number(a.standard_slice_price || 0) - Number(b.standard_slice_price || 0)) * directionFactor;
      });
    }
    return copy;
  }, [places, sortMode, sortDirection]);

  return (
    <>
      <button
        onClick={onToggle}
        className="fixed bottom-20 left-1/2 -translate-x-1/2 sm:hidden bg-[#fffaf2]/96 backdrop-blur-xl border border-black/8 rounded-full px-4 py-2 flex items-center gap-2 text-sm text-[#141414] shadow-[0_16px_40px_rgba(39,29,14,0.14)]"
        style={{ zIndex: ZINDEX.MAP_CONTROLS }}
      >
        <List className="w-4 h-4" />
        <span>{places.length} sitios</span>
        <ChevronUp className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 260 }}
            className="fixed inset-x-0 bottom-0 top-[72px] sm:top-[72px] sm:left-auto sm:right-auto sm:w-[390px] sm:h-[calc(100dvh-72px)] rounded-t-[28px] sm:rounded-none overflow-hidden flex flex-col border-t sm:border-t-0 sm:border-r border-black/8 bg-[#fffaf2] shadow-[0_24px_70px_rgba(39,29,14,0.16)]"
            style={{ zIndex: ZINDEX.MAP_CONTROLS }}
          >
            <div className="px-4 pt-3 pb-3 border-b border-black/8 bg-[#fff7eb]">
              <div className="mx-auto mb-2 h-1.5 w-10 rounded-full bg-black/10 sm:hidden" />
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-base font-semibold text-[#141414]">Comparar spots</p>
                  <p className="mt-1 text-xs text-[#8e8578]">Compara precio, rating y planes antes de abrir un spot.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onSortDirectionChange?.(sortDirection === "asc" ? "desc" : "asc")}
                    className="rounded-full border border-black/8 bg-white p-2 text-[#6d665b] hover:text-[#141414]"
                  >
                    <ArrowUpDown className="w-4 h-4" />
                  </button>
                  <button onClick={onToggle} className="text-[#8e8578] hover:text-[#141414] rounded-full border border-black/8 bg-white p-2">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                <SortChip active={sortMode === "value"} onClick={() => onSortModeChange?.("value")}>Valor</SortChip>
                <SortChip active={sortMode === "price"} onClick={() => onSortModeChange?.("price")}>Más baratos</SortChip>
                <SortChip active={sortMode === "rating"} onClick={() => onSortModeChange?.("rating")}>Top rated</SortChip>
                <SortChip active={sortMode === "hangouts"} onClick={() => onSortModeChange?.("hangouts")}>Planes</SortChip>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 space-y-2 bg-[linear-gradient(180deg,#fffaf2_0%,#f8f2e7_100%)] px-3 py-3">
              {sortedPlaces.map((place) => (
                <button
                  key={place.id}
                  onClick={() => onSelectPlace(place)}
                  className={`w-full rounded-[20px] border px-3 py-3 text-left transition ${
                    selectedId === place.id ? "border-[#f0cdc7] bg-[#fff0ec]" : "border-black/6 bg-white/80 hover:bg-white"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="truncate font-semibold text-sm text-[#141414]">{place.name}</p>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold border ${getValueTone(place)}`}>
                          {getValueLabel(place)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-[#8e8578] flex-wrap">
                        <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{place.neighborhood || place.borough}</span>
                        {Number(place.active_hangouts_count || 0) > 0 ? (
                          <span className="inline-flex items-center gap-1 text-[#3e9444]"><Users className="w-3 h-3" />{place.active_hangouts_count} planes</span>
                        ) : null}
                      </div>
                      <div className="mt-2 text-xs text-[#6d665b] line-clamp-1">{place.best_known_slice || "Cheese slice"}</div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="inline-flex items-center gap-1 rounded-xl border border-black/8 bg-[#fff7eb] px-2 py-1">
                        <Coins className="w-3 h-3 text-[#3e9444]" />
                        <span className="text-sm font-black text-[#141414]">{formatPrice(place.standard_slice_price)}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-end gap-1 text-xs">
                        <Star className="w-3 h-3 fill-[#efbf3a] text-[#efbf3a]" />
                        <span className="font-medium text-[#8d5b00]">{Number(place.average_rating || 0).toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
