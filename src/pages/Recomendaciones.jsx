import React, { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Star, MapPin, Loader2, Heart } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

export default function Recomendaciones() {
  const { user, isLoadingAuth } = useAuth();

  const { data: myRatings = [] } = useQuery({
    queryKey: ["myRatings", user?.email],
    queryFn: () => user ? base44.entities.Rating.filter({ user_email: user.email }) : [],
    enabled: !!user && !isLoadingAuth,
  });

  const { data: allPlaces = [] } = useQuery({
    queryKey: ["allPlaces"],
    queryFn: () => base44.entities.PizzaPlace.filter({ status: "active" }),
  });

  const { data: allRatings = [] } = useQuery({
    queryKey: ["allRatings"],
    queryFn: () => base44.asServiceRole.entities.Rating.list('-created_date', 1000),
  });

  const recommendations = useMemo(() => {
    if (!user || myRatings.length === 0) {
      // Sin datos, mostrar top rated
      return allPlaces
        .filter(p => !myRatings.find(r => r.place_id === p.id))
        .sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
        .slice(0, 8);
    }

    // Encontrar usuarios similares (que calificaron lugares que yo califiqué)
    const myPlaceIds = new Set(myRatings.map(r => r.place_id));
    const userRatings = new Map();

    allRatings.forEach(r => {
      if (r.user_email !== user.email && myPlaceIds.has(r.place_id)) {
        if (!userRatings.has(r.user_email)) userRatings.set(r.user_email, []);
        userRatings.get(r.user_email).push(r);
      }
    });

    // Obtener lugares que similares calificaron bien
    const recommendedPlaces = new Map();
    userRatings.forEach((ratings) => {
      ratings.filter(r => r.score >= 4).forEach(r => {
        if (!myPlaceIds.has(r.place_id)) {
          if (!recommendedPlaces.has(r.place_id)) recommendedPlaces.set(r.place_id, 0);
          recommendedPlaces.set(r.place_id, recommendedPlaces.get(r.place_id) + r.score);
        }
      });
    });

    return Array.from(recommendedPlaces.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([placeId]) => allPlaces.find(p => p.id === placeId))
      .filter(Boolean);
  }, [user, myRatings, allPlaces, allRatings]);

  if (isLoadingAuth || !user) {
    return (
      <div className="min-h-screen bg-[#080808] pt-14 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] pt-14 pb-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2 flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-yellow-500" />
            Recomendaciones
          </h1>
          <p className="text-stone-500">
            {myRatings.length > 0 ? "Basadas en tus ratings y usuarios similares" : "Top pizzerías mejor valoradas"}
          </p>
        </div>

        {recommendations.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
            <p className="text-6xl mb-4">🍕</p>
            <h2 className="text-2xl font-black text-white mb-2">Sin recomendaciones aún</h2>
            <p className="text-stone-500 mb-6">Califica pizzerías para obtener recomendaciones personalizadas</p>
            <Link to="/">
              <button className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl">
                Ir al mapa
              </button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommendations.map((place, idx) => (
              <motion.div
                key={place.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-[#111] border border-white/10 hover:border-red-500/30 rounded-xl overflow-hidden transition-all group"
              >
                {place.cover_image_url && (
                  <div className="h-32 overflow-hidden bg-gradient-to-b from-red-900/30 to-[#111]">
                    <img
                      src={place.cover_image_url}
                      alt=""
                      className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-bold text-white mb-1 line-clamp-2">{place.name}</h3>
                  <p className="text-xs text-stone-500 flex items-center gap-1 mb-3">
                    <MapPin className="w-3 h-3" />
                    {place.neighborhood}
                  </p>
                  <div className="flex items-center justify-between">
                    {place.average_rating && (
                      <div className="flex items-center gap-1 bg-red-600/10 px-2 py-1 rounded-lg">
                        <Star className="w-3 h-3 fill-red-500 text-red-500" />
                        <span className="text-red-400 font-bold text-xs">{place.average_rating}</span>
                      </div>
                    )}
                    <button className="p-2 hover:bg-red-600/20 rounded-lg transition-colors">
                      <Heart className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}