import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import PizzaMap from "@/components/map/PizzaMap";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import {
  formatHangoutDate,
  formatPrice,
  getValueLabel,
  getValueTone,
} from "@/lib/place-helpers";

const vibes = ["Quick bite", "Budget run", "Slice crawl", "Late night", "Chill group", "Premium try", "New people"];
const sizeOptions = [2, 4, 6, 8, 10];
const dayPresets = [
  { key: "today", label: "Today", offset: 0 },
  { key: "tomorrow", label: "Tomorrow", offset: 1 },
  { key: "weekend", label: "Weekend", offset: 2 },
];
const timePresets = ["18:30", "20:00", "21:30"];
const MAP_STYLE = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";

function buildDateTime(dayOffset = 0, time = "20:00") {
  const [hour, minute] = time.split(":").map(Number);
  const d = new Date();
  d.setDate(d.getDate() + dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString().slice(0, 16);
}

function getDayKey(dateTime) {
  if (!dateTime) return "today";
  const target = new Date(dateTime);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const weekend = new Date();
  weekend.setDate(today.getDate() + 2);
  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  if (sameDay(target, today)) return "today";
  if (sameDay(target, tomorrow)) return "tomorrow";
  if (sameDay(target, weekend)) return "weekend";
  return "today";
}

function getTimeValue(dateTime) {
  if (!dateTime) return "20:00";
  const d = new Date(dateTime);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function buildSuggestedTitle(place, vibe) {
  if (!place) return "Pizza plan";
  const base = vibe === "Budget run"
    ? `${place.name} budget run`
    : vibe === "Slice crawl"
      ? `${place.name} slice crawl`
      : vibe === "Late night"
        ? `${place.name} late-night plan`
        : `${place.name} hangout`;
  return base;
}

export default function CrearQuedada() {
  const { user } = useAuth();
  const [done, setDone] = useState(false);
  const [createdId, setCreatedId] = useState(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlPlaceId = searchParams.get("place");

  const [search, setSearch] = useState("");
  const [selectedDay, setSelectedDay] = useState("today");
  const [selectedTime, setSelectedTime] = useState("20:00");
  const [form, setForm] = useState({
    pizzeria_id: "",
    titulo: "",
    fecha_hora: buildDateTime(0, "20:00"),
    max_participantes: 6,
    vibe: "Quick bite",
    descripcion: "One good slice, a relaxed vibe and space for new people to join.",
    publicar: true,
  });


  const { data: places = [] } = useQuery({
    queryKey: ["create-plan-places-v4"],
    queryFn: () => base44.entities.PizzaPlace.list("standard_slice_price", 100),
  });

  useEffect(() => {
    const day = dayPresets.find((item) => item.key === selectedDay)?.offset ?? 0;
    setForm((prev) => ({ ...prev, fecha_hora: buildDateTime(day, selectedTime) }));
  }, [selectedDay, selectedTime]);

  const filteredPlaces = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return places;
    return places.filter((place) => {
      const haystack = `${place.name} ${place.neighborhood} ${place.borough} ${place.address}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [places, search]);

  const selectedPlace = useMemo(() => {
    return places.find((item) => item.id === form.pizzeria_id)
      || places.find((item) => item.id === urlPlaceId)
      || filteredPlaces[0]
      || places[0]
      || null;
  }, [places, filteredPlaces, form.pizzeria_id, urlPlaceId]);

  useEffect(() => {
    if (!places.length || form.pizzeria_id) return;
    const place = places.find((item) => item.id === urlPlaceId) || places[0];
    if (!place) return;
    setForm((prev) => ({
      ...prev,
      pizzeria_id: place.id,
      titulo: prev.titulo || buildSuggestedTitle(place, prev.vibe),
    }));
  }, [places, form.pizzeria_id, urlPlaceId]);

  useEffect(() => {
    if (!selectedPlace) return;
    setForm((prev) => ({
      ...prev,
      pizzeria_id: selectedPlace.id,
      titulo: prev.titulo?.trim() ? prev.titulo : buildSuggestedTitle(selectedPlace, prev.vibe),
    }));
  }, [selectedPlace]);

  useEffect(() => {
    if (!selectedPlace) return;
    setForm((prev) => ({
      ...prev,
      titulo: buildSuggestedTitle(selectedPlace, prev.vibe),
    }));
  }, [form.vibe, selectedPlace?.id]);

  if (!user) return <div className="min-h-[calc(100vh-64px)] bg-[#070707]" />;

  const publishDisabled = !selectedPlace || !form.titulo.trim();

  const submit = async (e) => {
    e?.preventDefault?.();
    if (publishDisabled) return;

    const created = await base44.entities.Quedada.create({
      creador_id: user.id,
      creador_nombre: user.full_name,
      titulo: form.titulo.trim(),
      pizzeria_id: selectedPlace.id,
      pizzeria_nombre: selectedPlace.name,
      fecha_hora: form.fecha_hora,
      max_participantes: Number(form.max_participantes),
      descripcion: form.descripcion.trim(),
      estado: form.publicar ? "activa" : "borrador",
      vibe: form.vibe,
      foto_url: selectedPlace.cover_image_url || "",
    });

    await base44.entities.Interes.create({
      quedada_id: created.id,
      usuario_id: user.email,
      tipo_interes: "like",
      created_date: new Date().toISOString(),
    });

    await base44.entities.Message.create({
      quedada_id: created.id,
      sender_id: user.email,
      receiver_id: "group",
      texto: `${user.full_name} created this plan at ${selectedPlace.name}.`,
      leido: true,
    });

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["discover-hangouts-v5", user.email] }),
      queryClient.invalidateQueries({ queryKey: ["my-groups-v6", user.email] }),
      queryClient.invalidateQueries({ queryKey: ["active-hangouts"] }),
      queryClient.invalidateQueries({ queryKey: ["place-hangouts", selectedPlace.id] }),
    ]);

    setCreatedId(created.id);
    setDone(true);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#050505] px-3 py-3 text-white sm:px-4">
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,#0d0d0d_0%,#070707_100%)] shadow-[0_24px_80px_rgba(0,0,0,0.45)] lg:grid lg:grid-cols-[1.05fr,0.95fr]">
        <div className="border-b border-white/8 p-4 lg:border-b-0 lg:border-r lg:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-red-300">Create plan</div>
              <h1 className="mt-1 text-2xl font-black tracking-tight">Pick a spot. Set the vibe.</h1>
            </div>
            <Button disabled={publishDisabled} onClick={submit} className="h-11 rounded-2xl bg-red-600 px-4 font-bold text-white hover:bg-red-500 disabled:opacity-50">
              Publish
            </Button>
          </div>

          {done ? (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[28px] border border-emerald-500/20 bg-emerald-500/10 p-7 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-emerald-500/20 text-emerald-300"><CheckCircle2 className="h-8 w-8" /></div>
              <div className="mt-5 text-2xl font-black">Plan published</div>
              <p className="mt-3 text-sm leading-7 text-stone-300">Your plan is live, you joined the group automatically and other users can now discover it.</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => navigate(`/MisMatches${createdId ? `?focus=${createdId}` : ""}`)} className="inline-flex h-12 items-center justify-center rounded-2xl bg-red-600 font-bold text-white">Go to my groups</button>
                <button type="button" onClick={() => navigate(`/Descubrir${createdId ? `?focus=${createdId}` : ""}`)} className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] font-bold text-stone-200">See in discover</button>
              </div>
            </motion.div>
          ) : (
            <>
              <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-black/25">
                <div className="absolute inset-x-0 top-0 z-[401] p-3">
                  <div className="flex items-center gap-2 rounded-[22px] border border-white/10 bg-black/70 p-2 backdrop-blur-md">
                    <div className="flex h-11 flex-1 items-center gap-2 rounded-[18px] bg-white/[0.05] px-3">
                      <Search className="h-4 w-4 text-stone-400" />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search spot or neighborhood"
                        className="w-full bg-transparent text-sm text-white outline-none placeholder:text-stone-500"
                      />
                    </div>
                    <div className="rounded-[18px] border border-white/10 bg-white/[0.05] px-3 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-300">
                      {filteredPlaces.length} spots
                    </div>
                  </div>
                </div>

                <div className="h-[260px] pt-[70px]">
                  <PizzaMap
                    places={filteredPlaces}
                    selectedPlace={selectedPlace}
                    onSelectPlace={(place) => setForm((prev) => ({ ...prev, pizzeria_id: place.id }))}
                    controlsHidden
                    mapStyleUrl={MAP_STYLE}
                  />
                </div>

                {selectedPlace ? (
                  <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[401]">
                    <div className="pointer-events-auto rounded-[24px] border border-white/10 bg-[#0c0c0c]/95 p-4 shadow-[0_16px_46px_rgba(0,0,0,0.5)] backdrop-blur-xl">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-lg font-black text-white">{selectedPlace.name}</div>
                          <div className="mt-1 flex items-center gap-2 text-sm text-stone-400">
                            <MapPin className="h-3.5 w-3.5" />
                            <span className="truncate">{selectedPlace.neighborhood}</span>
                          </div>
                        </div>
                        <div className="rounded-full bg-white px-3 py-1 text-sm font-black text-black">{formatPrice(selectedPlace.standard_slice_price)}</div>
                      </div>
                      <div className="mt-3 flex items-center gap-2 overflow-x-auto">
                        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${getValueTone(selectedPlace)}`}>{getValueLabel(selectedPlace)}</span>
                        <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-stone-300">{selectedPlace.best_known_slice || "Cheese slice"}</span>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="mt-4 grid gap-3">
                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div>
                      <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500"><CalendarDays className="h-3.5 w-3.5" />Day</div>
                      <div className="flex flex-wrap gap-2">
                        {dayPresets.map((day) => (
                          <button key={day.key} type="button" onClick={() => setSelectedDay(day.key)} className={`rounded-full px-3 py-2 text-xs font-semibold ${selectedDay === day.key ? "bg-red-600 text-white" : "border border-white/10 bg-white/[0.04] text-stone-300"}`}>{day.label}</button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500"><Clock3 className="h-3.5 w-3.5" />Time</div>
                      <div className="flex flex-wrap gap-2">
                        {timePresets.map((time) => (
                          <button key={time} type="button" onClick={() => setSelectedTime(time)} className={`rounded-full px-3 py-2 text-xs font-semibold ${selectedTime === time ? "bg-red-600 text-white" : "border border-white/10 bg-white/[0.04] text-stone-300"}`}>{time}</button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500"><Users className="h-3.5 w-3.5" />Group size</div>
                      <div className="flex flex-wrap gap-2">
                        {sizeOptions.map((size) => (
                          <button key={size} type="button" onClick={() => setForm((prev) => ({ ...prev, max_participantes: size }))} className={`rounded-full px-3 py-2 text-xs font-semibold ${Number(form.max_participantes) === size ? "bg-red-600 text-white" : "border border-white/10 bg-white/[0.04] text-stone-300"}`}>{size}</button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500"><Sparkles className="h-3.5 w-3.5" />Vibe</div>
                      <div className="flex flex-wrap gap-2">
                        {vibes.slice(0, 4).map((vibe) => (
                          <button key={vibe} type="button" onClick={() => setForm((prev) => ({ ...prev, vibe }))} className={`rounded-full px-3 py-2 text-xs font-semibold ${form.vibe === vibe ? "bg-red-600 text-white" : "border border-white/10 bg-white/[0.04] text-stone-300"}`}>{vibe}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">Short note</div>
                  <Textarea
                    value={form.descripcion}
                    onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))}
                    className="min-h-[88px] rounded-[20px] border-white/10 bg-black/25 text-white placeholder:text-stone-500"
                    placeholder="One or two slices, relaxed vibe, easy plan."
                  />
                </div>
              </div>
            </>
          )}
        </div>

        <div className="p-4 lg:p-5">
          <div className="inline-flex items-center rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-red-300">
            <Sparkles className="mr-2 h-3.5 w-3.5" />Preview
          </div>
          {selectedPlace ? (
            <div className="mt-4 overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(239,68,68,0.18),transparent_34%),linear-gradient(180deg,#161616_0%,#090909_100%)] p-4 shadow-[0_26px_70px_rgba(0,0,0,0.45)]">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-violet-500/20 px-3 py-1 text-[11px] font-bold text-violet-200">{formatHangoutDate(form.fecha_hora)}</span>
                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-bold text-emerald-200">{form.max_participantes} spots max</span>
              </div>
              <div className="mt-4 rounded-[24px] border border-white/10 bg-black/30 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="inline-flex rounded-full bg-white/[0.08] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-200">{form.vibe}</div>
                  <div className="rounded-full bg-white px-3 py-1 text-sm font-black text-black">{formatPrice(selectedPlace.standard_slice_price)}</div>
                </div>
                <h2 className="mt-4 text-3xl font-black leading-none tracking-tight text-white">{form.titulo || buildSuggestedTitle(selectedPlace, form.vibe)}</h2>
                <div className="mt-3 flex items-center gap-2 text-sm text-stone-300"><MapPin className="h-4 w-4 text-red-300" />{selectedPlace.name} · {selectedPlace.neighborhood}</div>
                <p className="mt-4 text-sm leading-7 text-stone-200">{form.descripcion || "Easy pizza plan with a clear spot and a good reason to join."}</p>
                <div className="mt-4 flex items-center justify-between rounded-[20px] border border-white/10 bg-black/25 px-4 py-3">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-stone-500">Created by</div>
                    <div className="mt-1 text-sm font-semibold text-white">{user.full_name}</div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-stone-300"><Users className="h-4 w-4" />{form.max_participantes} going max</div>
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <Button disabled={publishDisabled} onClick={submit} className="h-12 flex-1 rounded-2xl bg-red-600 font-bold text-white hover:bg-red-500 disabled:opacity-50">
                  Publish plan <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
