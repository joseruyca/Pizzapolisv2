import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowRight, Map, Flame, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

const slides = [
  {
    eyebrow: 'Mapa público',
    title: 'Encuentra slices reales por barrio.',
    text: 'Precio, valor y spots guardables en una interfaz rápida y fácil de leer.',
    icon: Map,
    tone: 'from-[#111111] via-[#1c1c1c] to-[#242424]',
    accent: 'text-[#f3be35]',
  },
  {
    eyebrow: 'Swipe social',
    title: 'Descubre planes y únete con un gesto.',
    text: 'La parte social es directa: ves el plan, deslizas y decides sin pantallas pesadas.',
    icon: Flame,
    tone: 'from-[#20452a] via-[#2b6a36] to-[#379349]',
    accent: 'text-[#fff6d7]',
  },
  {
    eyebrow: 'Gente + grupos',
    title: 'Crea tu plan y conoce a tu crew.',
    text: 'Tu cuenta desbloquea crear planes, unirte, entrar en grupos y tener perfil.',
    icon: Users,
    tone: 'from-[#8a2f20] via-[#b6402e] to-[#de5a42]',
    accent: 'text-[#fff4ea]',
  },
];

export default function Landing() {
  const [index, setIndex] = useState(0);
  const slide = useMemo(() => slides[index], [index]);
  const Icon = slide.icon;

  return (
    <div className="h-[100dvh] overflow-hidden bg-[#f4efe6] text-[#111111]">
      <div className="mx-auto flex h-full w-full max-w-md flex-col px-5 pb-5 pt-5 sm:max-w-lg">
        <div className="flex items-center gap-3">
          <div className="flex h-13 w-13 items-center justify-center rounded-[20px] bg-[#f0bf39] text-2xl shadow-[0_18px_36px_rgba(240,191,57,0.28)]">🍕</div>
          <div className="min-w-0">
            <div className="text-[clamp(2rem,8vw,2.75rem)] font-black leading-none tracking-[-0.05em] text-[#111111]">Pizzapolis</div>
            <div className="mt-1 text-sm text-[#544c3e]">Mapa social de slices y planes.</div>
          </div>
        </div>

        <div className="mt-4 rounded-[32px] border border-black/10 bg-[#fffaf1] p-5 shadow-[0_24px_60px_rgba(34,25,11,0.12)]">
          <div className="inline-flex rounded-full border border-[#cfe0c4] bg-[#edf6e9] px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#216b33]">
            Pizza · Planes · Gente
          </div>
          <h1 className="mt-4 text-[clamp(2.5rem,12vw,4rem)] font-black leading-[0.9] tracking-[-0.07em] text-[#111111]">
            Explora el mapa.
            <br />
            Únete a planes.
            <br />
            Conoce gente.
          </h1>
          <p className="mt-4 text-[15px] leading-7 text-[#5d5548]">
            Todo pensado para móvil, sin ruido visual y con una capa social clara cuando realmente hace falta.
          </p>
        </div>

        <div className="mt-4 min-h-0 flex-1 rounded-[32px] border border-black/10 bg-[#fffaf1] p-4 shadow-[0_22px_56px_rgba(34,25,11,0.10)]">
          <div className={`relative flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] bg-gradient-to-br ${slide.tone} p-5 text-white`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.22em] text-white/75">{slide.eyebrow}</div>
                <h2 className="mt-3 max-w-[14rem] text-[1.9rem] font-black leading-[0.95] tracking-[-0.05em]">{slide.title}</h2>
                <p className="mt-3 max-w-[16rem] text-sm leading-6 text-white/82">{slide.text}</p>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/12 backdrop-blur-sm">
                <Icon className={`h-6 w-6 ${slide.accent}`} />
              </div>
            </div>

            <div className="mt-auto">
              <div className="grid grid-cols-3 gap-2">
                {slides.map((item, i) => (
                  <button
                    key={item.eyebrow}
                    type="button"
                    onClick={() => setIndex(i)}
                    className={`rounded-2xl border px-3 py-3 text-left transition ${
                      i === index ? 'border-white/20 bg-white/14 text-white' : 'border-white/12 bg-black/10 text-white/80'
                    }`}
                  >
                    <div className="text-[10px] font-black uppercase tracking-[0.18em]">{item.eyebrow}</div>
                    <div className="mt-1 text-xs leading-5">{i === 0 ? 'Spots reales' : i === 1 ? 'Swipe rápido' : 'Cuenta útil'}</div>
                  </button>
                ))}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Link to={createPageUrl('Home')}>
                  <Button className="h-13 w-full rounded-2xl border-0 bg-[#f0bf39] px-5 text-base font-black text-[#111111] shadow-[0_18px_36px_rgba(240,191,57,0.22)] hover:bg-[#d9a826]">
                    Explorar el mapa
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button variant="outline" className="h-13 w-full rounded-2xl border-white/20 bg-white/10 text-base font-semibold text-white hover:bg-white/14">
                    Crear cuenta
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
