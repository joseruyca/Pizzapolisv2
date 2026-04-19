import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Loader2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Guides() {
  const { data: guides = [], isLoading } = useQuery({
    queryKey: ["guides"],
    queryFn: () => base44.entities.Guide.filter({ status: "published" }),
  });

  const { data: places = [] } = useQuery({
    queryKey: ["guidePlaces"],
    queryFn: () => base44.entities.PizzaPlace.filter({ status: "active" }),
  });

  const guidesWithPlaces = guides.map(g => ({
    ...g,
    places: g.place_ids?.slice(0, 3).map(id => places.find(p => p.id === id)).filter(Boolean) || []
  }));

  return (
    <div className="min-h-screen bg-[#080808] pt-14 pb-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-blue-500" />
            Guides
          </h1>
          <p className="text-stone-500">Curated collections for every occasion</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          </div>
        ) : guides.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <p className="text-6xl mb-4">📚</p>
            <h2 className="text-2xl font-black text-white mb-2">Sin guías disponibles</h2>
            <p className="text-stone-500">Vuelve pronto para nuevas colecciones curadas</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {guidesWithPlaces.map((guide, idx) => (
              <motion.div
                key={guide.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-[#111] border border-white/10 hover:border-blue-500/30 rounded-xl overflow-hidden transition-all group cursor-pointer"
              >
                {guide.cover_image_url && (
                  <div className="h-40 bg-gradient-to-b from-blue-900/30 to-[#111] overflow-hidden">
                    <img
                      src={guide.cover_image_url}
                      alt=""
                      className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity"
                    />
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-white mb-1">{guide.title}</h3>
                  {guide.subtitle && <p className="text-sm text-stone-500 mb-3">{guide.subtitle}</p>}

                  {/* Preview de lugares */}
                  <div className="space-y-2 mb-4">
                    {guide.places.map((place, pidx) => (
                      <div key={place.id} className="flex items-center gap-2 text-xs text-stone-400">
                        <span className="text-blue-500 font-bold">{pidx + 1}.</span>
                        <span className="truncate">{place.name}</span>
                      </div>
                    ))}
                    {guide.place_ids?.length > 3 && (
                      <p className="text-xs text-stone-600 italic">
                        +{guide.place_ids.length - 3} más
                      </p>
                    )}
                  </div>

                  <button className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors text-sm font-medium">
                    Explorar
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}