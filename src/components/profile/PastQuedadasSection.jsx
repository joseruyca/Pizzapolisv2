import React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Users, Calendar, MapPin } from "lucide-react";

export default function PastQuedadasSection({ quedadas }) {
  if (quedadas.length === 0) {
    return (
      <div className="bg-[#111] border border-white/10 rounded-2xl p-8 text-center">
        <Users className="w-10 h-10 text-stone-700 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-stone-400 mb-1">
          Sin quedadas pasadas
        </h3>
        <p className="text-stone-600 text-sm">
          Cuando completes una quedada, aparecerá aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#111] border border-white/10 rounded-2xl p-6 md:p-8">
      <h3 className="text-lg font-semibold text-white mb-6">
        Historial de quedadas
      </h3>
      <div className="space-y-4">
        {quedadas.map((quedada) => (
          <div
            key={quedada.id}
            className="p-4 bg-white/[0.03] border border-white/5 rounded-xl hover:bg-white/5 transition-colors"
          >
            <div className="flex items-start justify-between gap-4 mb-2">
              <h4 className="font-medium text-white">{quedada.titulo}</h4>
              <span className="px-2 py-1 bg-green-500/10 border border-green-500/20 rounded-lg text-xs font-medium text-green-400">
                Completada
              </span>
            </div>

            <div className="space-y-1.5 text-sm text-stone-400">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-stone-600" />
                {quedada.pizzeria_nombre}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-stone-600" />
                {format(new Date(quedada.fecha_hora), "d 'de' MMMM 'de' yyyy", {
                  locale: es,
                })}
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-stone-600" />
                {quedada.max_participantes} participantes
              </div>
            </div>

            {quedada.descripcion && (
              <p className="text-xs text-stone-500 mt-3 italic">
                "{quedada.descripcion}"
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}