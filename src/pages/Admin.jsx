import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Loader2, CheckCircle, EyeOff, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Admin() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("comments");
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadUser = async () => {
      try {
        const u = await base44.auth.me();
        if (u?.role !== "admin") {
          window.location.href = "/";
          return;
        }
        setUser(u);
      } catch (e) {
        window.location.href = "/";
      }
    };
    loadUser();
  }, []);

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ["allComments"],
    queryFn: () => base44.asServiceRole.entities.Comment.list('-created_date', 100),
    enabled: !!user,
  });

  const { data: photos = [], isLoading: photosLoading } = useQuery({
    queryKey: ["allPhotos"],
    queryFn: () => base44.asServiceRole.entities.Photo.list('-created_date', 100),
    enabled: !!user,
  });

  const { data: places = [] } = useQuery({
    queryKey: ["allPlaces"],
    queryFn: () => base44.asServiceRole.entities.PizzaPlace.list('-created_date', 100),
    enabled: !!user,
  });

  const updateCommentMutation = useMutation({
    mutationFn: (data) => base44.asServiceRole.entities.Comment.update(data.id, { status: data.status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["allComments"] }),
  });

  const updatePhotoMutation = useMutation({
    mutationFn: (data) => base44.asServiceRole.entities.Photo.update(data.id, { status: data.status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["allPhotos"] }),
  });

  const deleteCommentMutation = useMutation({
    mutationFn: (id) => base44.asServiceRole.entities.Comment.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["allComments"] }),
  });

  const deletePhotoMutation = useMutation({
    mutationFn: (id) => base44.asServiceRole.entities.Photo.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["allPhotos"] }),
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-[#080808] pt-14 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  const pendingComments = comments.filter(c => c.status !== "visible");
  const pendingPhotos = photos.filter(p => p.status !== "visible");

  return (
    <div className="min-h-screen bg-[#080808] pt-14 pb-20 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex items-center gap-3">
          <Shield className="w-8 h-8 text-red-500" />
          <h1 className="text-4xl font-black text-white">Admin Dashboard</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#111] border border-white/10 rounded-xl p-6">
            <p className="text-stone-500 text-sm mb-2">Pending Comments</p>
            <p className="text-4xl font-black text-red-500">{pendingComments.length}</p>
          </div>
          <div className="bg-[#111] border border-white/10 rounded-xl p-6">
            <p className="text-stone-500 text-sm mb-2">Pending Photos</p>
            <p className="text-4xl font-black text-yellow-500">{pendingPhotos.length}</p>
          </div>
          <div className="bg-[#111] border border-white/10 rounded-xl p-6">
            <p className="text-stone-500 text-sm mb-2">Total Places</p>
            <p className="text-4xl font-black text-green-500">{places.length}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/10">
          {[
            { id: "comments", label: "Comments", count: pendingComments.length },
            { id: "photos", label: "Photos", count: pendingPhotos.length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "text-white border-b-2 border-red-500"
                  : "text-stone-500 hover:text-white"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 bg-red-600 text-white px-2 py-0.5 rounded-full text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Comments Tab */}
        {activeTab === "comments" && (
          <div className="space-y-3">
            {commentsLoading ? (
              <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            ) : pendingComments.length === 0 ? (
              <p className="text-stone-500 text-center py-8">All comments approved ✓</p>
            ) : (
              <AnimatePresence>
                {pendingComments.map((comment, idx) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-[#111] border border-white/10 rounded-xl p-5"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-stone-400 text-sm">{comment.user_name} ({comment.user_email})</p>
                        <p className="text-stone-500 text-xs mt-1">
                          Pizzeria: {places.find(p => p.id === comment.place_id)?.name}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateCommentMutation.mutate({ id: comment.id, status: "visible" })}
                          className="p-2 rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600/30 transition"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => updateCommentMutation.mutate({ id: comment.id, status: "hidden" })}
                          className="p-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition"
                        >
                          <EyeOff className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteCommentMutation.mutate(comment.id)}
                          className="p-2 rounded-lg bg-stone-700/30 text-stone-400 hover:bg-stone-700/50 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-white text-sm">{comment.text}</p>
                    <p className="text-stone-600 text-xs mt-3">{comment.status}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        )}

        {/* Photos Tab */}
        {activeTab === "photos" && (
          <div className="space-y-3">
            {photosLoading ? (
              <Loader2 className="w-8 h-8 animate-spin text-red-500" />
            ) : pendingPhotos.length === 0 ? (
              <p className="text-stone-500 text-center py-8">All photos approved ✓</p>
            ) : (
              <AnimatePresence>
                {pendingPhotos.map((photo, idx) => (
                  <motion.div
                    key={photo.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-[#111] border border-white/10 rounded-xl p-5"
                  >
                    <div className="flex gap-4">
                      <img
                        src={photo.file_url}
                        alt=""
                        className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1">
                        <p className="text-stone-400 text-sm">{photo.user_name} ({photo.user_email})</p>
                        <p className="text-stone-500 text-xs mt-1">
                          Pizzeria: {places.find(p => p.id === photo.place_id)?.name}
                        </p>
                        {photo.caption && (
                          <p className="text-stone-300 text-sm mt-2">{photo.caption}</p>
                        )}
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => updatePhotoMutation.mutate({ id: photo.id, status: "visible" })}
                            className="px-3 py-1 rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600/30 transition text-sm font-medium"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => deletePhotoMutation.mutate(photo.id)}
                            className="px-3 py-1 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30 transition text-sm font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        )}
      </div>
    </div>
  );
}