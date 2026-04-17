import React from 'react';
import { Star, Coins, Sparkles, Flame, MoonStar } from 'lucide-react';
import { motion } from 'framer-motion';
import { BOROUGHS, PRICES, PIZZA_CATEGORIES, SORT_OPTIONS } from '@/lib/constants';
import { ZINDEX } from '@/lib/zindex';

function FilterChip({ active, onClick, children, colorDot, icon: Icon }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
        active
          ? 'border-[#f1df9c] bg-[#efbf3a] text-[#141414] shadow-sm'
          : 'border-black/8 bg-white text-[#6d665b] hover:border-black/12 hover:text-[#141414]'
      }`}
    >
      {Icon ? <Icon className="h-3 w-3" /> : null}
      {colorDot && <div className={`h-2 w-2 shrink-0 rounded-full ${colorDot}`} />}
      {children}
    </button>
  );
}

export default function FilterPanel({ filters, onFiltersChange, resultCount, onClose }) {
  const updateFilter = (key, value) => onFiltersChange({ ...filters, [key]: value });
  const toggleArrayFilter = (key, value) => {
    const arr = filters[key] || [];
    const newArr = arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value];
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
      boroughs: [],
      prices: [],
      categories: [],
      sortBy: '',
      cheapOnly: false,
      valueOnly: false,
      openNow: false,
      lateNight: false,
      featuredOnly: false,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.98 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="relative mt-2 flex max-h-[70vh] flex-col overflow-hidden rounded-[26px] border border-black/8 bg-[#fffaf2] shadow-[0_20px_50px_rgba(39,29,14,0.18)]"
      style={{ zIndex: ZINDEX.FILTER_EXPANDED }}
    >
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8e8578]">Quick filters</p>
          <div className="flex flex-wrap gap-1.5">
            <FilterChip active={filters.cheapOnly} onClick={() => updateFilter('cheapOnly', !filters.cheapOnly)} icon={Coins}>Under $3.50</FilterChip>
            <FilterChip active={filters.valueOnly} onClick={() => updateFilter('valueOnly', !filters.valueOnly)} icon={Sparkles}>Worth it</FilterChip>
            <FilterChip active={filters.openNow} onClick={() => updateFilter('openNow', !filters.openNow)} icon={Flame}>Open now</FilterChip>
            <FilterChip active={filters.lateNight} onClick={() => updateFilter('lateNight', !filters.lateNight)} icon={MoonStar}>Late night</FilterChip>
            <FilterChip active={filters.featuredOnly} onClick={() => updateFilter('featuredOnly', !filters.featuredOnly)}>Featured</FilterChip>
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8e8578]">Borough</p>
          <div className="flex flex-wrap gap-1.5">
            {BOROUGHS.map((b) => (
              <FilterChip key={b} active={(filters.boroughs || []).includes(b)} onClick={() => toggleArrayFilter('boroughs', b)}>
                {b}
              </FilterChip>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8e8578]">Price range</p>
          <div className="flex gap-2">
            {PRICES.map((p) => {
              const active = (filters.prices || []).includes(p.value);
              return (
                <button
                  key={p.value}
                  onClick={() => toggleArrayFilter('prices', p.value)}
                  className={`flex flex-1 flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs font-semibold transition-all ${
                    active ? 'border-[#f1df9c] bg-[#fff6de] text-[#141414]' : 'border-black/8 bg-white text-[#5f584e] hover:bg-[#fffdf8]'
                  }`}
                >
                  <div className={`flex h-5 w-5 items-center justify-center rounded-full ${p.color}`}>
                    <span className="text-[7px] font-black leading-none text-white">{p.value}</span>
                  </div>
                  <span>{p.label}</span>
                  <span className="text-[10px] font-normal text-[#8e8578]">{p.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8e8578]">Pizza style</p>
          <div className="flex flex-wrap gap-1.5">
            {PIZZA_CATEGORIES.map((c) => (
              <FilterChip key={c} active={(filters.categories || []).includes(c)} onClick={() => toggleArrayFilter('categories', c)}>
                {c}
              </FilterChip>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-[#8e8578]">Sort by</p>
          <div className="flex flex-wrap gap-1.5">
            {SORT_OPTIONS.map((s) => (
              <FilterChip key={s.value} active={filters.sortBy === s.value} onClick={() => updateFilter('sortBy', s.value)}>
                {s.value === 'rating' && <Star className="h-3 w-3" />}
                {s.label}
              </FilterChip>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-black/8 bg-[#f6efe4] px-4 py-3">
        <span className="text-xs text-[#6d665b]">{resultCount} spot{resultCount !== 1 ? 's' : ''} found</span>
        <div className="flex gap-3">
          {activeFilterCount > 0 && (
            <button onClick={clearAll} className="text-xs font-medium text-[#8e8578] transition-colors hover:text-[#141414]">
              Clear all
            </button>
          )}
          <button onClick={onClose} className="rounded-lg bg-[#efbf3a] px-3 py-1 text-xs font-semibold text-[#141414] transition-colors hover:bg-[#dbab23]">
            Show results
          </button>
        </div>
      </div>
    </motion.div>
  );
}
