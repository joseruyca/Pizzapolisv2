import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Loader2, Lock, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function MyLists() {
  const { user, isLoadingAuth } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: "", emoji: "📍", description: "" });
  const queryClient = useQueryClient();

  const { data: lists = [], isLoading } = useQuery({
    queryKey: ["myLists", user?.email],
    queryFn: async () => {
      if (!user) return [];
      return base44.entities.List.filter({ user_email: user.email });
    },
    enabled: !!user && !isLoadingAuth,
  });

  const createListMutation = useMutation({
    mutationFn: (data) =>
      base44.entities.List.create({
        user_email: user.email,
        name: data.name,
        emoji: data.emoji,
        description: data.description,
        place_ids: [],
        is_public: false,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myLists", user?.email] });
      setShowForm(false);
      setFormData({ name: "", emoji: "📍", description: "" });
    },
  });

  const deleteListMutation = useMutation({
    mutationFn: (id) => base44.asServiceRole.entities.List.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["myLists", user?.email] }),
  });

  if (isLoadingAuth || !user) {
    return (
      <div className="min-h-screen bg-[#080808] pt-14 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808] pt-14 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-4xl font-black text-white">My Lists</h1>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-red-600 hover:bg-red-500 text-white gap-2"
          >
            <Plus className="w-4 h-4" />
            New List
          </Button>
        </div>

        {/* Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-[#111] border border-white/10 rounded-xl p-6 mb-8 space-y-4"
            >
              <div>
                <label className="text-sm text-stone-400 font-medium mb-2 block">Emoji</label>
                <input
                  type="text"
                  value={formData.emoji}
                  onChange={(e) => setFormData({ ...formData, emoji: e.target.value.slice(0, 2) })}
                  maxLength="2"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-center text-2xl"
                />
              </div>
              <div>
                <label className="text-sm text-stone-400 font-medium mb-2 block">List Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Late Night Slices"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-stone-600 focus:border-red-500/50 outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-stone-400 font-medium mb-2 block">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional description"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-stone-600 focus:border-red-500/50 outline-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1">
                  Cancel
                </Button>
                <Button
                  onClick={() => createListMutation.mutate(formData)}
                  disabled={!formData.name.trim() || createListMutation.isPending}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white"
                >
                  {createListMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lists */}
        {isLoading ? (
          <Loader2 className="w-8 h-8 animate-spin text-red-500" />
        ) : lists.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-6xl mb-4">📋</p>
            <h2 className="text-2xl font-black text-white mb-2">No lists yet</h2>
            <p className="text-stone-500 mb-6">Create a list to organize your favorite pizzerias</p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {lists.map((list, idx) => (
              <motion.div
                key={list.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-[#111] border border-white/10 hover:border-red-500/30 rounded-xl p-6 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="text-4xl">{list.emoji}</div>
                  <button
                    onClick={() => deleteListMutation.mutate(list.id)}
                    className="p-2 rounded-lg bg-red-600/10 text-red-400 hover:bg-red-600/20 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h3 className="font-bold text-white text-lg mb-1">{list.name}</h3>
                {list.description && <p className="text-sm text-stone-500 mb-3">{list.description}</p>}
                <div className="flex items-center justify-between text-xs text-stone-400">
                  <span>{list.place_ids?.length || 0} pizzerias</span>
                  <div className="flex items-center gap-1">
                    {list.is_public ? (
                      <>
                        <Globe className="w-3 h-3" />
                        Public
                      </>
                    ) : (
                      <>
                        <Lock className="w-3 h-3" />
                        Private
                      </>
                    )}
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