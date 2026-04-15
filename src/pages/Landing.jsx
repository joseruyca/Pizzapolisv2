import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { ArrowRight, Map, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";

const slides = [
  {
    eyebrow: "Bienvenida",
    title: "Pizzapolis",
    subtitle: "Planes de pizza. Gente nueva.",
    body: "Únete a quedadas, descubre spots y conoce gente real alrededor de planes sencillos en pizzerías.",
    accent: "from-red-700/30 via-red-600/10 to-black",
    icon: "🍕",
  },
  {
    eyebrow: "Así funciona",
    title: "Desliza planes",
    subtitle: "No personas.",
    body: "En Descubrir verás planes creados por gente en pizzerías reales. Desliza sí o no según te interese el plan.",
    points: [
      { icon: Map, title: "Descubre planes", text: "Ve planes reales en spots buenos." },
      { icon: MessageCircle, title: "Únete al grupo", text: "Si te interesa, entras directo al chat." },
    ],
    accent: "from-white/8 via-red-700/10 to-black",
    icon: "💬",
  },
  {
    eyebrow: "Explora spots y planes",
    title: "Mapa + planes",
    subtitle: "Todo conectado.",
    body: "Encuentra slices baratos, mira si merecen la pena y crea un plan en segundos si quieres ir con gente.",
    accent: "from-emerald-700/20 via-red-700/10 to-black",
    icon: "🗺️",
  },
];

export default function Landing() {
  const [index, setIndex] = useState(0);
  const slide = useMemo(() => slides[index], [index]);

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-y-auto">
      <div className="relative mx-auto min-h-screen max-w-md px-5 pb-6 pt-7 sm:max-w-lg">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(220,38,38,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.06),transparent_24%)] pointer-events-none" />

        <div className="relative flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-600 shadow-lg shadow-red-900/30">🍕</div>
            <div className="min-w-0">
              <div className="truncate text-[1.9rem] font-black tracking-tight leading-none">Pizzapolis</div>
              <div className="text-sm text-stone-400">Planes de pizza. Gente nueva.</div>
            </div>
          </div>
          {index > 0 ? (
            <button onClick={() => setIndex((prev) => Math.max(0, prev - 1))} className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-stone-200">
              <ChevronLeft className="h-5 w-5" />
            </button>
          ) : <div className="h-11 w-11" />}
        </div>

        <div className={`relative mt-5 rounded-[30px] border border-white/10 bg-gradient-to-b ${slide.accent} p-5 shadow-[0_30px_90px_rgba(0,0,0,0.45)]`}>
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none" />

          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <div className="inline-flex items-center rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-red-300">
                {slide.eyebrow}
              </div>

              <div className="mt-5 flex h-14 w-14 items-center justify-center rounded-[20px] border border-white/10 bg-black/30 text-2xl backdrop-blur-sm">
                {slide.icon}
              </div>

              <h1 className="mt-5 text-[2.6rem] font-black tracking-tight leading-[0.92]">{slide.title}</h1>
              <div className="mt-1 text-[1.05rem] font-semibold text-stone-100">{slide.subtitle}</div>
              <p className="mt-4 text-[15px] leading-7 text-stone-300">{slide.body}</p>

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
              ) : null}
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

        <div className="relative mt-4 grid gap-3 sticky bottom-0 bg-gradient-to-t from-[#050505] via-[#050505] to-transparent pt-3">
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
            Ya tengo cuenta
          </Link>
        </div>
      </div>
    </div>
  );
}
