import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { MapPin, MessageCircle, Navigation, Share2 } from "lucide-react";
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
  const [tab, setTab] = useState("upcoming");

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => null);
  }, []);

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["my-groups-v3", user?.email],
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

  const now = new Date();
  const upcoming = useMemo(() => groups.filter((item) => new Date(item.fecha_hora) >= now), [groups]);
  const history = useMemo(() => groups.filter((item) => new Date(item.fecha_hora) < now), [groups]);
  const visible = tab === "upcoming" ? upcoming : history;
  const selected = visible.find((item) => item.id === selectedId) || visible[0];

  useEffect(() => {
    if (!selectedId && visible[0]) setSelectedId(visible[0].id);
  }, [selectedId, visible]);

  if (!user || isLoading) return <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-[#060606] text-white">Cargando…</div>;

  if (!groups.length) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#060606] px-4 py-8">
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
    <div className="min-h-[calc(100vh-64px)] bg-[#060606] px-4 py-4">
      <div className="mx-auto max-w-6xl grid gap-4 lg:grid-cols-[0.92fr,1.08fr]">
        <div className="rounded-[30px] border border-white/10 bg-[#101010] p-4 lg:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-[2rem] font-black tracking-tight">Mis grupos</h1>
              <p className="mt-1 text-sm text-stone-400">Planes a los que te has unido</p>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-stone-200">{upcoming.length}</div>
          </div>

          <div className="mt-5 flex gap-2">
            <button onClick={() => setTab("upcoming")} className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === "upcoming" ? "bg-red-600 text-white" : "border border-white/10 bg-white/[0.04] text-stone-300"}`}>Próximos {upcoming.length}</button>
            <button onClick={() => setTab("history")} className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === "history" ? "bg-red-600 text-white" : "border border-white/10 bg-white/[0.04] text-stone-300"}`}>Historial</button>
          </div>

          <div className="mt-5 space-y-3 lg:max-h-[calc(100vh-240px)] lg:overflow-auto lg:pr-1">
            {visible.map((hangout) => {
              const active = selected?.id === hangout.id;
              const spotsLeft = Math.max((hangout.max_participantes || 0) - hangout.participants.length, 0);
              return (
                <button key={hangout.id} onClick={() => setSelectedId(hangout.id)} className={`w-full overflow-hidden rounded-[28px] border text-left transition ${active ? "border-red-500/25 bg-[radial-gradient(circle_at_top,rgba(220,38,38,0.18),transparent_32%),#131313]" : "border-white/10 bg-white/[0.02] hover:bg-white/[0.04]"}`}>
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="rounded-full bg-violet-500/20 px-3 py-1 text-[11px] font-bold text-violet-200">{new Date(hangout.fecha_hora).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-bold text-emerald-200">{spotsLeft} libres</span>
                    </div>
                    <h2 className="mt-4 text-[2rem] font-black leading-[0.95] text-white">{hangout.titulo}</h2>
                    <div className="mt-2 text-sm text-stone-400">{hangout.pizzeria_nombre} · {hangout.place?.neighborhood}</div>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 text-sm text-stone-300">
                        <div className="flex -space-x-2">
                          {hangout.participants.slice(0, 4).map((person) => (
                            <div key={person.email} className={`flex h-8 w-8 items-center justify-center rounded-full border border-black/40 bg-gradient-to-br ${person.avatar_color || "from-stone-500 to-stone-700"} text-[10px] font-bold text-white`}>
                              {avatar(person)}
                            </div>
                          ))}
                        </div>
                        <span>{hangout.participants.length} van</span>
                      </div>
                      <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-stone-200">{hangout.vibe}</span>
                    </div>
                    {hangout.lastMessage ? <div className="mt-3 text-sm text-stone-500">Último mensaje: “{hangout.lastMessage.texto.slice(0, 44)}...”</div> : null}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {selected ? (
          <div className="overflow-hidden rounded-[30px] border border-white/10 bg-[#101010]">
            <div className="relative border-b border-white/8 bg-[radial-gradient(circle_at_top,rgba(220,38,38,0.24),transparent_32%),linear-gradient(180deg,#141414_0%,#101010_100%)] p-5">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em]">
                <span className="rounded-full bg-violet-500/20 px-3 py-1 text-violet-200">{new Date(selected.fecha_hora) <= new Date(Date.now() + 86400000) ? "Hoy" : formatHangoutDate(selected.fecha_hora)}</span>
                <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-emerald-200">{Math.max((selected.max_participantes || 0) - selected.participants.length, 0)} plazas libres</span>
              </div>
              <h2 className="mt-4 text-[2rem] sm:text-[2.3rem] font-black tracking-tight leading-[0.96]">{selected.titulo}</h2>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-stone-300">
                <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" />{selected.pizzeria_nombre}</span>
                <span className="text-red-400 font-bold">{formatPrice(selected.place?.standard_slice_price)}</span>
                <span>{selected.place?.neighborhood}</span>
              </div>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-300">{selected.descripcion}</p>
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold uppercase tracking-[0.14em] text-stone-500">Asistentes {selected.participants.length}/{selected.max_participantes}</div>
                <button className="text-sm font-semibold text-red-400">Ver todos</button>
              </div>
              <div className="mt-4 flex flex-wrap gap-4">
                {selected.participants.map((person) => (
                  <div key={person.email} className="text-center">
                    <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br ${person.avatar_color || "from-stone-500 to-stone-700"} text-sm font-bold text-white`}>{avatar(person)}</div>
                    <div className="mt-2 text-sm font-semibold text-white">{person.full_name}</div>
                    <div className="text-xs text-stone-500">{person.email === selected.host?.email ? "Host" : "Miembro"}</div>
                  </div>
                ))}
              </div>

              <div className="mt-8 text-sm font-bold uppercase tracking-[0.14em] text-stone-500">Chat</div>
              <div className="mt-4 space-y-4 max-h-[320px] overflow-auto pr-1">
                {selected.messageList.map((message) => {
                  const mine = message.sender_id === user.email;
                  const sender = groups.flatMap((g) => g.participants).find((p) => p.email === message.sender_id) || selected.host;
                  return (
                    <div key={message.id} className={`flex gap-3 ${mine ? "justify-end" : "justify-start"}`}>
                      {!mine ? <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${sender?.avatar_color || "from-stone-500 to-stone-700"} text-xs font-bold text-white`}>{avatar(sender)}</div> : null}
                      <div className={`max-w-[78%] rounded-[22px] px-4 py-3 ${mine ? "bg-red-600 text-white" : "bg-white/[0.05] text-stone-200"}`}>
                        {!mine ? <div className="mb-1 text-xs font-semibold text-stone-400">{sender?.full_name}</div> : null}
                        <div className="text-sm leading-6">{message.texto}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                <a href={getGoogleMapsUrl(selected.place)} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-stone-200">
                  <Navigation className="mr-2 h-4 w-4" />Ver en el mapa
                </a>
                <button className="inline-flex h-12 items-center justify-center rounded-2xl bg-red-600 px-4 text-sm font-semibold text-white"><Share2 className="mr-2 h-4 w-4" />Invitar amigos</button>
                <button className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-semibold text-stone-200"><MessageCircle className="mr-2 h-4 w-4" />Abrir chat</button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
