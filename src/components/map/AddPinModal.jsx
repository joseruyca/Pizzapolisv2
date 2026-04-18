import React, { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, Marker, TileLayer, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import { CheckCircle, ImagePlus, Loader2, MapPin, Search, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const markerIcon = L.icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const initialForm = {
  name: "",
  neighborhood: "NYC",
  borough: "",
  address: "",
  standard_slice_price: "3.50",
  best_known_slice: "",
  description: "",
  photo_url: "",
  latitude: 40.7128,
  longitude: -74.006,
};

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function inferPlaceMeta(item) {
  const address = item?.address || {};
  const rawDisplay = item?.display_name || "";
  const parts = rawDisplay.split(",").map((part) => part.trim()).filter(Boolean);
  const borough =
    address.borough ||
    parts.find((part) => ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"].includes(part)) ||
    "";

  const neighborhood =
    address.neighbourhood ||
    address.suburb ||
    address.city_district ||
    address.quarter ||
    address.hamlet ||
    address.city ||
    parts[0] ||
    "NYC";

  return { neighborhood, borough };
}

function MapViewport({ position }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position, map.getZoom(), { animate: true });
    const id = window.setTimeout(() => map.invalidateSize(), 120);
    return () => window.clearTimeout(id);
  }, [map, position]);
  return null;
}

function MapPicker({ value, onChange }) {
  const position = useMemo(() => [value.latitude, value.longitude], [value.latitude, value.longitude]);

  function MapEvents() {
    useMapEvents({
      click: (event) => onChange({ latitude: event.latlng.lat, longitude: event.latlng.lng }),
    });
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="h-64 overflow-hidden rounded-[24px] border border-white/10 bg-black/20">
        <MapContainer center={position} zoom={14} className="h-full w-full">
          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution="" />
          <Marker position={position} icon={markerIcon} />
          <MapViewport position={position} />
          <MapEvents />
        </MapContainer>
      </div>
      <p className="text-xs leading-5 text-stone-500">Search for the street first, then tap the map if you want to fine-tune the pin.</p>
    </div>
  );
}

export default function AddPinModal({ open, onClose, user }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [photoName, setPhotoName] = useState("");

  useEffect(() => {
    if (!open) return;
    const query = locationQuery.trim();
    if (query.length < 3) {
      setSuggestions([]);
      setSearching(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setSearching(true);
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=5&countrycodes=us&q=${encodeURIComponent(`${query}, New York City`)}`;
        const response = await fetch(url, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        const results = await response.json();
        setSuggestions(Array.isArray(results) ? results : []);
      } catch (error) {
        if (error?.name !== "AbortError") {
          console.error(error);
          setSuggestions([]);
        }
      } finally {
        setSearching(false);
      }
    }, 280);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [locationQuery, open]);

  if (!open) return null;

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  function handleSelectSuggestion(item) {
    const meta = inferPlaceMeta(item);
    const addressLabel = item.display_name || "";
    setForm((current) => ({
      ...current,
      address: addressLabel,
      latitude: Number(item.lat),
      longitude: Number(item.lon),
      neighborhood: meta.neighborhood || current.neighborhood || "NYC",
      borough: meta.borough || current.borough || "",
    }));
    setLocationQuery(addressLabel);
    setSuggestions([]);
  }

  async function handlePhotoChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setPhotoName(file.name);
      setForm((current) => ({ ...current, photo_url: dataUrl }));
    } catch (error) {
      console.error(error);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!user || submitting) return;
    setSubmitting(true);
    try {
      await base44.entities.PizzaPlace.create({
        name: form.name.trim(),
        neighborhood: form.neighborhood.trim() || "NYC",
        borough: form.borough || "",
        category: "Classic NY Slice",
        address: form.address.trim() || locationQuery.trim(),
        price_range: "$",
        standard_slice_price: Number(form.standard_slice_price || 0),
        best_known_slice: form.best_known_slice.trim() || "",
        description: form.description.trim(),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        average_rating: 0,
        ratings_count: 0,
        featured: false,
        status: "active",
        cover_image_url: form.photo_url.trim(),
        hours: "",
        last_price_update: new Date().toISOString().slice(0, 10),
        submitted_by: user.email,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["places"] }),
        queryClient.invalidateQueries({ queryKey: ["places-for-panel"] }),
        queryClient.invalidateQueries({ queryKey: ["create-plan-places-v4"] }),
      ]);
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setForm(initialForm);
    setLocationQuery("");
    setSuggestions([]);
    setDone(false);
    setSubmitting(false);
    setPhotoName("");
    onClose();
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[2000] flex items-end justify-center bg-black/75 p-0 backdrop-blur-md sm:items-center sm:p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ type: "spring", damping: 30, stiffness: 280 }}
          className="max-h-[92vh] w-full overflow-y-auto rounded-t-[30px] border border-white/10 bg-[#111] shadow-2xl shadow-black/80 sm:max-w-xl sm:rounded-[30px]"
          onClick={(event) => event.stopPropagation()}
        >
          {done ? (
            <div className="p-8 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[24px] bg-emerald-500/15 text-emerald-300">
                <CheckCircle className="h-8 w-8" />
              </div>
              <h3 className="text-2xl font-black text-white">Spot published</h3>
              <p className="mt-3 text-sm leading-7 text-stone-400">The pin is now on the map with the slice price and the short note you added.</p>
              <Button onClick={handleClose} className="mt-6 h-11 w-full rounded-2xl bg-red-600 text-white hover:bg-red-500">Close</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-red-300">Add spot</div>
                  <h3 className="mt-1 text-2xl font-black text-white">Fast pin, real slice price</h3>
                  <p className="mt-1 text-sm text-stone-500">Keep it quick: location, name, price and a small extra if you have it.</p>
                </div>
                <button type="button" onClick={handleClose} className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-stone-300">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-5">
                <section className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-stone-500">1 · Find the place</div>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
                    <Input
                      value={locationQuery}
                      onChange={(event) => setLocationQuery(event.target.value)}
                      placeholder="Search street or pizza place"
                      className="h-11 border-white/10 bg-white/[0.04] pl-10 text-white"
                    />
                    {searching ? <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-red-400" /> : null}
                  </div>

                  {suggestions.length > 0 ? (
                    <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-[#171717]">
                      {suggestions.map((item) => (
                        <button
                          key={`${item.place_id}-${item.lat}-${item.lon}`}
                          type="button"
                          onClick={() => handleSelectSuggestion(item)}
                          className="flex w-full items-start gap-3 border-b border-white/8 px-3 py-3 text-left transition last:border-b-0 hover:bg-white/[0.04]"
                        >
                          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                          <div className="min-w-0">
                            <div className="line-clamp-1 text-sm font-semibold text-white">{item.display_name}</div>
                            <div className="mt-1 text-xs text-stone-500">Tap to use this address</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-3 text-sm text-stone-300">
                    {form.address || "Pick a suggestion to lock the address, then adjust the pin if needed."}
                  </div>

                  <div className="mt-4">
                    <MapPicker value={form} onChange={(coords) => setForm((current) => ({ ...current, ...coords }))} />
                  </div>
                </section>

                <section className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-stone-500">2 · Spot details</div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Spot name *</Label>
                      <Input required value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Joe's Pizza" className="h-11 border-white/10 bg-white/[0.04] text-white" />
                    </div>
                    <div>
                      <Label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Slice price *</Label>
                      <Input required type="number" min="0.5" step="0.01" value={form.standard_slice_price} onChange={(e) => update("standard_slice_price", e.target.value)} placeholder="3.50" className="h-11 border-white/10 bg-white/[0.04] text-white" />
                    </div>
                  </div>

                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Best known slice</Label>
                      <Input value={form.best_known_slice} onChange={(e) => update("best_known_slice", e.target.value)} placeholder="Vodka slice" className="h-11 border-white/10 bg-white/[0.04] text-white" />
                    </div>
                    <div>
                      <Label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500"><ImagePlus className="h-3.5 w-3.5" />Photo</Label>
                      <label className="flex h-11 cursor-pointer items-center justify-between rounded-2xl border border-dashed border-white/10 bg-white/[0.04] px-3 text-sm text-stone-300 transition hover:bg-white/[0.06]">
                        <span className="truncate">{photoName || "Choose from gallery"}</span>
                        <span className="shrink-0 rounded-full bg-white/10 px-2 py-1 text-[11px] font-bold text-white">Browse</span>
                        <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                      </label>
                      {form.photo_url ? (
                        <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                          <img src={form.photo_url} alt="Selected spot" className="h-28 w-full object-cover" />
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-4">
                    <Label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Quick note</Label>
                    <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} className="min-h-[96px] border-white/10 bg-white/[0.04] text-white" placeholder="Best value late at night, fast service, crispy base..." maxLength={160} />
                    <div className="mt-2 text-right text-[11px] font-medium text-stone-500">{form.description.length}/160</div>
                  </div>
                </section>
              </div>

              <div className="mt-6 flex gap-3">
                <Button type="button" variant="outline" onClick={handleClose} className="h-11 flex-1 rounded-2xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]">Cancel</Button>
                <Button type="submit" disabled={submitting} className="h-11 flex-1 rounded-2xl bg-red-600 text-white hover:bg-red-500">
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}Publish spot
                </Button>
              </div>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
