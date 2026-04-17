import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { ArrowRight, Map, MessageCircle, ChevronLeft, ChevronRight, MapPin, Users } from "lucide-react";

const slides = [
  {
    eyebrow: "Bienvenida",
    title: "Pizzapolis",
    subtitle: "Mapa, planes y gente nueva.",
    body: "Descubre slices baratos, encuentra planes creados por otros usuarios y conoce gente alrededor de pizzerías reales.",
    accent: "from-red-700/30 via-red-600/10 to-black",
    icon: "🍕",
    points: [
      { icon: Map, title: "Explora el mapa", text: "Mira spots reales con precio del slice, valor y ambiente." },
      { icon: Users, title: "Únete a planes", text: "Desliza sí o no según te interese el plan." },
    ],
  },
  {
    eyebrow: "Comunidad",
    title: "Añade sitios",
    subtitle: "El mapa también lo construyes tú.",
    body: "Puedes colocar pines de pizzerías, indicar el precio real del slice y dejar una nota rápida para ayudar a otros usuarios.",
    accent: "from-emerald-700/20 via-red-700/10 to-black",
    icon: "📍",
    points: [
      { icon: MapPin, title: "Add Spot", text: "Coloca un pin nuevo en el mapa cuando descubras un sitio bueno." },
      { icon: MessageCircle, title: "Añade contexto", text: "Comparte precio, tipo de slice y si realmente merece la pena." },
    ],
  },
  {
    eyebrow: "Así funciona",
    title: "Desliza planes",
    subtitle: "No personas.",
    body: "En Descubrir verás planes creados por gente en pizzerías reales. Si te interesa, te unes directamente al grupo y entras al chat.",
    accent: "from-white/8 via-red-700/10 to-black",
    icon: "💬",
    points: [
      { icon: Users, title: "Swipe rápido", text: "Izquierda para pasar, derecha para unirte." },
      { icon: MessageCircle, title: "Grupo al instante", text: "Cuando aceptas, entras al chat del plan automáticamente." },
    ],
  },
  {
    eyebrow: "Todo conectado",
    title: "Mapa + grupos",
    subtitle: "Un producto, no dos apps separadas.",
    body: "Desde cada spot puedes comparar precios, abrir Google Maps, ver actividad y crear un plan nuevo si quieres quedar con gente.",
    accent: "from-red-900/20 via-white/5 to-black",
    icon: "🗺️",
  },
];

export default function Landing() {
  const [index, setIndex] = useState(0);
  const slide = useMemo(() => slides[index], [index]);

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-hidden">
      <div className="relative mx-auto min-h-screen max-w-md px-5 py-6 sm:max-w-lg flex flex-col">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(220,38,38,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.06),transparent_24%)] pointer-events-none" />

        <div className="relative flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-600 shadow-lg shadow-red-900/30">🍕</div>
            <div className="min-w-0">
              <div className="truncate text-[1.8rem] font-black tracking-tight leading-none">Pizzapolis</div>
              <div className="text-sm text-stone-400">Mapa social de slices y planes</div>
            </div>
          </div>
          {index > 0 ? (
            <button onClick={() => setIndex((prev) => Math.max(0, prev - 1))} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-stone-200">
              <ChevronLeft className="h-5 w-5" />
            </button>
          ) : <div className="h-11 w-11" />}
        </div>

        <div className={`relative mt-5 flex-1 rounded-[30px] border border-white/10 bg-gradient-to-b ${slide.accent} p-5 shadow-[0_30px_90px_rgba(0,0,0,0.45)] overflow-hidden`}>
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none" />

          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="relative h-full flex flex-col"
            >
              <div className="inline-flex items-center self-start rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-red-300">
                {slide.eyebrow}
              </div>

              <div className="mt-4 flex h-14 w-14 items-center justify-center rounded-[20px] border border-white/10 bg-black/30 text-2xl backdrop-blur-sm">
                {slide.icon}
              </div>

              <h1 className="mt-4 text-[2.35rem] font-black tracking-tight leading-[0.94]">{slide.title}</h1>
              <div className="mt-1 text-[1.02rem] font-semibold text-stone-100">{slide.subtitle}</div>
              <p className="mt-3 text-[14px] leading-6 text-stone-300">{slide.body}</p>

              {slide.points ? (
                <div className="mt-5 space-y-3">
                  {slide.points.map((point) => {
                    const Icon = point.icon;
                    return (
                      <div key={point.title} className="flex gap-3 rounded-2xl border border-white/10 bg-black/35 p-4 backdrop-blur-sm">
                        <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-red-600/20 text-red-300"><Icon className="h-5 w-5" /></div>
                        <div>
                          <div className="font-bold text-white">{point.title}</div>
                          <div className="mt-1 text-sm leading-6 text-stone-400">{point.text}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : <div className="flex-1" />}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="relative mt-4 flex items-center justify-center gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              className={`h-2.5 rounded-full transition-all ${i === index ? "w-8 bg-white" : "w-2.5 bg-white/25"}`}
            />
          ))}
        </div>

        <div className="relative mt-4 grid gap-3">
          {index < slides.length - 1 ? (
            <Button onClick={() => setIndex((prev) => Math.min(slides.length - 1, prev + 1))} className="h-14 rounded-2xl bg-red-600 text-base font-bold hover:bg-red-500">
              Continuar
              <ChevronRight className="ml-1 h-5 w-5" />
            </Button>
          ) : (
            <Link to={createPageUrl("Home")}>
              <Button className="h-14 w-full rounded-2xl bg-red-600 text-base font-bold hover:bg-red-500">
                Entrar en la app
                <ArrowRight className="ml-1 h-5 w-5" />
              </Button>
            </Link>
          )}

          <Link to={createPageUrl("Home")} className="flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-sm font-semibold text-stone-300">
            Saltar introducción
          </Link>
        </div>
      </div>
    </div>
  );
}
