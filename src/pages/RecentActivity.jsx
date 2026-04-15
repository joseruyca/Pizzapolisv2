import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Bookmark, MessageCircle, Star, Users } from "lucide-react";
import { createPageUrl } from "@/utils";

const items = [
  { icon: Users, title: "Te uniste a NYC Cheap Slice Run", time: "Hace 2 h" },
  { icon: Star, title: "Valoraste Scarr's Pizza con 4.7", time: "Ayer" },
  { icon: Bookmark, title: "Guardaste Brooklyn Square & Chill", time: "Ayer" },
  { icon: MessageCircle, title: "Enviaste un mensaje en Queens budget run", time: "Hace 3 días" },
];

export default function RecentActivity() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#060606] px-4 py-4">
      <div className="mx-auto max-w-md rounded-[30px] border border-white/10 bg-[#101010] p-5">
        <div className="mb-6 flex items-center gap-3">
          <Link to={createPageUrl("Profile")} className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-stone-200"><ArrowLeft className="h-4 w-4" /></Link>
          <div>
            <h1 className="text-3xl font-black">Actividad reciente</h1>
            <p className="text-sm text-stone-500">Tus últimos movimientos dentro de Pizzapolis.</p>
          </div>
        </div>
        <div className="space-y-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.04]"><Icon className="h-4 w-4 text-red-400" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-white">{item.title}</div>
                    <div className="mt-1 text-sm text-stone-500">{item.time}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
