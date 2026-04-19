import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Heart, MapPin, Star, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";

export default function Favorites() {
  const { user, isLoadingAuth } = useAuth();
  const [selectedPlace, setSelectedPlace] = useState(null);

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ["favorites", user?.email],
    queryFn: async () => {
      if (!user) return [];
      const favs = await base44.entities.Favorite.filter({ user_email: user.email });
      if (favs.length === 0) return [];
      
      const places = await base44.entities.PizzaPlace.list('-created_date', 100);
      return favs
        .map(f => places.find(p => p.id === f.place_id))
        .filter(Boolean)
        .sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
    },
    enabled: !!user && !isLoadingAuth,
  });

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen bg-[#080808] pt-14 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#080808] pt-14 flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-12 h-12 text-stone-600 mx-auto mb-3" />
          <p className="text-stone-400">Sign in para ver favoritos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] pt-14 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2">My Favorites</h1>
          <p className="text-stone-500">{favorites.length} pizzeria{favorites.length !== 1 ? 's' : ''} saved</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          </div>
        ) : favorites.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Heart className="w-16 h-16 text-stone-700 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-white mb-2">No favorites yet</h2>
            <p className="text-stone-500 mb-6">Tap the heart icon to save pizzerias</p>
            <Link to={createPageUrl("Home")}>
              <button className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl">
                Explore map
              </button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {favorites.map((place, idx) => (
              <motion.button
                key={place.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => setSelectedPlace(place)}
                className="text-left bg-[#111] border border-white/10 hover:border-red-500/30 rounded-xl overflow-hidden transition-all hover:shadow-lg hover:shadow-red-500/10"
              >
                {place.cover_image_url && (
                  <div className="h-32 bg-gradient-to-b from-red-900/30 to-[#111] overflow-hidden">
                    <img
                      src={place.cover_image_url}
                      alt=""
                      className="w-full h-full object-cover opacity-60 hover:opacity-80 transition-opacity"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-bold text-white mb-1">{place.name}</h3>
                  <p className="text-xs text-stone-500 flex items-center gap-1 mb-3">
                    <MapPin className="w-3 h-3" />
                    {place.neighborhood}
                  </p>
                  <div className="flex items-center gap-3">
                    {place.average_rating && (
                      <div className="flex items-center gap-1 bg-red-600/10 px-2 py-1 rounded-lg">
                        <Star className="w-3 h-3 fill-red-500 text-red-500" />
                        <span className="text-red-400 font-bold text-xs">{place.average_rating}</span>
                      </div>
                    )}
                    {place.price_range && (
                      <span className="text-stone-500 text-xs">{place.price_range}</span>
                    )}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}