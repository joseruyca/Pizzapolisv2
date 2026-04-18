import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Search,
  Users,
} from "lucide-react";
import { formatPrice } from "@/lib/place-helpers";

const sizeOptions = [2, 4, 6, 8, 10];

function toLocalDateInput(value) {
  const date = value ? new Date(value) : new Date();
  return date.toISOString().slice(0, 10);
}

function toLocalTimeInput(value) {
  const date = value ? new Date(value) : new Date();
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function combineDateTime(date, time) {
  if (!date) return "";
  return `${date}T${time || "20:00"}`;
}

function defaultTitle(place, date, time) {
  if (!place) return "Pizza plan";
  const hourLabel = time || "20:00";
  return `${place.name} · ${hourLabel}`;
}

function PlaceOption({ place, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-[22px] border px-4 py-4 text-left transition ${active ? "border-red-500/50 bg-red-500/10" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.05]"}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-base font-bold text-white">{place.name}</div>
          <div className="mt-1 truncate text-sm text-stone-400">{place.neighborhood || place.address || "NYC"}</div>
        </div>
        <div className="shrink-0 rounded-full bg-[#efbf3a] px-3 py-1 text-xs font-black text-[#141414]">
          {formatPrice(place.standard_slice_price || 0)}
        </div>
      </div>
      {place.best_known_slice ? <div className="mt-3 text-sm text-stone-300">Best slice: {place.best_known_slice}</div> : null}
    </button>
  );
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
  const [date, setDate] = useState(() => toLocalDateInput(new Date()));
  const [time, setTime] = useState("20:00");
  const [form, setForm] = useState({
    pizzeria_id: "",
    titulo: "",
    fecha_hora: combineDateTime(toLocalDateInput(new Date()), "20:00"),
    max_participantes: 4,
    descripcion: "",
    publicar: true,
  });

  const { data: places = [] } = useQuery({
    queryKey: ["create-plan-places-v4"],
    queryFn: () => base44.entities.PizzaPlace.list("standard_slice_price", 150),
  });

  useEffect(() => {
    setForm((prev) => ({ ...prev, fecha_hora: combineDateTime(date, time) }));
  }, [date, time]);

  const filteredPlaces = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return places.slice(0, 12);
    return places.filter((place) => {
      const haystack = `${place.name} ${place.neighborhood || ""} ${place.address || ""} ${place.best_known_slice || ""}`.toLowerCase();
      return haystack.includes(term);
    }).slice(0, 12);
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
      titulo: prev.titulo || defaultTitle(place, date, time),
    }));
  }, [places, form.pizzeria_id, urlPlaceId, date, time]);

  useEffect(() => {
    if (!selectedPlace) return;
    setForm((prev) => ({
      ...prev,
      pizzeria_id: selectedPlace.id,
      titulo: prev.titulo?.trim() ? prev.titulo : defaultTitle(selectedPlace, date, time),
    }));
  }, [selectedPlace, date, time]);

  if (!user) return <div className="min-h-[calc(100vh-64px)] bg-[#070707]" />;

  const publishDisabled = !selectedPlace || !date || !time || !form.titulo.trim();

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
      vibe: "Pizza plan",
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
      <div className="mx-auto max-w-6xl overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,#0d0d0d_0%,#070707_100%)] shadow-[0_24px_80px_rgba(0,0,0,0.45)] lg:grid lg:grid-cols-[1.08fr,0.92fr]">
        <div className="border-b border-white/8 p-4 lg:border-b-0 lg:border-r lg:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-red-300">Create plan</div>
              <h1 className="mt-1 text-2xl font-black tracking-tight">Make it feel instant</h1>
            </div>
            <Button disabled={publishDisabled} onClick={submit} className="h-11 rounded-2xl bg-red-600 px-4 font-bold text-white hover:bg-red-500 disabled:opacity-50">
              Publish
            </Button>
          </div>

          {done ? (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-[28px] border border-emerald-500/20 bg-emerald-500/10 p-7 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-emerald-500/20 text-emerald-300"><CheckCircle2 className="h-8 w-8" /></div>
              <div className="mt-5 text-2xl font-black">Plan published</div>
              <p className="mt-3 text-sm leading-7 text-stone-300">Your plan is live and you joined the group automatically.</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => navigate(`${createPageUrl("MisMatches")}${createdId ? `?focus=${createdId}` : ""}`)} className="inline-flex h-12 items-center justify-center rounded-2xl bg-red-600 font-bold text-white">Go to my groups</button>
                <button type="button" onClick={() => navigate(`${createPageUrl("Descubrir")}${createdId ? `?focus=${createdId}` : ""}`)} className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] font-bold text-stone-200">See in discover</button>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={submit} className="space-y-5">
              <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-stone-500">1 · Choose the spot</div>
                <div className="relative mb-4">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-500" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search pizza spot" className="h-11 border-white/10 bg-white/[0.04] pl-10 text-white" />
                </div>
                <div className="grid gap-3 max-h-[360px] overflow-y-auto pr-1">
                  {filteredPlaces.map((place) => (
                    <PlaceOption key={place.id} place={place} active={selectedPlace?.id === place.id} onClick={() => setForm((prev) => ({ ...prev, pizzeria_id: place.id, titulo: prev.titulo?.trim() ? prev.titulo : defaultTitle(place, date, time) }))} />
                  ))}
                </div>
              </section>

              <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-stone-500">2 · When</div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500"><CalendarDays className="h-3.5 w-3.5" />Date *</Label>
                    <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 border-white/10 bg-white/[0.04] text-white" />
                  </div>
                  <div>
                    <Label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500"><Clock3 className="h-3.5 w-3.5" />Time *</Label>
                    <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-11 border-white/10 bg-white/[0.04] text-white" />
                  </div>
                </div>
              </section>

              <section className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-stone-500">3 · Plan details</div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Title *</Label>
                    <Input value={form.titulo} onChange={(e) => setForm((prev) => ({ ...prev, titulo: e.target.value }))} placeholder="Joe's Pizza · 20:00" className="h-11 border-white/10 bg-white/[0.04] text-white" />
                  </div>
                  <div>
                    <Label className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-stone-500"><Users className="h-3.5 w-3.5" />Max people</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {sizeOptions.map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, max_participantes: option }))}
                          className={`h-11 rounded-2xl border text-sm font-black transition ${Number(form.max_participantes) === option ? "border-red-400 bg-red-500/15 text-white" : "border-white/10 bg-white/[0.04] text-stone-300"}`}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <Label className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">Quick note</Label>
                  <Textarea value={form.descripcion} onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))} className="min-h-[96px] border-white/10 bg-white/[0.04] text-white" placeholder="Casual slice stop, anyone welcome, easy plan after work..." />
                </div>
              </section>
            </form>
          )}
        </div>

        <aside className="p-4 lg:p-5">
          <div className="rounded-[30px] border border-white/10 bg-[#121212] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-red-300">Preview</div>
            <div className="mt-4 overflow-hidden rounded-[26px] border border-white/10 bg-[#171717]">
              <div className="relative h-52 border-b border-white/10 bg-black">
                {selectedPlace?.cover_image_url ? (
                  <img src={selectedPlace.cover_image_url} alt={selectedPlace.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-6xl">🍕</div>
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/70" />
                <div className="absolute left-4 bottom-4 rounded-full bg-[#efbf3a] px-3 py-1 text-xs font-black text-[#141414]">
                  {selectedPlace ? formatPrice(selectedPlace.standard_slice_price || 0) : "$0.00"}
                </div>
              </div>

              <div className="p-5">
                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-stone-500">{date || "Date"} · {time || "Time"}</div>
                <h2 className="mt-3 text-3xl font-black leading-none text-white">{form.titulo?.trim() || (selectedPlace ? defaultTitle(selectedPlace, date, time) : "Pizza plan")}</h2>
                <div className="mt-4 flex items-start gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  <div className="min-w-0">
                    <div className="truncate font-semibold text-white">{selectedPlace?.name || "Choose a place"}</div>
                    <div className="truncate text-sm text-stone-400">{selectedPlace?.neighborhood || selectedPlace?.address || "Pick the spot first"}</div>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
                    <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">People</div>
                    <div className="mt-1 text-xl font-black text-white">{form.max_participantes}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4">
                    <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">Best slice</div>
                    <div className="mt-1 truncate text-base font-black text-white">{selectedPlace?.best_known_slice || "Optional"}</div>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-7 text-stone-300">{form.descripcion?.trim() || "Short, simple plan. Pick the place, set the time and let people join fast."}</p>
                <button type="button" onClick={submit} disabled={publishDisabled} className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-red-600 font-bold text-white disabled:opacity-50">
                  Create plan
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
