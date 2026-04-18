import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bell, CalendarDays, CheckCircle2, Pizza, Shield, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ZINDEX } from "@/lib/zindex";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/AuthContext";

async function fetchNotifications(userId, isAdmin) {
  const [joinedPlansRes, pendingSpotsRes, pendingCommentsRes, pendingPhotosRes] = await Promise.all([
    supabase
      .from("plan_members")
      .select("plan_id, created_at, plans(title, plan_date, plan_time)")
      .eq("user_id", userId)
      .eq("status", "joined")
      .order("created_at", { ascending: false })
      .limit(6),
    isAdmin ? supabase.from("spots").select("id,name,created_at", { count: "exact" }).eq("status", "pending").limit(5) : Promise.resolve({ data: [], count: 0 }),
    isAdmin ? supabase.from("spot_comments").select("id,content,created_at", { count: "exact" }).eq("status", "pending").limit(5) : Promise.resolve({ data: [], count: 0 }),
    isAdmin ? supabase.from("spot_photos").select("id,created_at", { count: "exact" }).eq("status", "pending").limit(5) : Promise.resolve({ data: [], count: 0 }),
  ]);

  const userNotifications = (joinedPlansRes.data || []).map((item) => ({
    id: `joined-${item.plan_id}`,
    type: "joined_plan",
    title: item.plans?.title || "Te uniste a un plan",
    description: item.plans?.plan_date ? `Plan para ${item.plans.plan_date} · ${item.plans.plan_time || ""}` : "Ya formas parte del grupo.",
    created_at: item.created_at,
  }));

  const adminNotifications = isAdmin
    ? [
        ...(pendingSpotsRes.count ? [{ id: "pending-spots", type: "pending_spots", title: `${pendingSpotsRes.count} spots pendientes`, description: "Revisa y aprueba los nuevos spots en el panel admin.", created_at: pendingSpotsRes.data?.[0]?.created_at }] : []),
        ...(pendingCommentsRes.count ? [{ id: "pending-comments", type: "pending_comments", title: `${pendingCommentsRes.count} comentarios pendientes`, description: "Hay comentarios esperando moderación.", created_at: pendingCommentsRes.data?.[0]?.created_at }] : []),
        ...(pendingPhotosRes.count ? [{ id: "pending-photos", type: "pending_photos", title: `${pendingPhotosRes.count} fotos pendientes`, description: "Aprueba u oculta nuevas fotos desde admin.", created_at: pendingPhotosRes.data?.[0]?.created_at }] : []),
      ]
    : [];

  return [...adminNotifications, ...userNotifications]
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 10);
}

export default function NotificationCenter({ user }) {
  const [open, setOpen] = useState(false);
  const { isAdmin } = useAuth();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", user?.id, isAdmin],
    enabled: Boolean(user?.id),
    queryFn: () => fetchNotifications(user.id, isAdmin),
    staleTime: 15_000,
  });

  const unreadCount = notifications.length;

  const notificationIcon = useMemo(
    () => ({
      joined_plan: <CalendarDays className="w-5 h-5 text-[#216b33]" />,
      pending_spots: <Pizza className="w-5 h-5 text-[#df5b43]" />,
      pending_comments: <CheckCircle2 className="w-5 h-5 text-[#111111]" />,
      pending_photos: <Shield className="w-5 h-5 text-[#efbf3a]" />,
    }),
    []
  );

  if (!user) return null;

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-black/10 bg-white/60 text-[#141414] hover:bg-white transition-colors"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 bg-[#df5b43] text-white text-[10px] font-black rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0" onClick={() => setOpen(false)} style={{ zIndex: ZINDEX.NOTIFICATION_BACKDROP }} />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-full right-0 mt-2 w-80 bg-[#fffaf1] border border-black/10 rounded-3xl shadow-[0_24px_60px_rgba(17,17,17,0.18)] overflow-hidden"
              style={{ zIndex: ZINDEX.NOTIFICATION_POPUP }}
            >
              <div className="p-4 border-b border-black/8 flex items-center justify-between">
                <h3 className="font-black text-[#111111]">Actividad</h3>
                <button onClick={() => setOpen(false)} className="text-[#7b7368] hover:text-[#141414]"><X className="w-4 h-4" /></button>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="w-10 h-10 text-[#c2b8a6] mx-auto mb-3" />
                    <p className="text-[#6d665b] text-sm">Sin novedades por ahora</p>
                  </div>
                ) : (
                  <div className="divide-y divide-black/5">
                    {notifications.map((notification) => (
                      <div key={notification.id} className="p-4 flex gap-3 hover:bg-[#f7f1e7] transition-colors">
                        <div className="mt-1">{notificationIcon[notification.type] || <Bell className="w-5 h-5 text-[#6d665b]" />}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-[#111111]">{notification.title}</p>
                          <p className="text-xs text-[#6d665b] mt-1 leading-5">{notification.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
