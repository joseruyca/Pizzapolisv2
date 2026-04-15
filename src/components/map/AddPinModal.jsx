import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, CheckCircle, Loader2, AlertTriangle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

const BOROUGHS = ["Manhattan", "Brooklyn", "Queens", "Bronx", "Staten Island"];
const CATEGORIES = [
  "Classic NY Slice", "Neapolitan", "Square/Sicilian",
  "Coal-Fired", "Wood-Fired", "Detroit Style",
  "Grandma Style", "Artisan", "Late Night"
];

const PRICE_OPTIONS = [
  { value: "$", label: "$ — Budget", color: "bg-green-500", desc: "Under $5/slice" },
  { value: "$$", label: "$$ — Mid-range", color: "bg-yellow-500", desc: "$5–12" },
  { value: "$$$", label: "$$$ — Premium", color: "bg-red-500", desc: "$15+" },
];

const MapPicker = ({ onLocationSelect, initialLat = 40.7128, initialLng = -74.006 }) => {
  const [position, setPosition] = useState([initialLat, initialLng]);
  const [address, setAddress] = useState("");
  const [searching, setSearching] = useState(false);

  const MapEvents = () => {
    useMapEvents({
      click: (e) => {
        setPosition([e.latlng.lat, e.latlng.lng]);
        onLocationSelect(e.latlng.lat, e.latlng.lng);
      }
    });
    return null;
  };

  const handleSearch = async (e) => {
    const query = e.target.value;
    setAddress(query);
    if (query.length < 3) return;

    setSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}, NYC&format=json&limit=5`
      );
      const results = await response.json();
      if (results.length > 0) {
        const first = results[0];
        const newPos = [parseFloat(first.lat), parseFloat(first.lon)];
        setPosition(newPos);
        onLocationSelect(newPos[0], newPos[1]);
      }
    } catch (e) {
      console.error(e);
    }
    setSearching(false);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
        <Input
          placeholder="Search address in NYC..."
          value={address}
          onChange={handleSearch}
          className="pl-10 bg-white/[0.04] border-white/8 text-stone-100"
        />
        {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-red-500" />}
      </div>
      <div className="h-64 rounded-xl overflow-hidden border border-white/8">
        <MapContainer center={position} zoom={13} className="w-full h-full">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap'
          />
          <Marker position={position} icon={L.icon({ iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png', iconSize: [25, 41] })} />
          <MapEvents />
        </MapContainer>
      </div>
      <p className="text-xs text-stone-500">Click on the map or search an address to set the location</p>
    </div>
  );
};

export default function AddPinModal({ open, onClose, user }) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "", neighborhood: "", borough: "", category: "",
    address: "", price_range: "", description: "",
    latitude: 40.7128, longitude: -74.006,
  });

  const update = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    await base44.entities.PizzaPlace.create({
      ...form,
      status: "pending",
    });
    setSubmitting(false);
    setStep(2);
  };

  const handleClose = () => {
    setStep(1);
    setForm({ name: "", neighborhood: "", borough: "", category: "", address: "", price_range: "", description: "" });
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 80 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 80 }}
          transition={{ type: "spring", damping: 28, stiffness: 280 }}
          className="bg-[#111] border border-white/8 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto shadow-2xl shadow-black/80"
          onClick={e => e.stopPropagation()}
        >
          {step === 2 ? (
            <div className="p-10 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
                className="w-16 h-16 bg-green-500/15 border border-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-5"
              >
                <CheckCircle className="w-8 h-8 text-green-400" />
              </motion.div>
              <h3 className="text-xl font-bold mb-2">Spot submitted!</h3>
              <p className="text-stone-500 text-sm mb-7 leading-relaxed max-w-xs mx-auto">
                Your suggestion is under review. If it passes our quality check, it'll appear on the map. Thanks for contributing!
              </p>
              <Button onClick={handleClose} className="bg-red-600 hover:bg-red-500 text-white w-full h-11 rounded-xl font-semibold">
                Close
              </Button>
            </div>
          ) : (
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold tracking-tight">Add a spot</h3>
                  <p className="text-stone-600 text-sm mt-0.5">Reviewed before going live</p>
                </div>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 flex items-center justify-center rounded-xl text-stone-600 hover:text-white hover:bg-white/5 transition-all mt-0.5"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name */}
                <div>
                  <Label className="text-stone-500 text-xs font-semibold uppercase tracking-wider mb-2 block">Place name *</Label>
                  <Input
                    required
                    value={form.name}
                    onChange={e => update("name", e.target.value)}
                    placeholder="e.g. Joe's Pizza"
                    className="bg-white/[0.04] border-white/8 text-stone-100 placeholder:text-stone-700 h-11 focus:border-red-500/40 transition-colors"
                  />
                </div>

                {/* Neighborhood + Borough */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-stone-500 text-xs font-semibold uppercase tracking-wider mb-2 block">Neighborhood</Label>
                    <Input
                      value={form.neighborhood}
                      onChange={e => update("neighborhood", e.target.value)}
                      placeholder="e.g. West Village"
                      className="bg-white/[0.04] border-white/8 text-stone-100 placeholder:text-stone-700 h-11 focus:border-red-500/40 transition-colors"
                    />
                  </div>
                  <div>
                    <Label className="text-stone-500 text-xs font-semibold uppercase tracking-wider mb-2 block">Borough *</Label>
                    <Select value={form.borough} onValueChange={v => update("borough", v)}>
                      <SelectTrigger className="bg-white/[0.04] border-white/8 text-stone-200 h-11 focus:border-red-500/40">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1c1c1c] border-white/10">
                        {BOROUGHS.map(b => <SelectItem key={b} value={b} className="focus:bg-white/10">{b}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Style + Price */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-stone-500 text-xs font-semibold uppercase tracking-wider mb-2 block">Style</Label>
                    <Select value={form.category} onValueChange={v => update("category", v)}>
                      <SelectTrigger className="bg-white/[0.04] border-white/8 text-stone-200 h-11">
                        <SelectValue placeholder="Pizza style" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1c1c1c] border-white/10">
                        {CATEGORIES.map(c => <SelectItem key={c} value={c} className="focus:bg-white/10">{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-stone-500 text-xs font-semibold uppercase tracking-wider mb-2 block">Price range</Label>
                    <Select value={form.price_range} onValueChange={v => update("price_range", v)}>
                      <SelectTrigger className="bg-white/[0.04] border-white/8 text-stone-200 h-11">
                        <SelectValue placeholder="Price" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1c1c1c] border-white/10">
                        {PRICE_OPTIONS.map(p => (
                          <SelectItem key={p.value} value={p.value} className="focus:bg-white/10">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${p.color}`} />
                              {p.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Location with Map */}
                <div>
                  <Label className="text-stone-500 text-xs font-semibold uppercase tracking-wider mb-2 block">Location *</Label>
                  <MapPicker 
                    onLocationSelect={(lat, lng) => {
                      update("latitude", lat);
                      update("longitude", lng);
                    }}
                  />
                </div>

                {/* Address */}
                <div>
                  <Label className="text-stone-500 text-xs font-semibold uppercase tracking-wider mb-2 block">Street Address</Label>
                  <Input
                    value={form.address}
                    onChange={e => update("address", e.target.value)}
                    placeholder="Optional: Full street address"
                    className="bg-white/[0.04] border-white/8 text-stone-100 placeholder:text-stone-700 h-11 focus:border-red-500/40 transition-colors"
                  />
                </div>

                {/* Description */}
                <div>
                  <Label className="text-stone-500 text-xs font-semibold uppercase tracking-wider mb-2 block">Why does it deserve a spot?</Label>
                  <Textarea
                    value={form.description}
                    onChange={e => update("description", e.target.value)}
                    placeholder="Tell us what makes this place special..."
                    className="bg-white/[0.04] border-white/8 text-stone-100 placeholder:text-stone-700 resize-none min-h-[80px] focus:border-red-500/40 transition-colors"
                  />
                </div>

                {/* Quality notice */}
                <div className="flex items-start gap-3 bg-amber-500/8 border border-amber-500/15 rounded-xl p-3.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500/70 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-400/70 leading-relaxed">
                    Your pin will go through editorial review before appearing on the map. Irrelevant or spam submissions will be rejected.
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={!form.name || !form.borough || submitting}
                  className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-semibold h-11 rounded-xl gap-2 transition-all"
                >
                  {submitting
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                    : <><MapPin className="w-4 h-4" /> Submit for review</>
                  }
                </Button>
              </form>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}