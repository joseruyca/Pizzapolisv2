import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowRight, Map, Flame, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

const slides = [
  {
    eyebrow: 'Mapa público',
    title: 'Explora pizzerías y compara el precio del slice.',
    text: 'Encuentra spots reales por barrio, mira precios y decide rápido sin tener que registrarte.',
    icon: Map,
    modifier: 'landing-slide landing-slide--map',
  },
  {
    eyebrow: 'Planes',
    title: 'Descubre planes y únete solo a los que te apetecen.',
    text: 'Desliza entre planes activos, mira cuánta gente va y entra cuando uno encaje contigo.',
    icon: Flame,
    modifier: 'landing-slide landing-slide--plans',
  },
  {
    eyebrow: 'Cuenta social',
    title: 'Crea tu plan, añade spots y entra en grupos.',
    text: 'La cuenta desbloquea la parte social útil de verdad: grupos, perfil, favoritos y nuevos spots.',
    icon: Users,
    modifier: 'landing-slide landing-slide--social',
  },
];

export default function Landing() {
  const [index, setIndex] = useState(0);
  const translateX = useMemo(() => `translateX(-${index * 33.3333}%)`, [index]);

  return (
    <div className="landing-screen">
      <div className="landing-shell">
        <div className="flex shrink-0 items-center gap-3 px-1 pt-1">
          <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[#f0bf39] text-2xl shadow-[0_18px_36px_rgba(240,191,57,0.28)]">🍕</div>
          <div className="min-w-0">
            <div className="text-[clamp(2rem,8vw,2.75rem)] font-black leading-none tracking-[-0.05em] text-[#111111]">Pizzapolis</div>
          </div>
        </div>

        <div className="landing-slider-card">
          <div className="landing-slider-viewport" style={{ transform: translateX }}>
            {slides.map((slide) => {
              const Icon = slide.icon;
              return (
                <section key={slide.eyebrow} className={slide.modifier}>
                  <div>
                    <div className="landing-slide-label">{slide.eyebrow}</div>
                    <div className="mt-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10 backdrop-blur-sm">
                      <Icon className="h-6 w-6 text-[#f0bf39]" />
                    </div>
                    <h1 className="landing-slide-title">{slide.title}</h1>
                    <p className="landing-slide-text">{slide.text}</p>
                  </div>
                </section>
              );
            })}
          </div>
        </div>

        <div className="landing-dots shrink-0">
          {slides.map((slide, i) => (
            <button
              key={slide.eyebrow}
              type="button"
              aria-label={`Ir a ${slide.eyebrow}`}
              className={`landing-dot ${i === index ? 'is-active' : ''}`}
              onClick={() => setIndex(i)}
            />
          ))}
        </div>

        <div className="grid shrink-0 gap-3 sm:grid-cols-2">
          <Link to={createPageUrl('Home')}>
            <Button className="h-13 w-full rounded-2xl border-0 bg-[#f0bf39] px-5 text-base font-black text-[#111111] shadow-[0_18px_36px_rgba(240,191,57,0.22)] hover:bg-[#d9a826]">
              Explorar el mapa
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link to="/auth">
            <Button variant="outline" className="h-13 w-full rounded-2xl border-black/10 bg-white text-base font-semibold text-[#111111] hover:bg-[#fffdf8]">
              Crear cuenta
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
