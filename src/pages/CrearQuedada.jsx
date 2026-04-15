import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, ChevronRight, Sparkles } from "lucide-react";
import { formatPrice, getValueLabel, getValueTone } from "@/lib/place-helpers";

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

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => null);
  }, []);

  const { data: places = [] } = useQuery({
    queryKey: ["create-plan-places-v3"],
    queryFn: () => base44.entities.PizzaPlace.list("standard_slice_price", 100),
  });

  const selectedPlace = useMemo(() => places.find((item) => item.id === form.pizzeria_id) || places[0], [places, form.pizzeria_id]);

  useEffect(() => {
    if (!form.pizzeria_id && places[0]) {
      setForm((prev) => ({
        ...prev,
        pizzeria_id: places[0].id,
        titulo: `NYC ${prev.vibe === "Budget" ? "Cheap Slice Run" : "Pizza Hangout"}`,
      }));
    }
  }, [places, form.pizzeria_id]);

  useEffect(() => {
    if (!selectedPlace) return;
    setForm((prev) => ({
      ...prev,
      titulo: prev.titulo || `${selectedPlace.name} hangout`,
    }));
  }, [selectedPlace]);

  if (!user) return <div className="min-h-[calc(100vh-64px)] bg-[#060606]" />;

  const submit = async (e) => {
    e.preventDefault();
    if (!selectedPlace) return;
    await base44.entities.Quedada.create({
      creador_id: user.id,
      creador_nombre: user.full_name,
      titulo: form.titulo,
      pizzeria_id: selectedPlace.id,
      pizzeria_nombre: selectedPlace.name,
      fecha_hora: form.fecha_hora,
      max_participantes: Number(form.max_participantes),
      descripcion: form.descripcion,
      estado: "activa",
      vibe: form.vibe,
      foto_url: selectedPlace.cover_image_url || "",
    });
    queryClient.invalidateQueries();
    setDone(true);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#060606] px-4 py-4">
      <div className="mx-auto max-w-6xl grid gap-4 lg:grid-cols-[1.06fr,0.94fr]">
        <div className="rounded-[30px] border border-white/10 bg-[#101010] p-5 lg:p-6">
          <div className="mb-6 flex items-center justify-between">
            <button className="text-sm font-medium text-stone-400">Cancelar</button>
            <h1 className="text-xl font-black">Crear plan</h1>
            <Button onClick={submit} className="h-10 rounded-2xl bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-500">Publicar</Button>
          </div>

          {done ? (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="rounded-[28px] border border-emerald-500/20 bg-emerald-500/10 p-8 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-emerald-500/20 text-emerald-300"><CheckCircle2 className="h-8 w-8" /></div>
              <div className="mt-5 text-2xl font-black text-white">Plan publicado</div>
              <p className="mt-3 text-sm leading-7 text-stone-300">Ya debería aparecer en Descubrir para que la gente deslice sí o no.</p>
            </motion.div>
          ) : (
            <form className="space-y-5" onSubmit={submit}>
              <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-stone-300">Spot</div>
                  <button type="button" className="text-sm text-stone-400">Cambiar spot</button>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {places.slice(0, 6).map((place) => {
                    const active = selectedPlace?.id === place.id;
                    return (
                      <button key={place.id} type="button" onClick={() => setForm((prev) => ({ ...prev, pizzeria_id: place.id }))} className={`rounded-[22px] border p-4 text-left transition ${active ? "border-red-500/30 bg-red-500/10" : "border-white/10 bg-black/20 hover:bg-white/[0.04]"}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="font-bold text-white">{place.name}</div>
                            <div className="mt-1 text-sm text-stone-400">{place.neighborhood}</div>
                          </div>
                          <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${getValueTone(place)}`}>{getValueLabel(place)}</span>
                        </div>
                        <div className="mt-3 text-sm text-stone-300">{formatPrice(place.standard_slice_price)} · {place.best_known_slice}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4">
                <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-sm font-semibold text-stone-300">Fecha y hora</div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {quickPresets.map((preset) => (
                      <button key={preset.label} type="button" onClick={() => setForm((prev) => ({ ...prev, fecha_hora: preset.value }))} className={`rounded-full px-3 py-2 text-xs font-semibold ${form.fecha_hora === preset.value ? "bg-red-600 text-white" : "border border-white/10 bg-white/[0.04] text-stone-300"}`}>{preset.label}</button>
                    ))}
                  </div>
                  <Input type="datetime-local" value={form.fecha_hora} onChange={(e) => setForm((prev) => ({ ...prev, fecha_hora: e.target.value }))} className="mt-4 h-12 rounded-2xl border-white/10 bg-black/20 text-white" />
                </div>

                <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-4">
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

                <div className="rounded-[26px] border border-white/10 bg-white/[0.03] p-4">
                  <div className="text-sm font-semibold text-stone-300">Título</div>
                  <Input value={form.titulo} onChange={(e) => setForm((prev) => ({ ...prev, titulo: e.target.value }))} className="mt-3 h-12 rounded-2xl border-white/10 bg-black/20 text-white" />
                  <div className="mt-4 text-sm font-semibold text-stone-300">Descripción (opcional)</div>
                  <Textarea value={form.descripcion} onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))} className="mt-3 min-h-[120px] rounded-2xl border-white/10 bg-black/20 text-white" />
                </div>
              </div>
            </form>
          )}
        </div>

        <div className="rounded-[30px] border border-white/10 bg-[#101010] p-5">
          <div className="inline-flex items-center rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-red-300">
            <Sparkles className="mr-2 h-3.5 w-3.5" />
            Vista previa
          </div>
          <div className="mt-5 overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(220,38,38,0.24),transparent_32%),linear-gradient(180deg,#171717_0%,#0b0b0b_100%)] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-violet-500/20 px-3 py-1 text-[11px] font-bold text-violet-200">{new Date(form.fecha_hora).toLocaleDateString()} · {new Date(form.fecha_hora).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-bold text-emerald-200">{Math.max(Number(form.max_participantes || 0) - 2, 0)} plazas libres</span>
            </div>
            <h2 className="mt-4 text-[2rem] font-black leading-[0.96] tracking-tight text-white">{form.titulo || "NYC Cheap Slice Run"}</h2>
            <div className="mt-3 flex items-center gap-2 text-sm text-stone-300">
              <span>{selectedPlace?.name || "Scarr's Pizza"}</span>
              <span className="font-bold text-red-400">{selectedPlace ? formatPrice(selectedPlace.standard_slice_price) : "$4.75"}</span>
              <span>· {selectedPlace?.neighborhood || "Lower East Side"}</span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {[form.vibe, selectedPlace ? getValueLabel(selectedPlace) : "Worth it", "Nuevas caras"].map((tag) => (
                <span key={tag} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-stone-200">{tag}</span>
              ))}
            </div>
            <p className="mt-5 text-sm leading-7 text-stone-300">{form.descripcion}</p>
            <div className="mt-6 rounded-2xl border border-white/10 bg-black/25 p-4 text-sm text-stone-300">
              <div className="flex items-center justify-between"><span>Publicar para todos</span><span className={`h-6 w-11 rounded-full ${form.publicar ? "bg-red-600" : "bg-white/10"}`} /></div>
            </div>
            <Button onClick={submit} className="mt-6 h-12 w-full rounded-2xl bg-red-600 text-sm font-bold text-white hover:bg-red-500">
              Publicar plan
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
