import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, MapPin, Navigation, Send } from "lucide-react";
import { formatHangoutDate, formatPrice, getGoogleMapsUrl } from "@/lib/place-helpers";

const avatar = (user) => user?.full_name?.slice(0, 1)?.toUpperCase() || "?";

function enrichGroups(quedadas, intereses, places, users, messages, currentUserEmail) {
  const likedIds = new Set(intereses.filter((item) => item.usuario_id === currentUserEmail && item.tipo_interes === "like").map((item) => item.quedada_id));
  const placeById = Object.fromEntries(places.map((place) => [place.id, place]));
  const userById = Object.fromEntries(users.map((person) => [person.id, person]));
  const userByEmail = Object.fromEntries(users.map((person) => [person.email, person]));

  return quedadas
    .filter((hangout) => likedIds.has(hangout.id))
    .map((hangout) => {
      const likes = intereses.filter((item) => item.quedada_id === hangout.id && item.tipo_interes === "like");
      const participants = likes.map((like) => userByEmail[like.usuario_id]).filter(Boolean);
      const messageList = messages.filter((message) => message.quedada_id === hangout.id).sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
      return {
        ...hangout,
        place: placeById[hangout.pizzeria_id],
        host: userById[hangout.creador_id],
        participants,
        messageList,
        lastMessage: messageList[messageList.length - 1],
      };
    })
    .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));
}

export default function MisMatches() {
  const [user, setUser] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => null);
  }, []);

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["my-groups-v4", user?.email],
    enabled: !!user,
    queryFn: async () => {
      const [quedadas, intereses, places, users, messages] = await Promise.all([
        base44.entities.Quedada.list("fecha_hora", 100),
        base44.asServiceRole.entities.Interes.list("created_date", 1000),
        base44.entities.PizzaPlace.list("name", 100),
        base44.asServiceRole.entities.User.list("full_name", 100),
        base44.entities.Message.list("created_date", 1000),
      ]);
      return enrichGroups(quedadas, intereses, places, users, messages, user.email);
    },
  });

  const selected = groups.find((item) => item.id === selectedId) || groups[0];

  useEffect(() => {
    if (!selectedId && groups[0]) setSelectedId(groups[0].id);
  }, [selectedId, groups]);

  if (!user || isLoading) return <div className="flex h-[calc(100vh-56px)] items-center justify-center bg-[#060606] text-white">Cargando…</div>;

  if (!groups.length) {
    return (
      <div className="flex h-[calc(100vh-56px)] items-center justify-center bg-[#060606] px-4">
        <div className="mx-auto max-w-md rounded-[30px] border border-white/10 bg-[#111] p-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-white/[0.04] text-4xl">💬</div>
          <h1 className="mt-6 text-3xl font-black">Todavía no te has unido a ningún grupo</h1>
          <p className="mt-3 text-sm leading-7 text-stone-400">Cuando digas que sí a un plan en Descubrir, entrarás automáticamente a su grupo y aparecerá aquí.</p>
          <a href="/Descubrir" className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-red-600 text-sm font-bold text-white">Ir a descubrir</a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-56px)] overflow-hidden bg-[#0b0b0b] text-white">
      <div className="mx-auto flex h-full max-w-6xl overflow-hidden lg:rounded-none">
        <aside className={`h-full w-full border-r border-white/8 bg-[#101010] lg:w-[390px] ${showChat ? "hidden lg:block" : "block"}`}>
          <div className="border-b border-white/8 px-4 py-4">
            <div className="text-3xl font-black tracking-tight">Mis grupos</div>
            <div className="mt-1 text-sm text-stone-400">Tus chats activos de pizza</div>
          </div>
          <div className="h-[calc(100%-84px)] overflow-y-auto px-2 py-2">
            {groups.map((hangout) => {
              const active = selected?.id === hangout.id;
              const lastText = hangout.lastMessage?.texto || "Sin mensajes todavía";
              return (
                <button
                  key={hangout.id}
                  onClick={() => {
                    setSelectedId(hangout.id);
                    setShowChat(true);
                  }}
                  className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition ${active ? "bg-white/[0.06]" : "hover:bg-white/[0.04]"}`}
                >
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${hangout.host?.avatar_color || "from-red-500 to-orange-500"} text-sm font-bold text-white`}>
                    {avatar(hangout.host)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate text-[15px] font-bold text-white">{hangout.titulo}</div>
                      <div className="text-[11px] text-stone-500">{new Date(hangout.fecha_hora).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                    <div className="mt-1 truncate text-sm text-stone-400">{hangout.pizzeria_nombre} · {hangout.place?.neighborhood}</div>
                    <div className="mt-1 truncate text-sm text-stone-500">{lastText}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {selected ? (
          <section className={`h-full flex-1 flex-col bg-[#0c0c0c] ${showChat ? "flex" : "hidden lg:flex"}`}>
            <div className="border-b border-white/8 px-4 py-3">
              <div className="flex items-center gap-3">
                <button onClick={() => setShowChat(false)} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-stone-300 lg:hidden">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div className={`flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br ${selected.host?.avatar_color || "from-red-500 to-orange-500"} text-sm font-bold text-white`}>
                  {avatar(selected.host)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-bold text-white">{selected.titulo}</div>
                  <div className="truncate text-sm text-stone-400">{selected.pizzeria_nombre} · {selected.place?.neighborhood}</div>
                </div>
                <a href={getGoogleMapsUrl(selected.place)} target="_blank" rel="noreferrer" className="hidden sm:inline-flex h-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-stone-200">
                  <Navigation className="mr-2 h-4 w-4" />Mapa
                </a>
              </div>
            </div>

            <div className="border-b border-white/8 bg-[#111] px-4 py-3 text-sm text-stone-300">
              <div className="font-semibold text-white">{formatHangoutDate(selected.fecha_hora)} · {formatPrice(selected.place?.standard_slice_price)}</div>
              <div className="mt-1 flex items-center gap-2 text-stone-400"><MapPin className="h-4 w-4" />{selected.place?.address || selected.place?.neighborhood}</div>
            </div>

            <div className="flex-1 overflow-y-auto bg-[#0f0f0f] px-4 py-4">
              <div className="mb-4 flex flex-wrap gap-2">
                {selected.participants.map((person) => (
                  <div key={person.email} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-stone-200">
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br ${person.avatar_color || "from-stone-500 to-stone-700"} text-[10px] font-bold text-white`}>{avatar(person)}</div>
                    {person.full_name}
                  </div>
                ))}
              </div>
              <div className="space-y-3">
                {selected.messageList.map((message) => {
                  const mine = message.sender_id === user.email;
                  const sender = groups.flatMap((g) => g.participants).find((p) => p.email === message.sender_id) || selected.host;
                  return (
                    <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[82%] rounded-[22px] px-4 py-3 ${mine ? "bg-red-600 text-white" : "bg-[#1a1a1a] text-stone-200 border border-white/6"}`}>
                        {!mine ? <div className="mb-1 text-xs font-semibold text-stone-400">{sender?.full_name}</div> : null}
                        <div className="text-sm leading-6">{message.texto}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-white/8 bg-[#101010] p-3">
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2">
                <input readOnly value="Escribe un mensaje..." className="flex-1 bg-transparent text-sm text-stone-500 outline-none" />
                <button className="flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-white">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
