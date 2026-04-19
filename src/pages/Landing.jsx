import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowRight, Map, Flame, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

const slides = [
  {
    eyebrow: 'Mapa público',
    title: 'Encuentra el mejor slice por zona.',
    text: 'Explora pizzerías reales, compara precios y encuentra sitios que sí merecen la pena sin registrarte.',
    icon: Map,
    tone: 'from-[#111111] via-[#161616] to-[#202020]',
    accent: 'text-[#f3be35]',
  },
  {
    eyebrow: 'Planes sociales',
    title: 'Mira planes y únete rápido.',
    text: 'Descubre planes creados por otra gente, desliza y entra solo en los que de verdad te interesan.',
    icon: Flame,
    tone: 'from-[#254b2b] via-[#2f6a37] to-[#3f974b]',
    accent: 'text-[#f7f2d7]',
  },
  {
    eyebrow: 'Cuenta útil',
    title: 'Crea plan, añade spot y conoce gente.',
    text: 'Tu cuenta desbloquea la parte social: crear planes, guardar favoritos, entrar en grupos y usar tu perfil.',
    icon: Users,
    tone: 'from-[#7f2b1d] via-[#b84234] to-[#de5a42]',
    accent: 'text-[#fff2e8]',
  },
];

export default function Landing() {
  const [index, setIndex] = useState(0);
  const slide = useMemo(() => slides[index], [index]);
  const Icon = slide.icon;

  return (
    <div className="landing-screen bg-[#f4efe6] text-[#111111]">
      <div className="mx-auto flex h-full w-full max-w-md flex-col px-4 pb-4 pt-5 sm:max-w-lg">
        <div className="flex shrink-0 items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[#f0bf39] text-2xl shadow-[0_18px_36px_rgba(240,191,57,0.28)]">🍕</div>
          <div className="min-w-0">
            <div className="text-[clamp(2rem,8vw,2.75rem)] font-black leading-none tracking-[-0.05em] text-[#111111]">Pizzapolis</div>
          </div>
        </div>

        <div className="mt-4 min-h-0 flex-1 rounded-[34px] border border-black/10 bg-[#fffaf1] p-3 shadow-[0_24px_60px_rgba(34,25,11,0.12)]">
          <div className={`flex h-full min-h-0 flex-col overflow-hidden rounded-[30px] bg-gradient-to-br ${slide.tone} p-5 text-white`}>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="inline-flex rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-white/84">
                  {slide.eyebrow}
                </div>
                <h1 className="mt-4 max-w-[15rem] text-[clamp(2rem,10vw,3.2rem)] font-black leading-[0.9] tracking-[-0.07em]">
                  {slide.title}
                </h1>
                <p className="mt-4 max-w-[17rem] text-[15px] leading-7 text-white/82">
                  {slide.text}
                </p>
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
                      i === index ? 'border-white/20 bg-white/14 text-white' : 'border-white/10 bg-black/10 text-white/78'
                    }`}
                  >
                    <div className="text-[10px] font-black uppercase tracking-[0.18em]">{item.eyebrow}</div>
                    <div className="mt-1 text-xs leading-5">{i === 0 ? 'Precio + mapa' : i === 1 ? 'Swipe social' : 'Perfil + grupos'}</div>
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
