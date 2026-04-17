import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowRight, Map, PlusCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

const highlights = [
  {
    icon: Map,
    title: 'Mapa claro',
    text: 'Spots reales, precios del slice y barrios de un vistazo.',
    tone: 'bg-[#eef7ec] text-[#216b33] border-[#cfe3d1]',
  },
  {
    icon: Users,
    title: 'Swipe de planes',
    text: 'Descubrir funciona como un match rápido para unirte sin ruido.',
    tone: 'bg-[#fff4d8] text-[#8a6200] border-[#ead28f]',
  },
  {
    icon: PlusCircle,
    title: 'Social de verdad',
    text: 'Crea plan, añade spot y habla con gente sin complicar la app.',
    tone: 'bg-[#fff0ea] text-[#b54834] border-[#efc5bc]',
  },
];

export default function Landing() {
  return (
    <div className="h-[100dvh] overflow-hidden bg-[#f7f3eb] text-[#111111]">
      <div className="mx-auto flex h-full w-full max-w-md flex-col px-5 pb-5 pt-5 sm:max-w-lg">
        <div className="flex items-center gap-3">
          <div className="flex h-13 w-13 items-center justify-center rounded-[20px] bg-[#ebb932] text-2xl shadow-[0_18px_36px_rgba(235,185,50,0.26)]">🍕</div>
          <div className="min-w-0">
            <div className="text-[clamp(2rem,8vw,2.65rem)] font-black leading-none tracking-[-0.04em]">Pizzapolis</div>
            <div className="mt-1 text-sm text-[#605747]">Mapa social de slices y planes.</div>
          </div>
        </div>

        <div className="mt-5 flex min-h-0 flex-1 flex-col rounded-[32px] border border-black/8 bg-[#fffaf1] p-5 shadow-[0_28px_60px_rgba(34,25,11,0.12)]">
          <div className="inline-flex w-fit rounded-full border border-[#cfe3d1] bg-[#eef7ec] px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[#216b33]">
            Pizza · Planes · Gente
          </div>

          <div className="mt-4">
            <h1 className="text-[clamp(2.55rem,12vw,4.2rem)] font-black leading-[0.9] tracking-[-0.065em] text-[#111111]">
              Descubre <span className="text-[#d6a11e]">pizza.</span>
              <br />
              Crea <span className="text-[#2f8f46]">planes.</span>
              <br />
              Conoce gente.
            </h1>
            <p className="mt-4 max-w-[29rem] text-[15px] leading-7 text-[#605747]">
              Mapa público para explorar bien y capa social solo cuando hace falta. Todo rápido, limpio y pensado para móvil.
            </p>
          </div>

          <div className="mt-5 grid shrink-0 gap-3 sm:grid-cols-2">
            <Link to={createPageUrl('Home')}>
              <Button className="h-13 w-full rounded-2xl border-0 bg-[#ebb932] px-5 text-base font-black text-[#111111] shadow-[0_18px_36px_rgba(235,185,50,0.24)] hover:bg-[#d6a11e]">
                Explorar el mapa
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button variant="outline" className="h-13 w-full rounded-2xl border-black/10 bg-white text-base font-semibold text-[#111111] hover:bg-[#fffdf9]">
                Crear cuenta
              </Button>
            </Link>
          </div>

          <div className="mt-5 grid min-h-0 flex-1 gap-3">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex min-h-0 items-center gap-3 rounded-[24px] border border-black/8 bg-white px-4 py-3.5">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${item.tone}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-base font-black text-[#111111]">{item.title}</div>
                    <div className="mt-0.5 text-sm leading-6 text-[#605747]">{item.text}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
