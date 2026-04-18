import React from "react";
import { Compass, MapPin, Shield, Users } from "lucide-react";

const guides = [
  { title: "Cómo añadir un spot", text: "Busca la dirección, ajusta el pin, añade nombre y precio del slice. Si hace falta, sube una foto limpia.", icon: MapPin },
  { title: "Cómo crear un plan rápido", text: "Elige spot, fecha, hora y cuánta gente entra. Mantén el texto corto para que la gente decida rápido.", icon: Users },
  { title: "Cómo moderar bien", text: "El admin aprueba spots, comentarios y fotos para evitar duplicados, spam o imágenes malas.", icon: Shield },
];

export default function Guides() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#060606] px-4 py-4 text-white">
      <div className="mx-auto max-w-4xl rounded-[30px] border border-white/10 bg-[#101010] p-6 shadow-[0_22px_60px_rgba(0,0,0,0.35)]">
        <div className="text-[11px] font-black uppercase tracking-[0.18em] text-[#efbf3a]">Guides</div>
        <h1 className="mt-3 text-4xl font-black tracking-[-0.05em]">Pizzapolis basics</h1>
        <p className="mt-3 text-sm leading-7 text-stone-400">Guías cortas y limpias para usar la app sin ruido ni capas demo heredadas.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {guides.map((guide) => {
            const Icon = guide.icon;
            return (
              <div key={guide.title} className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
                <Icon className="h-8 w-8 text-[#df5b43]" />
                <div className="mt-4 text-xl font-black">{guide.title}</div>
                <p className="mt-3 text-sm leading-7 text-stone-400">{guide.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
