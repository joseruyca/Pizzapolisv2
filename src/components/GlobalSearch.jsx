import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, X, MapPin, Users, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";

export default function GlobalSearch({ user }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [places, setPlaces] = useState([]);
  const [quedadas, setQuedadas] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const delaySearch = setTimeout(async () => {
      if (!query.trim()) {
        setPlaces([]);
        setQuedadas([]);
        return;
      }

      setLoading(true);
      try {
        const q = query.toLowerCase();
        const [allPlaces, allQuedadas] = await Promise.all([
          base44.entities.PizzaPlace.filter({ status: "active" }),
          base44.entities.Quedada.filter({ estado: "activa" })
        ]);

        setPlaces(
          allPlaces
            .filter(p => p.name?.toLowerCase().includes(q) || p.neighborhood?.toLowerCase().includes(q))
            .slice(0, 4)
        );

        setQuedadas(
          allQuedadas
            .filter(q => q.titulo?.toLowerCase().includes(query.toLowerCase()))
            .slice(0, 4)
        );

        // Log búsqueda
        if (user) {
          await base44.asServiceRole.entities.SearchLog.create({
            user_email: user.email,
            query,
            type: "place"
          });
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    }, 300);

    return () => clearTimeout(delaySearch);
  }, [query, user]);

  const handleSelectPlace = (place) => {
    setQuery("");
    setOpen(false);
    // Navegar a home con el lugar seleccionado
    navigate("/");
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
          placeholder="Search pizzerias, groups..."
          className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-9 py-2 text-sm text-white placeholder:text-stone-600 focus:border-red-500/50 focus:bg-white/10 outline-none transition-all"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && query.trim() && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute top-full left-0 right-0 mt-2 bg-[#111] border border-white/10 rounded-xl shadow-xl z-50 max-h-96 overflow-y-auto"
          >
            {loading ? (
              <div className="p-4 flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-red-500" />
              </div>
            ) : places.length === 0 && quedadas.length === 0 ? (
              <div className="p-4 text-center text-stone-500 text-sm">No results</div>
            ) : (
              <div>
                {/* Places */}
                {places.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs text-stone-500 uppercase tracking-wider font-medium bg-white/5 border-b border-white/10">
                      Pizzerias
                    </div>
                    {places.map((place) => (
                      <button
                        key={place.id}
                        onClick={() => handleSelectPlace(place)}
                        className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors border-b border-white/5"
                      >
                        <p className="font-medium text-white text-sm">{place.name}</p>
                        <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          {place.neighborhood}
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                {/* Grupos */}
                {quedadas.length > 0 && (
                  <div>
                    <div className="px-4 py-2 text-xs text-stone-500 uppercase tracking-wider font-medium bg-white/5 border-b border-white/10">
                      Hangouts
                    </div>
                    {quedadas.map((q) => (
                      <button
                        key={q.id}
                        onClick={() => {
                          navigate(createPageUrl("Descubrir"));
                          setQuery("");
                          setOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors border-b border-white/5"
                      >
                        <p className="font-medium text-white text-sm">{q.titulo}</p>
                        <p className="text-xs text-stone-500 flex items-center gap-1 mt-0.5">
                          <Users className="w-3 h-3" />
                          {q.max_participantes} spots
                        </p>
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