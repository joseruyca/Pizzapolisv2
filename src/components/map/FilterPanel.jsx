import React from "react";
import { Star, Coins, Sparkles, Flame, MoonStar } from "lucide-react";
import { motion } from "framer-motion";
import { BOROUGHS, PRICES, PIZZA_CATEGORIES, SORT_OPTIONS } from "@/lib/constants";
import { ZINDEX } from "@/lib/zindex";

function FilterChip({ active, onClick, children, colorDot, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 border ${
        active
          ? "bg-white text-black border-white shadow-sm"
          : "bg-white/5 text-stone-400 border-white/8 hover:bg-white/10 hover:text-stone-200 hover:border-white/15"
      }`}
    >
      {Icon ? <Icon className="w-3 h-3" /> : null}
      {colorDot && <div className={`w-2 h-2 rounded-full ${colorDot} shrink-0`} />}
      {children}
    </button>
  );
}

export default function FilterPanel({ filters, onFiltersChange, resultCount, onClose }) {
  const updateFilter = (key, value) => onFiltersChange({ ...filters, [key]: value });
  const toggleArrayFilter = (key, value) => {
    const arr = filters[key] || [];
    const newArr = arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value];
    updateFilter(key, newArr);
  };

  const activeFilterCount = [
    (filters.boroughs || []).length,
    (filters.prices || []).length,
    (filters.categories || []).length,
    filters.sortBy ? 1 : 0,
    filters.cheapOnly ? 1 : 0,
    filters.valueOnly ? 1 : 0,
    filters.openNow ? 1 : 0,
    filters.lateNight ? 1 : 0,
    filters.featuredOnly ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const clearAll = () => {
    onFiltersChange({
      search: filters.search,
      boroughs: [], prices: [], categories: [], sortBy: "",
      cheapOnly: false, valueOnly: false, openNow: false, lateNight: false, featuredOnly: false,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="mt-2 bg-[#1a1a1a] border border-white/30 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden relative max-h-[70vh] flex flex-col"
      style={{ zIndex: ZINDEX.FILTER_EXPANDED }}
    >
      <div className="p-4 space-y-4 overflow-y-auto flex-1">
        <div>
          <p className="text-[10px] text-stone-400 uppercase tracking-[0.12em] font-bold mb-1.5">Quick filters</p>
          <div className="flex flex-wrap gap-1.5">
            <FilterChip active={filters.cheapOnly} onClick={() => updateFilter("cheapOnly", !filters.cheapOnly)} icon={Coins}>Under $3.50</FilterChip>
            <FilterChip active={filters.valueOnly} onClick={() => updateFilter("valueOnly", !filters.valueOnly)} icon={Sparkles}>Worth it</FilterChip>
            <FilterChip active={filters.openNow} onClick={() => updateFilter("openNow", !filters.openNow)} icon={Flame}>Open now</FilterChip>
            <FilterChip active={filters.lateNight} onClick={() => updateFilter("lateNight", !filters.lateNight)} icon={MoonStar}>Late night</FilterChip>
            <FilterChip active={filters.featuredOnly} onClick={() => updateFilter("featuredOnly", !filters.featuredOnly)}>Featured</FilterChip>
          </div>
        </div>

        <div>
          <p className="text-[10px] text-stone-400 uppercase tracking-[0.12em] font-bold mb-1.5">Borough</p>
          <div className="flex flex-wrap gap-1.5">
            {BOROUGHS.map(b => (
              <FilterChip
                key={b}
                active={(filters.boroughs || []).includes(b)}
                onClick={() => toggleArrayFilter("boroughs", b)}
              >
                {b}
              </FilterChip>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] text-stone-400 uppercase tracking-[0.12em] font-bold mb-1.5">Price range</p>
          <div className="flex gap-2">
            {PRICES.map(p => {
              const active = (filters.prices || []).includes(p.value);
              return (
                <button
                  key={p.value}
                  onClick={() => toggleArrayFilter("prices", p.value)}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border text-xs font-semibold transition-all ${
                    active
                      ? "bg-white text-black border-white"
                      : "bg-white/[0.08] text-stone-300 border-white/25 hover:bg-white/15 hover:text-white hover:border-white/35"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full ${p.color} flex items-center justify-center`}>
                    <span className="text-white font-black leading-none" style={{ fontSize: "7px" }}>{p.value}</span>
                  </div>
                  <span>{p.label}</span>
                  <span className={`text-[10px] font-normal ${active ? "text-stone-600" : "text-stone-700"}`}>{p.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-[10px] text-stone-400 uppercase tracking-[0.12em] font-bold mb-1.5">Pizza style</p>
          <div className="flex flex-wrap gap-1.5">
            {PIZZA_CATEGORIES.map(c => (
              <FilterChip
                key={c}
                active={(filters.categories || []).includes(c)}
                onClick={() => toggleArrayFilter("categories", c)}
              >
                {c}
              </FilterChip>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] text-stone-400 uppercase tracking-[0.12em] font-bold mb-1.5">Sort by</p>
          <div className="flex gap-1.5 flex-wrap">
            {SORT_OPTIONS.map(s => (
              <FilterChip
                key={s.value}
                active={filters.sortBy === s.value}
                onClick={() => updateFilter("sortBy", s.value)}
              >
                {s.value === "rating" && <Star className="w-3 h-3" />}
                {s.label}
              </FilterChip>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-white/20 flex items-center justify-between bg-white/[0.03]">
        <span className="text-xs text-stone-300">{resultCount} spot{resultCount !== 1 ? "s" : ""} found</span>
        <div className="flex gap-3">
          {activeFilterCount > 0 && (
            <button onClick={clearAll} className="text-xs text-stone-400 hover:text-stone-100 transition-colors font-medium">
              Clear all
            </button>
          )}
          <button
            onClick={onClose}
            className="text-xs text-white font-semibold bg-red-600 hover:bg-red-500 px-3 py-1 rounded-lg transition-colors"
          >
            Show results
          </button>
        </div>
      </div>
    </motion.div>
  );
}
