import React, { useState, useEffect } from "react";
import { Search, X, MapPin, Users, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { createPageUrl } from "@/utils";

async function runSearch(query) {
  const q = query.trim();
  if (!q) return { spots: [], plans: [] };

  const [spotsRes, plansRes] = await Promise.all([
    supabase
      .from("spots")
      .select("id,name,address")
      .eq("status", "approved")
      .or(`name.ilike.%${q}%,address.ilike.%${q}%`)
      .limit(5),
    supabase
      .from("plans")
      .select("id,title,max_people,spot_id,status")
      .eq("status", "active")
      .ilike("title", `%${q}%`)
      .limit(5),
  ]);

  return {
    spots: spotsRes.data || [],
    plans: plansRes.data || [],
  };
}

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState({ spots: [], plans: [] });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const delaySearch = setTimeout(async () => {
      if (!query.trim()) {
        setResults({ spots: [], plans: [] });
        return;
      }
      setLoading(true);
      try {
        const next = await runSearch(query);
        setResults(next);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(delaySearch);
  }, [query]);

  const handleSelectSpot = (spot) => {
    navigate(`${createPageUrl("Home")}?spot=${spot.id}`);
    setQuery("");
    setOpen(false);
  };

  const handleSelectPlan = () => {
    navigate(createPageUrl("Descubrir"));
    setQuery("");
    setOpen(false);
  };

  return (
    <div className="relative flex-1 max-w-md hidden md:block">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search spots or plans..."
          className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-9 py-2 text-sm text-white placeholder:text-stone-600 focus:border-red-500/50 focus:bg-white/10 outline-none transition-all"
        />
        {query && (
          <button onClick={() => { setQuery(""); setOpen(false); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && query.trim() && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="absolute top-full left-0 right-0 mt-2 bg-[#111] border border-white/10 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 flex items-center justify-center"><Loader2 className="w-4 h-4 animate-spin text-red-500" /></div>
            ) : results.spots.length === 0 && results.plans.length === 0 ? (
              <div className="p-4 text-center text-stone-500 text-sm">No results</div>
            ) : (
              <div>
                {results.spots.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs text-stone-500 uppercase tracking-wider font-medium bg-white/5 border-b border-white/10">Spots</div>
                    {results.spots.map((spot) => (
                      <button key={spot.id} onClick={() => handleSelectSpot(spot)} className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors border-b border-white/5">
                        <p className="font-medium text-white text-sm">{spot.name}</p>
                        <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{spot.address}</p>
                      </button>
                    ))}
                  </div>
                )}
                {results.plans.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs text-stone-500 uppercase tracking-wider font-medium bg-white/5 border-b border-white/10">Plans</div>
                    {results.plans.map((plan) => (
                      <button key={plan.id} onClick={() => handleSelectPlan(plan)} className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors border-b border-white/5">
                        <p className="font-medium text-white text-sm">{plan.title}</p>
                        <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5"><Users className="w-3 h-3" />up to {plan.max_people} people</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
