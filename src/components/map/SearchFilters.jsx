import React, { useState, useRef, useEffect } from "react";
import { Search, SlidersHorizontal, X, Compass } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AnimatePresence } from "framer-motion";
import { ZINDEX } from "@/lib/zindex";
import FilterPanel from "./FilterPanel";

export default function SearchFilters({ filters, onFiltersChange, onLocateMe }) {
  const [expanded, setExpanded] = useState(false);
  const [searchText, setSearchText] = useState(filters.search || "");
  const panelRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setExpanded(false);
    };
    if (expanded) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [expanded]);

  const handleSearch = (val) => {
    setSearchText(val);
    onFiltersChange({ ...filters, search: val });
  };

  return (
    <div ref={panelRef} className="absolute top-4 left-4 right-4 sm:right-auto sm:w-[390px]" style={{ zIndex: ZINDEX.MAP_CONTROLS }}>
      <div className="rounded-[24px] border border-white/10 bg-black/44 p-2 backdrop-blur-xl shadow-[0_18px_60px_rgba(0,0,0,0.42)]">
        <div className="flex gap-2 items-center">
          <div className="flex-1 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500 pointer-events-none" />
            <Input
              placeholder="Buscar barrio, pizzería..."
              value={searchText}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-10 bg-white text-stone-900 placeholder:text-stone-400 h-11 rounded-2xl text-sm shadow-none border border-white/90 focus:border-white focus:ring-0 font-medium"
            />
            {searchText && (
              <button
                onClick={() => handleSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-black transition-colors w-5 h-5 flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className={`h-11 w-11 rounded-2xl flex items-center justify-center transition-all border ${expanded ? "bg-red-600 border-red-500 text-white" : "bg-[#111111]/92 border-white/12 text-stone-100 hover:bg-[#191919] hover:border-white/25"}`}
            aria-label="Open filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>

          <button
            onClick={onLocateMe}
            className="h-11 w-11 rounded-2xl flex items-center justify-center transition-all border bg-[#111111]/92 border-white/12 text-stone-100 hover:bg-[#191919] hover:border-white/25"
            aria-label="Locate me"
          >
            <Compass className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <FilterPanel filters={filters} onFiltersChange={onFiltersChange} resultCount={0} onClose={() => setExpanded(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
