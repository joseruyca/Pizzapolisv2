import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, CheckCircle2, MapPin, Sparkles, Users } from "lucide-react";
import { formatPrice, getValueLabel, getValueTone, formatHangoutDate } from "@/lib/place-helpers";

const vibes = ["Casual", "Budget", "Slice crawl", "Late night", "Nuevas caras", "Premium"];

function nextDateTime(days = 0, hour = 20, minute = 30) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString().slice(0, 16);
}

const quickPresets = [
  { label: "Hoy · 20:30", value: nextDateTime(0, 20, 30) },
  { label: "Mañana · 19:00", value: nextDateTime(1, 19, 0) },
  { label: "Vie · 22:00", value: nextDateTime(2, 22, 0) },
];

export default function CrearQuedada() {
  const [user, setUser] = useState(null);
  const [done, setDone] = useState(false);
  const [createdId, setCreatedId] = useState(null);
  const [form, setForm] = useState({
    pizzeria_id: "",
    titulo: "",
    fecha_hora: nextDateTime(0, 20, 30),
    max_participantes: 8,
    vibe: "Casual",
    descripcion: "Plan tranquilo para pillar slice, charlar y ver a dónde nos lleva la noche.",
    publicar: true,
  });
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => null);
  }, []);

  const { data: places = [] } = useQuery({
    queryKey: ["create-plan-places-v4"],
    queryFn: () => base44.entities.PizzaPlace.list("standard_slice_price", 100),
  });

  const urlPlaceId = searchParams.get("place");
  const selectedPlace = useMemo(() => places.find((item) => item.id === form.pizzeria_id) || places.find((item) => item.id === urlPlaceId) || places[0], [places, form.pizzeria_id, urlPlaceId]);

  useEffect(() => {
    if (!places.length) return;
    if (!form.pizzeria_id) {
      const place = places.find((item) => item.id === urlPlaceId) || places[0];
      setForm((prev) => ({
        ...prev,
        pizzeria_id: place.id,
        titulo: prev.titulo || `${place.name} ${prev.vibe === "Budget" ? "Budget Run" : "Hangout"}`,
      }));
    }
  }, [places, form.pizzeria_id, urlPlaceId]);

  useEffect(() => {
    if (!selectedPlace) return;
    setForm((prev) => {
      if (prev.titulo && prev.titulo.trim()) return prev;
      return { ...prev, titulo: `${selectedPlace.name} hangout` };
    });
  }, [selectedPlace]);

  if (!user) return <div className="min-h-[calc(100vh-64px)] bg-[#060606]" />;

  const submit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    if (!selectedPlace || !form.titulo.trim()) return;

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
      texto: `Plan created by ${user.full_name}. See you at ${selectedPlace.name}!`,
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
    <div className="min-h-[calc(100vh-64px)] bg-[#060606] px-4 py-4 text-white">
      <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[1.05fr,0.95fr]">
        <div className="rounded-[32px] border border-white/10 bg-[#101010] p-5 lg:p-6">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-red-300">Crear plan</div>
              <h1 className="mt-2 text-2xl font-black">Propon un hangout real</h1>
            </div>
            <Button onClick={submit} className="h-11 rounded-2xl bg-red-600 px-5 text-sm font-bold text-white hover:bg-red-500">Publicar</Button>
          </div>

          {done ? (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[28px] border border-emerald-500/20 bg-emerald-500/10 p-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-emerald-500/20 text-emerald-300"><CheckCircle2 className="h-8 w-8" /></div>
              <div className="mt-5 text-2xl font-black text-white">Plan publicado</div>
              <p className="mt-3 text-sm leading-7 text-stone-300">Ya te has unido automáticamente al grupo y el plan debería aparecer en Descubrir.</p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button type="button" onClick={() => navigate(`/MisMatches${createdId ? `?focus=${createdId}` : ""}`)} className="inline-flex h-12 items-center justify-center rounded-2xl bg-red-600 font-bold">Ir a Mis grupos</button>
                <button type="button" onClick={() => navigate(`/Descubrir${createdId ? `?focus=${createdId}` : ""}`)} className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] font-bold text-stone-200">Ver en Descubrir</button>
              </div>
            </motion.div>
          ) : (
            <form className="space-y-5" onSubmit={submit}>
              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-stone-300">Elige el spot</div>
                    <div className="mt-1 text-xs text-stone-500">Cuanto más claro sea el sitio, mejor funcionará el plan.</div>
                  </div>
                  <div className="rounded-full border border-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-stone-300">{places.length} spots</div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {places.slice(0, 8).map((place) => {
                    const active = selectedPlace?.id === place.id;
                    return (
                      <button key={place.id} type="button" onClick={() => setForm((prev) => ({ ...prev, pizzeria_id: place.id }))} className={`rounded-[24px] border p-4 text-left transition ${active ? "border-red-500/30 bg-red-500/10 shadow-[0_0_0_1px_rgba(239,68,68,0.12)]" : "border-white/10 bg-black/20 hover:bg-white/[0.04]"}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate font-bold text-white">{place.name}</div>
                            <div className="mt-1 flex items-center gap-1 text-sm text-stone-400"><MapPin className="h-3.5 w-3.5" />{place.neighborhood}</div>
                          </div>
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${getValueTone(place)}`}>{getValueLabel(place)}</span>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-sm text-stone-300">
                          <span>{formatPrice(place.standard_slice_price)}</span>
                          <span className="truncate text-stone-500">{place.best_known_slice}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-sm font-semibold text-stone-300">Fecha y hora</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {quickPresets.map((preset) => (
                      <button key={preset.label} type="button" onClick={() => setForm((prev) => ({ ...prev, fecha_hora: preset.value }))} className={`rounded-full px-3 py-2 text-xs font-semibold ${form.fecha_hora === preset.value ? "bg-red-600 text-white" : "border border-white/10 bg-white/[0.04] text-stone-300"}`}>{preset.label}</button>
                    ))}
                  </div>
                  <Input type="datetime-local" value={form.fecha_hora} onChange={(e) => setForm((prev) => ({ ...prev, fecha_hora: e.target.value }))} className="mt-4 h-12 rounded-2xl border-white/10 bg-black/20 text-white" />
                </div>

                <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <div className="text-sm font-semibold text-stone-300">Plazas</div>
                      <Input type="number" min="2" max="12" value={form.max_participantes} onChange={(e) => setForm((prev) => ({ ...prev, max_participantes: e.target.value }))} className="mt-3 h-12 rounded-2xl border-white/10 bg-black/20 text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-stone-300">Vibe</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {vibes.map((vibe) => (
                          <button key={vibe} type="button" onClick={() => setForm((prev) => ({ ...prev, vibe }))} className={`rounded-full px-3 py-2 text-xs font-semibold ${form.vibe === vibe ? "bg-red-600 text-white" : "border border-white/10 bg-white/[0.04] text-stone-300"}`}>{vibe}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/[0.03] p-4">
                <div className="text-sm font-semibold text-stone-300">Título del plan</div>
                <Input value={form.titulo} onChange={(e) => setForm((prev) => ({ ...prev, titulo: e.target.value }))} className="mt-3 h-12 rounded-2xl border-white/10 bg-black/20 text-white" />
                <div className="mt-4 text-sm font-semibold text-stone-300">Descripción</div>
                <Textarea value={form.descripcion} onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))} className="mt-3 min-h-[120px] rounded-2xl border-white/10 bg-black/20 text-white" />
              </div>
            </form>
          )}
        </div>

        <div className="rounded-[32px] border border-white/10 bg-[#101010] p-5 lg:p-6">
          <div className="inline-flex items-center rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-red-300">
            <Sparkles className="mr-2 h-3.5 w-3.5" />Vista previa
          </div>
          {selectedPlace ? (
            <div className="mt-5 overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(220,38,38,0.24),transparent_32%),linear-gradient(180deg,#171717_0%,#0b0b0b_100%)] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-violet-500/20 px-3 py-1 text-[11px] font-bold text-violet-200">{formatHangoutDate(form.fecha_hora)}</span>
                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-bold text-emerald-200">{form.max_participantes} plazas</span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-stone-200">{form.vibe}</span>
              </div>

              <div className="mt-5 rounded-[28px] border border-white/10 bg-black/30 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div className="inline-flex rounded-full bg-red-500/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-red-300">{form.vibe}</div>
                  <div className="rounded-full bg-white px-3 py-1 text-sm font-black text-black">{formatPrice(selectedPlace.standard_slice_price)}</div>
                </div>
                <h2 className="mt-5 text-4xl font-black leading-none tracking-tight text-white">{form.titulo || "Pizza hangout"}</h2>
                <div className="mt-3 flex items-center gap-2 text-sm text-stone-300">
                  <MapPin className="h-4 w-4 text-red-300" />{selectedPlace.name} · {selectedPlace.neighborhood}
                </div>
                <p className="mt-4 text-base leading-8 text-stone-200">{form.descripcion || "Plan simple para compartir un buen slice y conocer gente nueva."}</p>
                <div className="mt-6 flex items-center justify-between gap-3 rounded-[22px] border border-white/10 bg-black/25 px-4 py-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.14em] text-stone-500">Creado por</div>
                    <div className="mt-1 text-sm font-semibold text-white">{user.full_name}</div>
                  </div>
                  <div className="flex items-center gap-2 text-stone-300"><Users className="h-4 w-4" />{form.max_participantes} going max</div>
                </div>
              </div>

              <div className="mt-5 rounded-[24px] border border-white/8 bg-white/[0.03] p-4 text-sm text-stone-300">
                <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">Why this works</div>
                <div className="mt-2 leading-7">The best plans are easy to understand: one clear spot, one time, one vibe and a slice price people can judge fast.</div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
