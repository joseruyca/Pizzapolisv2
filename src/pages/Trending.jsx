import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Star, MapPin, Loader2, TrendingUp, Heart } from "lucide-react";
import { motion } from "framer-motion";

export default function Trending() {
  const [sortBy, setSortBy] = useState("rating");

  const { data: places = [], isLoading } = useQuery({
    queryKey: ["places"],
    queryFn: () => base44.entities.PizzaPlace.filter({ status: "active" }),
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ["allFavorites"],
    queryFn: () => base44.asServiceRole.entities.Favorite.list('-created_date', 500),
  });

  const trendingPlaces = useMemo(() => {
    const withCounts = places.map(p => {
      const favCount = favorites.filter(f => f.place_id === p.id).length;
      return { ...p, favCount };
    });

    if (sortBy === "rating") {
      return [...withCounts].sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
    } else {
      return [...withCounts].sort((a, b) => b.favCount - a.favCount);
    }
  }, [places, favorites, sortBy]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080808] pt-14 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] pt-14 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-white mb-2 flex items-center gap-2">
              <TrendingUp className="w-8 h-8 text-red-500" />
              Trending Now
            </h1>
            <p className="text-stone-500">Most popular pizzerias in NYC</p>
          </div>
          <div className="flex gap-2">
            {[
              { id: "rating", label: "Top Rated" },
              { id: "favorites", label: "Most Loved" }
            ].map(btn => (
              <button
                key={btn.id}
                onClick={() => setSortBy(btn.id)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  sortBy === btn.id
                    ? "bg-red-600 text-white"
                    : "bg-white/10 text-stone-300 hover:bg-white/20"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {trendingPlaces.map((place, idx) => (
            <motion.div
              key={place.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-[#111] border border-white/10 hover:border-red-500/30 rounded-xl p-4 transition-all hover:shadow-lg hover:shadow-red-500/10 flex items-start gap-4"
            >
              {/* Rank */}
              <div className="text-3xl font-black text-red-600 w-12 text-center flex-shrink-0">
                {idx + 1}
              </div>

              {/* Info */}
              <div className="flex-1">
                <h3 className="font-bold text-white text-lg mb-1">{place.name}</h3>
                <p className="text-sm text-stone-500 flex items-center gap-1 mb-3">
                  <MapPin className="w-4 h-4" />
                  {place.neighborhood}, {place.borough}
                </p>
                {place.best_known_slice && (
                  <p className="text-xs text-stone-400">🍕 {place.best_known_slice}</p>
                )}
              </div>

              {/* Stats */}
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <div className="flex items-center gap-3">
                  {place.average_rating && (
                    <div className="flex items-center gap-1.5 bg-red-600/10 px-3 py-1.5 rounded-lg">
                      <Star className="w-4 h-4 fill-red-500 text-red-500" />
                      <span className="text-red-400 font-bold">{place.average_rating}</span>
                    </div>
                  )}
                  {place.price_range && (
                    <div className="text-stone-400 text-sm font-medium">{place.price_range}</div>
                  )}
                </div>
                {sortBy === "favorites" && place.favCount > 0 && (
                  <div className="flex items-center gap-1 text-red-400 text-sm font-medium">
                    <Heart className="w-3.5 h-3.5 fill-red-400" />
                    {place.favCount}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}