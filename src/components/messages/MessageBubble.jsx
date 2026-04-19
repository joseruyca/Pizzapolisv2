import React from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default function MessageBubble({ message, isOwn }) {
  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-xs px-4 py-2 rounded-2xl ${
          isOwn
            ? "bg-red-600 text-white rounded-br-none"
            : "bg-white/10 text-stone-100 rounded-bl-none"
        }`}
      >
        <p className="text-sm break-words">{message.texto}</p>
        <p
          className={`text-xs mt-1 ${
            isOwn ? "text-red-200/60" : "text-stone-500"
          }`}
        >
          {formatDistanceToNow(new Date(message.created_date), {
            addSuffix: false,
            locale: es,
          })}
        </p>
      </div>
    </div>
  );
}