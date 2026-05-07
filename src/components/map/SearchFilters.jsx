import React, { useState, useRef, useEffect } from 'react';
import { Compass, MapPinned, Search, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { AnimatePresence } from 'framer-motion';
import { ZINDEX } from '@/lib/zindex';
import FilterPanel from './FilterPanel';

export default function SearchFilters({
  filters,
  onFiltersChange,
  onLocateMe,
  resultCount = 0,
  hasMapMoved = false,
  usingMapArea = false,
  onSearchArea,
}) {
  const [expanded, setExpanded] = useState(false);
  const [searchText, setSearchText] = useState(filters.search || '');
  const panelRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setExpanded(false);
    };
    if (expanded) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [expanded]);

  const handleSearch = (val) => {
    setSearchText(val);
    onFiltersChange({ ...filters, search: val });
  };

  const buttonClass = (active = false) =>
    `flex h-11 w-11 items-center justify-center rounded-2xl border transition ${
      active
        ? 'border-[#f1df9c] bg-[#efbf3a] text-[#141414]'
        : 'border-black/10 bg-[#fffaf2]/95 text-[#141414] hover:bg-white'
    }`;

  return (
    <div ref={panelRef} className="pointer-events-none absolute left-4 right-4 top-4 sm:right-auto sm:w-[390px]" style={{ zIndex: ZINDEX.MAP_CONTROLS }}>
      <div className="pointer-events-auto rounded-[28px] border border-black/8 bg-[#fffaf2]/92 p-2 backdrop-blur-xl shadow-[0_20px_50px_rgba(39,29,14,0.18)]">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8e8578]" />
            <Input
              placeholder="Search by spot, address, best slice or note"
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
              className="h-11 rounded-2xl border-black/10 bg-white pl-10 pr-10 text-sm font-medium text-[#141414] placeholder:text-[#9c9385] shadow-none focus-visible:ring-[#efbf3a]"
            />
            {searchText && (
              <button onClick={() => handleSearch('')} className="absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-[#8e8578] transition-colors hover:text-[#141414]">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <button onClick={() => setExpanded(!expanded)} className={buttonClass(expanded)} aria-label="Open filters">
            <SlidersHorizontal className="h-4 w-4" />
          </button>

          <button onClick={onLocateMe} className={buttonClass(false)} aria-label="Locate me">
            <Compass className="h-4 w-4" />
          </button>
        </div>
      </div>

      {hasMapMoved && onSearchArea ? (
        <button
          type="button"
          onClick={() => onSearchArea(usingMapArea ? "disable" : "enable")}
          className={`pointer-events-auto mt-2 inline-flex h-10 items-center gap-2 rounded-2xl border px-3 text-xs font-black uppercase tracking-[0.12em] shadow-[0_14px_30px_rgba(39,29,14,0.16)] transition ${
            usingMapArea ? "border-[#f1df9c] bg-[#efbf3a] text-[#141414]" : "border-black/8 bg-[#fffaf2]/95 text-[#141414] hover:bg-white"
          }`}
        >
          <MapPinned className="h-4 w-4" />
          {usingMapArea ? "Showing map area" : "Search this area"}
        </button>
      ) : null}

      <AnimatePresence>
        {expanded && <div className="pointer-events-auto"><FilterPanel filters={filters} onFiltersChange={onFiltersChange} resultCount={resultCount} onClose={() => setExpanded(false)} /></div>}
      </AnimatePresence>
    </div>
  );
}
