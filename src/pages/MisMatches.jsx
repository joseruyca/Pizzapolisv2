import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Info, MapPin, Send, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
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
      const unreadCount = messageList.filter((message) => message.sender_id !== currentUserEmail && !message.leido).length;
      return {
        ...hangout,
        place: placeById[hangout.pizzeria_id],
        host: userById[hangout.creador_id],
        participants,
        messageList,
        lastMessage: messageList[messageList.length - 1],
        unreadCount,
      };
    })
    .sort((a, b) => new Date(a.fecha_hora) - new Date(b.fecha_hora));
}

function GroupInfoSheet({ group, open, onClose }) {
  if (!group || !open) return null;
  return (
    <div className="fixed inset-0 z-[1400] bg-black/55 backdrop-blur-sm" onClick={onClose}>
      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-lg rounded-t-[30px] border border-white/10 bg-[#101010] p-5 text-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/15" />
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-stone-500">Info del grupo</div>
            <h3 className="mt-2 text-2xl font-black leading-tight">{group.titulo}</h3>
            <div className="mt-2 text-sm text-stone-400">{group.pizzeria_nombre} · {group.place?.neighborhood}</div>
          </div>
          <button onClick={onClose} className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-stone-300"><X className="h-4 w-4" /></button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">Cuándo</div>
            <div className="mt-2 text-sm font-bold">{formatHangoutDate(group.fecha_hora)}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">Slice</div>
            <div className="mt-2 text-sm font-bold">{formatPrice(group.place?.standard_slice_price)}</div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-stone-300">{group.descripcion}</div>

        <div className="mt-4 flex flex-wrap gap-2">
          {group.participants.map((person) => (
            <div key={person.email} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-stone-200">
              <div className={`grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br ${person.avatar_color || "from-stone-500 to-stone-700"} text-[11px] font-bold text-white`}>{avatar(person)}</div>
              {person.full_name}
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <a href={getGoogleMapsUrl(group.place)} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-sm font-bold text-white">
            <MapPin className="mr-2 h-4 w-4" />Abrir en Google Maps
          </a>
          <button onClick={onClose} className="inline-flex h-12 items-center justify-center rounded-2xl bg-red-600 text-sm font-bold text-white">Volver al chat</button>
        </div>
      </div>
    </div>
  );
}

function MessageRow({ message, currentUser, usersByEmail }) {
  const own = message.sender_id === currentUser.email;
  const sender = usersByEmail[message.sender_id];
  return (
    <div className={`flex ${own ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[82%] rounded-[22px] px-4 py-3 ${own ? "rounded-br-md bg-[#e62f2f] text-white" : "rounded-bl-md border border-white/6 bg-[#171717] text-stone-100"}`}>
        {!own ? <div className="mb-1 text-[11px] font-bold uppercase tracking-[0.12em] text-stone-500">{sender?.full_name || "User"}</div> : null}
        <div className="text-sm leading-6">{message.texto}</div>
      </div>
    </div>
  );
}

function GroupListItem({ group, active, onSelect }) {
  return (
    <button
      onClick={onSelect}
      className={`w-full rounded-[22px] border px-3 py-3 text-left transition ${active ? "border-red-500/25 bg-red-500/[0.08]" : "border-white/6 bg-transparent hover:bg-white/[0.03]"}`}
    >
      <div className="flex items-start gap-3">
        <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-to-br ${group.host?.avatar_color || "from-red-500 to-orange-500"} text-sm font-black text-white`}>{avatar(group.host)}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="truncate font-bold text-white">{group.titulo}</div>
            <div className="text-[11px] text-stone-500">{group.lastMessage ? new Date(group.lastMessage.created_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : new Date(group.fecha_hora).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
          </div>
          <div className="mt-1 truncate text-xs text-stone-400">{group.pizzeria_nombre} · {group.place?.neighborhood}</div>
          <div className="mt-2 flex items-center justify-between gap-3">
            <div className="truncate text-sm text-stone-300">{group.lastMessage?.texto || group.descripcion || "No hay mensajes todavía"}</div>
            {group.unreadCount > 0 ? <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">{group.unreadCount}</span> : null}
          </div>
        </div>
      </div>
    </button>
  );
}

export default function MisMatches() {
  const { user } = useAuth();
  const [selectedId, setSelectedId] = useState(null);
  const [tab, setTab] = useState("upcoming");
  const [showInfo, setShowInfo] = useState(false);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();


  const { data: queryData, isLoading } = useQuery({
    queryKey: ["my-groups-v6", user?.email],
    enabled: !!user,
    queryFn: async () => {
      const [quedadas, intereses, places, users, messages] = await Promise.all([
        base44.entities.Quedada.list("fecha_hora", 100),
        base44.asServiceRole.entities.Interes.list("created_date", 1000),
        base44.entities.PizzaPlace.list("name", 100),
        base44.asServiceRole.entities.User.list("full_name", 100),
        base44.entities.Message.list("created_date", 1000),
      ]);
      return { groups: enrichGroups(quedadas, intereses, places, users, messages, user.email), users };
    },
    refetchInterval: 2500,
  });

  const groups = queryData?.groups || [];
  const users = queryData?.users || [];
  const usersByEmail = useMemo(() => Object.fromEntries(users.map((person) => [person.email, person])), [users]);
  const requestedFocus = searchParams.get("focus");

  const now = new Date();
  const upcoming = useMemo(() => groups.filter((item) => new Date(item.fecha_hora) >= now), [groups]);
  const history = useMemo(() => groups.filter((item) => new Date(item.fecha_hora) < now), [groups]);
  const allVisible = useMemo(() => [...upcoming, ...history], [upcoming, history]);
  const visible = tab === "upcoming" ? upcoming : history;
  const selected = visible.find((item) => item.id === selectedId) || allVisible.find((item) => item.id === selectedId) || visible[0] || null;

  useEffect(() => {
    if (!allVisible.length) {
      setSelectedId(null);
      setMobileChatOpen(false);
      return;
    }

    if (requestedFocus && allVisible.some((item) => item.id === requestedFocus)) {
      const focused = allVisible.find((item) => item.id === requestedFocus);
      setSelectedId(requestedFocus);
      setTab(new Date(focused.fecha_hora) >= now ? "upcoming" : "history");
      setMobileChatOpen(true);
      setSearchParams((params) => {
        const next = new URLSearchParams(params);
        next.delete("focus");
        return next;
      }, { replace: true });
      return;
    }

    const selectedStillExists = selectedId && allVisible.some((item) => item.id === selectedId);
    if (!selectedStillExists) {
      const fallback = visible[0] || allVisible[0];
      if (fallback) setSelectedId(fallback.id);
    }
  }, [selectedId, visible, allVisible, requestedFocus, now, setSearchParams]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selected?.messageList?.length, selected?.id]);

  useEffect(() => {
    if (!selected || !user?.email) return;
    const unread = selected.messageList.filter((message) => message.sender_id !== user.email && !message.leido);
    if (!unread.length) return;

    Promise.all(unread.map((message) => base44.entities.Message.update(message.id, { leido: true }))).then(() => {
      queryClient.invalidateQueries({ queryKey: ["my-groups-v6", user.email] });
    }).catch(() => null);
  }, [selected?.id, user?.email]);

  const sendMutation = useMutation({
    mutationFn: async (text) => {
      if (!selected) throw new Error("No group selected");
      return base44.entities.Message.create({ quedada_id: selected.id, sender_id: user.email, receiver_id: "group", texto: text, leido: false });
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["my-groups-v6", user?.email] });
    },
  });

  function handleSend() {
    if (!messageText.trim() || !selected || sendMutation.isPending) return;
    sendMutation.mutate(messageText.trim());
  }

  if (!user || isLoading) return <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-[#060606] text-white">Cargando…</div>;

  if (!groups.length) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-[#060606] px-4 py-8">
        <div className="mx-auto max-w-md rounded-[30px] border border-white/10 bg-[#111] p-8 text-center">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-white/[0.04] text-4xl">💬</div>
          <h1 className="mt-6 text-3xl font-black text-white">Todavía no te has unido a ningún grupo</h1>
          <p className="mt-3 text-sm leading-7 text-stone-400">Cuando digas que sí a un plan en Descubrir, entrarás automáticamente a su grupo y aparecerá aquí.</p>
          <Link to="/Descubrir" className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-red-600 text-sm font-bold text-white">Ir a descubrir</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="h-[calc(100dvh-var(--header-height))] overflow-hidden bg-[#070707] text-white">
        <div className="mx-auto grid h-full max-w-6xl lg:grid-cols-[360px,1fr]">
          <aside className={`${mobileChatOpen ? "hidden lg:flex" : "flex"} min-h-0 flex-col border-r border-white/6 bg-[#0f0f0f]`}>
            <div className="border-b border-white/6 px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h1 className="text-[2rem] font-black tracking-tight text-white">Mis grupos</h1>
                  <p className="mt-1 text-sm text-stone-400">Tus chats activos y planes guardados.</p>
                </div>
                <span className="inline-flex h-10 min-w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-3 text-sm font-bold text-white">{visible.length}</span>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={() => setTab("upcoming")} className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === "upcoming" ? "bg-red-600 text-white" : "border border-white/10 bg-white/[0.04] text-stone-300"}`}>Próximos</button>
                <button onClick={() => setTab("history")} className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === "history" ? "bg-red-600 text-white" : "border border-white/10 bg-white/[0.04] text-stone-300"}`}>Historial</button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2 space-y-2">
              {visible.map((hangout) => (
                <GroupListItem
                  key={hangout.id}
                  group={hangout}
                  active={selected?.id === hangout.id}
                  onSelect={() => {
                    setSelectedId(hangout.id);
                    setMobileChatOpen(true);
                  }}
                />
              ))}
            </div>
          </aside>

          {selected ? (
            <section className={`${mobileChatOpen ? "flex" : "hidden lg:flex"} min-h-0 min-w-0 flex-col bg-[#0b0b0b]`}>
              <div className="flex items-center gap-3 border-b border-white/6 px-4 py-3">
                <button onClick={() => setMobileChatOpen(false)} className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-stone-300 lg:hidden"><ArrowLeft className="h-4 w-4" /></button>
                <button onClick={() => setShowInfo(true)} className="min-w-0 flex-1 text-left">
                  <div className="truncate text-base font-black text-white">{selected.titulo}</div>
                  <div className="truncate text-sm text-stone-400">{selected.pizzeria_nombre} · {selected.place?.neighborhood}</div>
                </button>
                <a href={getGoogleMapsUrl(selected.place)} target="_blank" rel="noreferrer" className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-stone-300"><ExternalLink className="h-4 w-4" /></a>
                <button onClick={() => setShowInfo(true)} className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-stone-300"><Info className="h-4 w-4" /></button>
              </div>

              <div className="border-b border-white/6 px-4 py-3 text-sm text-stone-300">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-violet-500/20 px-3 py-1 text-[11px] font-bold text-violet-200">{formatHangoutDate(selected.fecha_hora)}</span>
                  <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-bold text-emerald-200">{selected.participants.length} / {selected.max_participantes}</span>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-bold text-stone-200">{selected.vibe || "Casual"}</span>
                  <span className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] font-bold text-stone-200">{formatPrice(selected.place?.standard_slice_price)}</span>
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(220,38,38,0.12),transparent_24%),linear-gradient(180deg,#0b0b0b_0%,#0a0a0a_100%)] px-4 py-4 pb-6">
                <div className="mb-4 flex flex-wrap gap-2">
                  {selected.participants.map((person) => (
                    <div key={person.email} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-stone-200">
                      <div className={`grid h-6 w-6 place-items-center rounded-full bg-gradient-to-br ${person.avatar_color || "from-stone-500 to-stone-700"} text-[10px] font-bold text-white`}>{avatar(person)}</div>
                      {person.full_name}
                    </div>
                  ))}
                </div>
                <div className="space-y-3 pb-2">
                  {selected.messageList.map((message) => <MessageRow key={message.id} message={message} currentUser={user} usersByEmail={usersByEmail} />)}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <div className="shrink-0 border-t border-white/6 px-4 py-3 bg-[#0a0a0a]" style={{ paddingBottom: "max(0.9rem, env(safe-area-inset-bottom))" }}>
                <div className="flex w-full items-center gap-2 rounded-[24px] border border-white/10 bg-[#121212] p-2">
                  <input
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Escribe un mensaje..."
                    className="h-11 min-w-0 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-stone-500"
                  />
                  <button onClick={handleSend} className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-red-600 text-white disabled:opacity-50" disabled={!messageText.trim() || sendMutation.isPending}>
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </section>
          ) : (
            <div className="hidden items-center justify-center bg-[#0b0b0b] text-stone-500 lg:flex">Selecciona un grupo</div>
          )}
        </div>
      </div>
      <GroupInfoSheet group={selected} open={showInfo} onClose={() => setShowInfo(false)} />
    </>
  );
}
