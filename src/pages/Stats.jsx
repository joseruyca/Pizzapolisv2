import React from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Star, MapPin, Heart, Users, TrendingUp, Loader2, Award } from "lucide-react";
import { motion } from "framer-motion";

export default function Stats() {
  const { user, isLoadingAuth } = useAuth();

  const { data: ratings = [] } = useQuery({
    queryKey: ["userRatings", user?.email],
    queryFn: () => user ? base44.entities.Rating.filter({ user_email: user.email }) : [],
    enabled: !!user && !isLoadingAuth,
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ["userFavorites", user?.email],
    queryFn: () => user ? base44.entities.Favorite.filter({ user_email: user.email }) : [],
    enabled: !!user && !isLoadingAuth,
  });

  const { data: badges = [] } = useQuery({
    queryKey: ["userBadges", user?.email],
    queryFn: () => user ? base44.entities.UserBadge.filter({ user_email: user.email }) : [],
    enabled: !!user && !isLoadingAuth,
  });

  const { data: quedadas = [] } = useQuery({
    queryKey: ["userQuedadas", user?.id],
    queryFn: async () => {
      if (!user) return [];
      return base44.entities.Quedada.filter({ creador_id: user.id });
    },
    enabled: !!user && !isLoadingAuth,
  });

  const { data: intereses = [] } = useQuery({
    queryKey: ["userIntereses", user?.email],
    queryFn: () => user ? base44.entities.Interes.filter({ usuario_id: user.email }) : [],
    enabled: !!user && !isLoadingAuth,
  });

  const { data: searches = [] } = useQuery({
    queryKey: ["userSearches", user?.email],
    queryFn: () => user ? base44.entities.SearchLog.filter({ user_email: user.email }, "-created_date", 50) : [],
    enabled: !!user && !isLoadingAuth,
  });

  if (isLoadingAuth || !user) {
    return (
      <div className="min-h-screen bg-[#080808] pt-14 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  const avgRating = ratings.length > 0
    ? (ratings.reduce((sum, r) => sum + r.score, 0) / ratings.length).toFixed(1)
    : "—";

  const stats = [
    { icon: MapPin, label: "Pizzerias Visited", value: ratings.length, color: "from-red-600 to-red-700" },
    { icon: Star, label: "Ratings Given", value: ratings.length, color: "from-yellow-600 to-orange-600" },
    { icon: Heart, label: "Favorites", value: favorites.length, color: "from-pink-600 to-red-600" },
    { icon: Users, label: "Groups Created", value: quedadas.length, color: "from-blue-600 to-purple-600" },
    { icon: TrendingUp, label: "Avg Rating", value: avgRating, color: "from-green-600 to-emerald-600" },
    { icon: Award, label: "Badges", value: badges.length, color: "from-yellow-500 to-yellow-600" },
  ];

  const topSearches = [...new Set(searches.map(s => s.query))].slice(0, 5);

  return (
    <div className="min-h-screen bg-[#080808] pt-14 pb-20 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-black text-white mb-2">Your Stats</h1>
        <p className="text-stone-500 mb-8">Your pizza journey by the numbers</p>

        {/* Grid de stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className={`bg-gradient-to-br ${stat.color} rounded-xl p-6 relative overflow-hidden group`}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-white transition-opacity" />
                <div className="relative z-10">
                  <Icon className="w-8 h-8 text-white mb-3 opacity-80" />
                  <p className="text-white/70 text-sm font-medium mb-1">{stat.label}</p>
                  <p className="text-4xl font-black text-white">{stat.value}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Recent searches */}
        {topSearches.length > 0 && (
          <div className="bg-[#111] border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Your Recent Searches</h2>
            <div className="flex flex-wrap gap-2">
              {topSearches.map((search, idx) => (
                <motion.div
                  key={search}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.1 }}
                  className="px-4 py-2 bg-white/10 border border-white/20 rounded-full text-sm text-stone-300 hover:border-red-500/50 transition-colors cursor-pointer"
                >
                  🔍 {search}
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}