import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, UserPlus } from "lucide-react";
import { createPageUrl } from "@/utils";

const friends = ["Anna", "Leo", "Maya", "Chris"];

export default function FriendsPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#060606] px-4 py-4">
      <div className="mx-auto max-w-md rounded-[30px] border border-white/10 bg-[#101010] p-5">
        <div className="mb-6 flex items-center gap-3">
          <Link to={createPageUrl("Profile")} className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-stone-200"><ArrowLeft className="h-4 w-4" /></Link>
          <div>
            <h1 className="text-3xl font-black">Amigos</h1>
            <p className="text-sm text-stone-500">Gente con la que ya compartiste planes.</p>
          </div>
        </div>
        <div className="mb-4 rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-4 text-sm text-stone-400">Más adelante aquí podrás invitar contactos y ver sugerencias.</div>
        <div className="space-y-3">
          {friends.map((name) => (
            <div key={name} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-red-500 to-orange-500 text-sm font-black text-white">{name[0]}</div>
              <div className="flex-1 font-semibold text-white">{name}</div>
              <button className="rounded-full border border-white/10 px-3 py-2 text-xs text-stone-300"><UserPlus className="mr-1 inline h-3 w-3" />Invitar</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
