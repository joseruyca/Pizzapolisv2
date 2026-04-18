import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Camera, Upload, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PhotoGallery({ placeId, photos, user, onRequireAuth }) {
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState(null);
  const fileRef = useRef();
  const queryClient = useQueryClient();

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!user) {
      onRequireAuth();
      return;
    }
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.Photo.create({
      place_id: placeId,
      user_email: user.email,
      user_name: user.full_name || "",
      file_url,
      status: "pending",
    });
    queryClient.invalidateQueries({ queryKey: ["photos", placeId] });
    setUploading(false);
    alert("Photo sent for review.");
  };

  const navigateLightbox = (dir) => {
    if (lightbox === null) return;
    const next = lightbox + dir;
    if (next >= 0 && next < photos.length) setLightbox(next);
  };

  return (
    <div>
      {/* Upload button */}
      <div className="mb-4">
        <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
        <Button
          variant="outline"
          size="sm"
          className="border-white/10 text-stone-300 hover:text-white hover:bg-white/5"
          onClick={() => {
            if (!user) { onRequireAuth(); return; }
            fileRef.current?.click();
          }}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Upload className="w-4 h-4 mr-1.5" />}
          {uploading ? "Uploading..." : "Add photo"}
        </Button>
      </div>

      {/* Photo grid */}
      {photos.length === 0 ? (
        <div className="text-center py-8">
          <Camera className="w-8 h-8 text-stone-700 mx-auto mb-2" />
          <p className="text-stone-500 text-sm">No photos yet. Add the first!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {photos.map((photo, idx) => (
            <button
              key={photo.id}
              onClick={() => setLightbox(idx)}
              className="aspect-square rounded-xl overflow-hidden bg-white/5 hover:opacity-80 transition"
            >
              <img src={photo.file_url} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[3000] bg-black/95 flex items-center justify-center"
            onClick={() => setLightbox(null)}
          >
            <button className="absolute top-4 right-4 text-white/60 hover:text-white z-10" onClick={() => setLightbox(null)}>
              <X className="w-6 h-6" />
            </button>
            {lightbox > 0 && (
              <button
                className="absolute left-4 text-white/60 hover:text-white z-10"
                onClick={(e) => { e.stopPropagation(); navigateLightbox(-1); }}
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}
            {lightbox < photos.length - 1 && (
              <button
                className="absolute right-4 text-white/60 hover:text-white z-10"
                onClick={(e) => { e.stopPropagation(); navigateLightbox(1); }}
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            )}
            <img
              src={photos[lightbox]?.file_url}
              alt=""
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-4 text-stone-400 text-xs">
              {photos[lightbox]?.user_name && `📸 ${photos[lightbox].user_name}`}
              {photos[lightbox]?.caption && ` — ${photos[lightbox].caption}`}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}