import React, { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import { CheckCircle, Loader2, MapPin, Search, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const BOROUGHS = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"];
const CATEGORIES = [
  "Classic NY Slice",
  "Neapolitan",
  "Square/Sicilian",
  "Detroit Style",
  "Grandma Style",
  "Late Night",
  "Artisan",
];

const markerIcon = L.icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function MapPicker({ value, onChange }) {
  const [address, setAddress] = useState("");
  const [searching, setSearching] = useState(false);
  const position = useMemo(() => [value.latitude, value.longitude], [value.latitude, value.longitude]);

  function MapEvents() {
    useMapEvents({
      click: (event) => onChange({ latitude: event.latlng.lat, longitude: event.latlng.lng }),
    });
    return null;
  }

  async function handleSearch(nextValue) {
    setAddress(nextValue);
    if (nextValue.trim().length < 3) return;
    setSearching(true);
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(`${nextValue}, New York City`)}&format=json&limit=1`);
      const [first] = await response.json();
      if (first) onChange({ latitude: Number(first.lat), longitude: Number(first.lon) });
    } catch (error) {
      console.error(error);
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
        <Input
          value={address}
          onChange={(event) => handleSearch(event.target.value)}
          placeholder="Buscar dirección en NYC"
          className="h-11 border-white/10 bg-white/[0.04] pl-10 text-white"
        />
        {searching ? <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-red-400" /> : null}
      </div>

      <div className="h-60 overflow-hidden rounded-2xl border border-white/10">
        <MapContainer center={position} zoom={13} className="h-full w-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="" />
          <Marker position={position} icon={markerIcon} />
          <MapEvents />
        </MapContainer>
      </div>
      <p className="text-xs text-stone-500">Pulsa en el mapa o busca una dirección para fijar el spot.</p>
    </div>
  );
}

const initialForm = {
  name: "",
  neighborhood: "",
  borough: "",
  category: "Classic NY Slice",
  address: "",
  price_range: "$",
  standard_slice_price: "3.50",
  best_known_slice: "Cheese slice",
  description: "",
  latitude: 40.7128,
  longitude: -74.006,
};

export default function AddPinModal({ open, onClose, user }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (!open) return null;

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  async function handleSubmit(event) {
    event.preventDefault();
    if (!user || submitting) return;
    setSubmitting(true);
    try {
      await base44.entities.PizzaPlace.create({
        name: form.name.trim(),
        neighborhood: form.neighborhood.trim(),
        borough: form.borough,
        category: form.category,
        address: form.address.trim(),
        price_range: form.price_range,
        standard_slice_price: Number(form.standard_slice_price || 0),
        best_known_slice: form.best_known_slice.trim() || "Cheese slice",
        description: form.description.trim(),
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        average_rating: 0,
        ratings_count: 0,
        featured: false,
        status: "active",
        cover_image_url: "",
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
    setDone(false);
    setSubmitting(false);
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
              <h3 className="text-2xl font-black text-white">Spot publicado</h3>
              <p className="mt-3 text-sm leading-7 text-stone-400">Ya se ha añadido al mapa con el precio del slice y aparecerá en comparar spots.</p>
              <Button onClick={handleClose} className="mt-6 h-11 w-full rounded-2xl bg-red-600 text-white hover:bg-red-500">Cerrar</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-red-300">Mapa colaborativo</div>
                  <h3 className="mt-1 text-2xl font-black text-white">Añadir spot</h3>
                  <p className="mt-1 text-sm text-stone-500">Sube un pin con precio real del slice para que otros puedan verlo en el mapa.</p>
                </div>
                <button type="button" onClick={handleClose} className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-stone-300">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Nombre del sitio *</Label>
                    <Input required value={form.name} onChange={(e) => update("name", e.target.value)} className="h-11 border-white/10 bg-white/[0.04] text-white" />
                  </div>
                  <div>
                    <Label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Barrio *</Label>
                    <Input required value={form.neighborhood} onChange={(e) => update("neighborhood", e.target.value)} className="h-11 border-white/10 bg-white/[0.04] text-white" />
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Borough *</Label>
                    <Select value={form.borough} onValueChange={(value) => update("borough", value)}>
                      <SelectTrigger className="h-11 border-white/10 bg-white/[0.04] text-white"><SelectValue placeholder="Selecciona" /></SelectTrigger>
                      <SelectContent className="border-white/10 bg-[#1a1a1a] text-white">
                        {BOROUGHS.map((borough) => <SelectItem key={borough} value={borough}>{borough}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Categoría</Label>
                    <Select value={form.category} onValueChange={(value) => update("category", value)}>
                      <SelectTrigger className="h-11 border-white/10 bg-white/[0.04] text-white"><SelectValue /></SelectTrigger>
                      <SelectContent className="border-white/10 bg-[#1a1a1a] text-white">
                        {CATEGORIES.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Precio del slice *</Label>
                    <Input required type="number" min="0.5" step="0.01" value={form.standard_slice_price} onChange={(e) => update("standard_slice_price", e.target.value)} className="h-11 border-white/10 bg-white/[0.04] text-white" />
                  </div>
                  <div>
                    <Label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Rango de precio</Label>
                    <Select value={form.price_range} onValueChange={(value) => update("price_range", value)}>
                      <SelectTrigger className="h-11 border-white/10 bg-white/[0.04] text-white"><SelectValue /></SelectTrigger>
                      <SelectContent className="border-white/10 bg-[#1a1a1a] text-white">
                        <SelectItem value="$">$ · Budget</SelectItem>
                        <SelectItem value="$$">$$ · Mid-range</SelectItem>
                        <SelectItem value="$$$">$$$ · Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Mejor slice conocido</Label>
                  <Input value={form.best_known_slice} onChange={(e) => update("best_known_slice", e.target.value)} className="h-11 border-white/10 bg-white/[0.04] text-white" />
                </div>

                <div>
                  <Label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Dirección</Label>
                  <Input value={form.address} onChange={(e) => update("address", e.target.value)} className="h-11 border-white/10 bg-white/[0.04] text-white" />
                </div>

                <div>
                  <Label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Comentario rápido</Label>
                  <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} className="min-h-[96px] border-white/10 bg-white/[0.04] text-white" placeholder="Qué merece la pena, si compensa por precio, ambiente, cola..." />
                </div>

                <div>
                  <Label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Ubicación</Label>
                  <MapPicker value={form} onChange={(coords) => setForm((current) => ({ ...current, ...coords }))} />
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Button type="button" variant="outline" onClick={handleClose} className="h-11 flex-1 rounded-2xl border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]">Cancelar</Button>
                <Button type="submit" disabled={submitting} className="h-11 flex-1 rounded-2xl bg-red-600 text-white hover:bg-red-500">
                  {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}Publicar spot
                </Button>
              </div>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
