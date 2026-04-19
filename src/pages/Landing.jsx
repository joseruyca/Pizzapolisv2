import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { ArrowRight, Map, Flame, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

const slides = [
  {
    eyebrow: 'Mapa público',
    title: 'Encuentra slices buenos sin perder tiempo.',
    text: 'Abre el mapa, compara precio, rating y best slice, y encuentra spots que sí merecen la pena.',
    icon: Map,
    tone: 'from-[#0f0f0f] via-[#151515] to-[#242424]',
    accent: 'text-[#f3be35]',
    summary: 'Precio + mapa',
  },
  {
    eyebrow: 'Descubrir planes',
    title: 'Desliza y entra solo en los planes que te apetecen.',
    text: 'Experiencia rápida tipo swipe para unirte a planes reales en segundos, sin listas infinitas.',
    icon: Flame,
    tone: 'from-[#2a140f] via-[#571d16] to-[#8f2c21]',
    accent: 'text-[#ffd6c9]',
    summary: 'Swipe social',
  },
  {
    eyebrow: 'Tu cuenta',
    title: 'Crea plan, añade spot y habla con tu grupo.',
    text: 'Tu perfil desbloquea la parte social: publicar, guardar, entrar en grupos y moverte más rápido por la app.',
    icon: Users,
    tone: 'from-[#243118] via-[#314721] to-[#496931]',
    accent: 'text-[#f4f0d7]',
    summary: 'Cuenta + grupos',
  },
];

export default function Landing() {
  const [index, setIndex] = useState(0);
  const slide = useMemo(() => slides[index], [index]);
  const Icon = slide.icon;

  const goTo = (next) => {
    if (next < 0 || next >= slides.length) return;
    setIndex(next);
  };

  return (
    <div className="h-dvh overflow-hidden bg-[#f4efe6] text-[#111111]">
      <div className="mx-auto flex h-dvh w-full max-w-[430px] flex-col overflow-hidden px-4 pb-3 pt-4">
        <div className="shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-[#f0bf39] text-2xl shadow-[0_18px_36px_rgba(240,191,57,0.28)]">🍕</div>
            <div className="min-w-0">
              <div className="text-[clamp(2rem,8vw,2.7rem)] font-black leading-none tracking-[-0.06em]">Pizzapolis</div>
              <div className="mt-1 text-[11px] font-black uppercase tracking-[0.22em] text-[#8a8174]">spots, planes y grupos</div>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col justify-center py-4">
          <div className="rounded-[34px] border border-black/10 bg-[#fffaf1] p-3 shadow-[0_24px_60px_rgba(34,25,11,0.12)]">
            <motion.div
              key={slide.eyebrow}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.14}
              onDragEnd={(_, info) => {
                if (info.offset.x <= -80) goTo(index + 1);
                if (info.offset.x >= 80) goTo(index - 1);
              }}
              initial={{ opacity: 0, y: 16, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 280, damping: 26 }}
              className={`relative flex min-h-[380px] flex-col overflow-hidden rounded-[30px] bg-gradient-to-br ${slide.tone} p-5 text-white`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-white/90">
                    {slide.eyebrow}
                  </div>
                  <h1 className="mt-4 max-w-[15rem] text-[clamp(2.2rem,10vw,3.3rem)] font-black leading-[0.9] tracking-[-0.07em]">
                    {slide.title}
                  </h1>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/12 backdrop-blur-sm">
                  <Icon className={`h-6 w-6 ${slide.accent}`} />
                </div>
              </div>

              <p className="mt-5 max-w-[17rem] text-[15px] leading-7 text-white/82">
                {slide.text}
              </p>

              <div className="mt-auto space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {slides.map((item, i) => (
                    <button
                      key={item.eyebrow}
                      type="button"
                      onClick={() => setIndex(i)}
                      className={`rounded-2xl border px-3 py-3 text-left transition ${
                        i === index ? 'border-white/22 bg-white/14 text-white' : 'border-white/10 bg-black/10 text-white/72'
                      }`}
                    >
                      <div className="text-[10px] font-black uppercase tracking-[0.18em]">0{i + 1}</div>
                      <div className="mt-1 text-xs leading-5">{item.summary}</div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="shrink-0 space-y-3">
          <Link to={createPageUrl('Home')}>
            <Button className="h-14 w-full rounded-[22px] border-0 bg-[#f0bf39] px-5 text-base font-black text-[#111111] shadow-[0_18px_36px_rgba(240,191,57,0.22)] hover:bg-[#d9a826]">
              Ir al mapa
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link to="/auth">
            <Button variant="outline" className="h-14 w-full rounded-[22px] border-black/10 bg-[#fffaf1] text-base font-semibold text-[#141414] hover:bg-white">
              Ir a mi cuenta
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
