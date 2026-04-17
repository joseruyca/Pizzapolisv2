import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, X, MessageCircle, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ZINDEX } from "@/lib/zindex";

export default function NotificationCenter({ user }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const notifs = await base44.entities.Notification.filter(
        { user_id: user.id },
        "-created_date"
      );
      return notifs;
    },
    refetchInterval: 3000,
    enabled: !!user,
  });

  const unreadCount = notifications.filter((n) => !n.leida).length;

  const handleMarkAsRead = async (notificationId) => {
    await base44.entities.Notification.update(notificationId, { leida: true });
    queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
  };

  const handleDismiss = async (notificationId) => {
    await base44.entities.Notification.delete(notificationId);
    queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
  };

  if (!user) return null;

  const NotificationIcon = ({ tipo }) => {
    switch (tipo) {
      case "nuevo_mensaje":
        return <MessageCircle className="w-5 h-5 text-blue-400" />;
      case "nuevo_match":
        return <Heart className="w-5 h-5 text-red-400" />;
      default:
        return <Bell className="w-5 h-5 text-stone-400" />;
    }
  };

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-stone-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0"
              onClick={() => setOpen(false)}
              style={{ zIndex: ZINDEX.NOTIFICATION_BACKDROP }}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-full right-0 mt-2 w-80 bg-[#141414] border border-white/10 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden"
              style={{ zIndex: ZINDEX.NOTIFICATION_POPUP }}
            >
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-semibold text-white">Notificaciones</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={async () => {
                      for (const n of notifications.filter((n) => !n.leida)) {
                        await handleMarkAsRead(n.id);
                      }
                    }}
                    className="text-xs text-stone-400 hover:text-stone-200 transition-colors"
                  >
                    Marcar todo como leído
                  </button>
                )}
              </div>

              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="w-10 h-10 text-stone-700 mx-auto mb-3" />
                    <p className="text-stone-500 text-sm">No hay notificaciones</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {notifications.slice(0, 10).map((notification) => (
                      <motion.div
                        key={notification.id}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className={`p-4 flex gap-3 hover:bg-white/5 transition-colors ${
                          !notification.leida ? "bg-white/[0.05]" : ""
                        }`}
                        onClick={() => {
                          if (!notification.leida) {
                            handleMarkAsRead(notification.id);
                          }
                        }}
                      >
                        <div className="mt-1">
                          <NotificationIcon tipo={notification.tipo} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-white truncate">
                            {notification.titulo}
                          </p>
                          <p className="text-xs text-stone-500 mt-0.5 line-clamp-2">
                            {notification.descripcion}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDismiss(notification.id);
                          }}
                          className="text-stone-600 hover:text-white transition-colors mt-1"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </motion.div>
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