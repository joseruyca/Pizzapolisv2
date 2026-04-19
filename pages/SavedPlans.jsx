import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Bookmark, MapPin } from "lucide-react";
import { createPageUrl } from "@/utils";

const saved = [
  { name: "Brooklyn Square & Chill", spot: "L'Industrie Pizza", area: "Williamsburg", when: "Mañana · 19:00" },
  { name: "Late-night LES slices", spot: "Scarr's Pizza", area: "Lower East Side", when: "Viernes · 21:15" },
];

export default function SavedPlans() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#060606] px-4 py-4">
      <div className="mx-auto max-w-md rounded-[30px] border border-white/10 bg-[#101010] p-5">
        <div className="mb-6 flex items-center gap-3">
          <Link to={createPageUrl("Profile")} className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-stone-200"><ArrowLeft className="h-4 w-4" /></Link>
          <div>
            <h1 className="text-3xl font-black">Planes guardados</h1>
            <p className="text-sm text-stone-500">Vuelve rápido a tus planes favoritos.</p>
          </div>
        </div>
        <div className="space-y-3">
          {saved.map((item) => (
            <div key={item.name} className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4">
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.04]"><Bookmark className="h-4 w-4 text-red-400" /></div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-white">{item.name}</div>
                  <div className="mt-1 text-sm text-stone-400">{item.spot}</div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-stone-500"><MapPin className="h-3 w-3" />{item.area} · {item.when}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
