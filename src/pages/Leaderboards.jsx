import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Medal, Zap, Loader2, Award } from "lucide-react";
import { motion } from "framer-motion";

export default function Leaderboards() {
  const [activeTab, setActiveTab] = useState("badges");

  const { data: badges = [], isLoading: badgesLoading } = useQuery({
    queryKey: ["allBadges"],
    queryFn: () => base44.asServiceRole.entities.UserBadge.list('-created_date', 500),
  });

  const { data: ratings = [] } = useQuery({
    queryKey: ["allRatings"],
    queryFn: () => base44.asServiceRole.entities.Rating.list('-created_date', 500),
  });

  const { data: quedadas = [] } = useQuery({
    queryKey: ["allQuedadas"],
    queryFn: () => base44.asServiceRole.entities.Quedada.list('-created_date', 500),
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ["allFavorites"],
    queryFn: () => base44.asServiceRole.entities.Favorite.list('-created_date', 500),
  });

  const { data: users = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => base44.asServiceRole.entities.User.list('-created_date', 100),
  });

  const leaderboards = useMemo(() => {
    // Top Badges
    const badgesByUser = {};
    badges.forEach(b => {
      if (!badgesByUser[b.user_email]) badgesByUser[b.user_email] = 0;
      badgesByUser[b.user_email]++;
    });

    const topBadges = Object.entries(badgesByUser)
      .map(([email, count]) => ({ email, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Top Raters
    const ratingsByUser = {};
    ratings.forEach(r => {
      if (!ratingsByUser[r.user_email]) ratingsByUser[r.user_email] = 0;
      ratingsByUser[r.user_email]++;
    });

    const topRaters = Object.entries(ratingsByUser)
      .map(([email, count]) => ({ email, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Top Group Creators
    const groupsByUser = {};
    quedadas.forEach(q => {
      if (!groupsByUser[q.creador_id]) groupsByUser[q.creador_id] = 0;
      groupsByUser[q.creador_id]++;
    });

    const topCreators = Object.entries(groupsByUser)
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return { topBadges, topRaters, topCreators };
  }, [badges, ratings, quedadas]);

  const getUser = (email) => users.find(u => u.email === email);
  const getUserById = (id) => users.find(u => u.id === id);

  const isLoading = badgesLoading;

  const tabs = [
    { id: "badges", label: "Top Badges", icon: Trophy },
    { id: "raters", label: "Top Raters", icon: Zap },
    { id: "creators", label: "Group Creators", icon: Award },
  ];

  return (
    <div className="min-h-screen bg-[#080808] pt-14 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-black text-white mb-2">Leaderboards</h1>
          <p className="text-stone-500">Top community members</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-white/10">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? "text-white border-b-2 border-red-500"
                    : "text-stone-500 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-red-500" />
          </div>
        ) : (
          <div className="space-y-3">
            {activeTab === "badges" &&
              leaderboards.topBadges.map((entry, idx) => {
                const user = getUser(entry.email);
                const icons = [Trophy, Medal, "🥉"];
                const Icon = idx < 3 ? icons[idx] : null;
                return (
                  <motion.div
                    key={entry.email}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={`flex items-center gap-4 p-4 rounded-xl border ${
                      idx < 3
                        ? "bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border-yellow-500/30"
                        : "bg-[#111] border-white/10"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                        idx === 0
                          ? "bg-yellow-600"
                          : idx === 1
                          ? "bg-gray-500"
                          : idx === 2
                          ? "bg-orange-700"
                          : "bg-stone-700"
                      }`}
                    >
                      {Icon && typeof Icon === "function" ? (
                        <Icon className="w-5 h-5" />
                      ) : (
                        <span>{Icon}</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-white">{user?.full_name || entry.email}</p>
                      <p className="text-xs text-stone-500">{entry.count} badges</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-yellow-500">#{idx + 1}</p>
                    </div>
                  </motion.div>
                );
              })}

            {activeTab === "raters" &&
              leaderboards.topRaters.map((entry, idx) => {
                const user = getUser(entry.email);
                return (
                  <motion.div
                    key={entry.email}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-4 p-4 rounded-xl bg-[#111] border border-white/10"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-600 to-orange-700 flex items-center justify-center font-bold text-white">
                      {user?.full_name?.[0] || "?"}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-white">{user?.full_name || entry.email}</p>
                      <p className="text-xs text-stone-500">{entry.count} ratings</p>
                    </div>
                    <div className="text-2xl font-black text-red-500">#{idx + 1}</div>
                  </motion.div>
                );
              })}

            {activeTab === "creators" &&
              leaderboards.topCreators.map((entry, idx) => {
                const user = getUserById(entry.id);
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="flex items-center gap-4 p-4 rounded-xl bg-[#111] border border-white/10"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center font-bold text-white">
                      {user?.full_name?.[0] || "?"}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-white">{user?.full_name || "User"}</p>
                      <p className="text-xs text-stone-500">{entry.count} groups created</p>
                    </div>
                    <div className="text-2xl font-black text-blue-500">#{idx + 1}</div>
                  </motion.div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}