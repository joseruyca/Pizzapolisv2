import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowRight, Map, PlusCircle, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';

const highlights = [
  {
    icon: Map,
    title: 'Explora el mapa',
    text: 'Encuentra pizzerías reales, compara slices y descubre zonas con buen precio.',
    tone: 'bg-[#eef7ec] text-[#2f7a35] border-[#d8ebd4]',
  },
  {
    icon: Users,
    title: 'Desliza planes',
    text: 'Descubrir funciona como una interfaz tipo swipe para unirte solo a los planes que te encajan.',
    tone: 'bg-[#fff6de] text-[#8d5b00] border-[#f1df9c]',
  },
  {
    icon: PlusCircle,
    title: 'Crea y comparte',
    text: 'Añade spots o monta un plan rápido para ir a por pizza con más gente.',
    tone: 'bg-[#fff0ec] text-[#b84234] border-[#f0cdc7]',
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen overflow-hidden bg-[#f4efe6] text-[#141414]">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-6 sm:max-w-lg">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#efbf3a] text-2xl shadow-[0_18px_38px_rgba(239,191,58,0.24)]">🍕</div>
          <div>
            <div className="text-[2rem] font-black leading-none tracking-tight">Pizzapolis</div>
            <div className="mt-1 text-sm text-[#6d665b]">Mapa social de slices y planes.</div>
          </div>
        </div>

        <div className="rounded-[34px] border border-black/8 bg-[#fffaf2] p-5 shadow-[0_24px_60px_rgba(39,29,14,0.12)]">
          <div className="inline-flex rounded-full border border-[#d8ebd4] bg-[#eef7ec] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-[#2f7a35]">
            Planes · Pizza · Gente
          </div>

          <h1 className="mt-5 text-[2.75rem] font-black leading-[0.95] tracking-[-0.05em] text-[#141414]">
            Descubre <span className="text-[#dbab23]">pizza.</span>
            <br />
            Crea <span className="text-[#3e9444]">planes.</span>
            <br />
            Conoce gente.
          </h1>

          <p className="mt-5 max-w-[30rem] text-[15px] leading-7 text-[#5f584e]">
            Explora pizzerías reales, únete a planes que te interesen o crea los tuyos. Pizzapolis mezcla mapa, comunidad y planes de una forma limpia y rápida.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Link to={createPageUrl('Home')}>
              <Button className="h-13 w-full rounded-2xl border-0 bg-[#efbf3a] px-5 text-base font-bold text-[#141414] shadow-[0_18px_38px_rgba(239,191,58,0.24)] hover:bg-[#dbab23]">
                Explorar el mapa
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button variant="outline" className="h-13 w-full rounded-2xl border-black/10 bg-white text-base font-semibold text-[#141414] hover:bg-[#fffdf8]">
                Crear cuenta
              </Button>
            </Link>
          </div>

          <div className="mt-7 space-y-3">
            {highlights.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-[24px] border border-black/8 bg-white p-4">
                  <div className="flex gap-3">
                    <div className={`mt-0.5 flex h-11 w-11 items-center justify-center rounded-2xl border ${item.tone}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-lg font-bold text-[#141414]">{item.title}</div>
                      <div className="mt-1 text-sm leading-6 text-[#6d665b]">{item.text}</div>
                    </div>
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
