import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CircleHelp, Mail, ShieldAlert } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function SupportPage() {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#060606] px-4 py-4">
      <div className="mx-auto max-w-md rounded-[30px] border border-white/10 bg-[#101010] p-5">
        <div className="mb-6 flex items-center gap-3">
          <Link to={createPageUrl("Profile")} className="grid h-11 w-11 place-items-center rounded-2xl border border-white/10 bg-white/[0.04] text-stone-200"><ArrowLeft className="h-4 w-4" /></Link>
          <div>
            <h1 className="text-3xl font-black">Ayuda y soporte</h1>
            <p className="text-sm text-stone-500">Preguntas rápidas y contacto.</p>
          </div>
        </div>
        <div className="space-y-3">
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4"><div className="flex items-start gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.04]"><CircleHelp className="h-4 w-4 text-red-400" /></div><div><div className="font-semibold text-white">¿Cómo añado un spot?</div><div className="mt-1 text-sm text-stone-500">Pulsa el botón rojo del mapa y completa el precio, nombre y ubicación.</div></div></div></div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4"><div className="flex items-start gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.04]"><ShieldAlert className="h-4 w-4 text-red-400" /></div><div><div className="font-semibold text-white">Reportar un problema</div><div className="mt-1 text-sm text-stone-500">Pronto tendrás reportes integrados para spots y grupos.</div></div></div></div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4"><div className="flex items-start gap-3"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.04]"><Mail className="h-4 w-4 text-red-400" /></div><div><div className="font-semibold text-white">Contacto</div><div className="mt-1 text-sm text-stone-500">support@pizzapolis.app</div></div></div></div>
        </div>
      </div>
    </div>
  );
}
