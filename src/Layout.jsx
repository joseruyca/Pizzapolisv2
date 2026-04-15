import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Map, Flame, PlusCircle, Users, User, Menu, LogOut, Bell, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import NotificationCenter from "@/components/NotificationCenter";

const navItems = [
  { label: "Mapa", page: "Home", icon: Map },
  { label: "Descubrir", page: "Descubrir", icon: Flame },
  { label: "Crear", page: "CrearQuedada", icon: PlusCircle, accent: true },
  { label: "Mis grupos", page: "MisMatches", icon: Users },
  { label: "Perfil", page: "Profile", icon: User },
];

export default function Layout({ children, currentPageName }) {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
      } catch {}
      setAuthChecked(true);
    };
    load();
  }, []);

  const handleLogout = () => base44.auth.logout();
  const hideHeader = currentPageName === "Landing";

  return (
    <div className="min-h-screen bg-[#070707] text-white">
      {!hideHeader && (
        <header className="fixed inset-x-0 top-0 z-[2000] border-b border-white/6 bg-[#090909]">
          <div className="mx-auto flex h-[60px] max-w-[1280px] items-center justify-between px-4 sm:px-6">
            <Link to={createPageUrl("Landing")} className="flex items-center gap-3 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600 shadow-lg shadow-red-900/30">🍕</div>
              <div className="min-w-0">
                <div className="truncate text-[1.95rem] font-black tracking-tight leading-none">Pizzapolis</div>
                <div className="hidden text-[12px] leading-none text-stone-400 sm:block">Planes de pizza. Gente nueva.</div>
              </div>
            </Link>

            <div className="hidden items-center gap-2 md:flex">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = currentPageName === item.page;
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    className={`inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-semibold transition ${
                      item.accent
                        ? "bg-red-600 text-white hover:bg-red-500"
                        : active
                          ? "bg-white/10 text-white"
                          : "text-stone-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              {authChecked && user ? <NotificationCenter user={user} /> : <Button variant="ghost" size="icon" className="hidden md:inline-flex"><Bell className="h-4 w-4" /></Button>}
              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-11 w-11 rounded-2xl border border-white/10 bg-white/[0.03] text-stone-100 hover:bg-white/5 hover:text-white">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="z-[2500] w-[320px] border-white/10 bg-[#111] p-0 text-white">
                  <div className="p-6">
                    <div className="mb-8 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600">🍕</div>
                      <div>
                        <div className="text-xl font-black">Pizzapolis</div>
                        <div className="text-[10px] uppercase tracking-[0.18em] text-stone-500">Planes de pizza. Gente nueva.</div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.page}
                            to={createPageUrl(item.page)}
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-stone-300 transition hover:bg-white/5 hover:text-white"
                          >
                            <Icon className="h-4 w-4" />
                            <span>{item.label}</span>
                            <ChevronRight className="ml-auto h-4 w-4 opacity-30" />
                          </Link>
                        );
                      })}
                    </div>
                    <div className="mt-8 rounded-3xl border border-white/8 bg-white/[0.03] p-4">
                      <div className="text-sm font-semibold text-stone-200">Tu cuenta</div>
                      <div className="mt-1 text-sm text-stone-500">{user?.full_name || "Invitado"}</div>
                      <Button onClick={handleLogout} variant="outline" className="mt-4 w-full rounded-2xl border-white/10 bg-transparent text-stone-200 hover:bg-white/5">
                        <LogOut className="mr-2 h-4 w-4" />
                        Cerrar sesión
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </header>
      )}

      <main className={hideHeader ? "" : "pt-[60px] pb-24 md:pb-8"}>{children}</main>

      {!hideHeader && (
        <nav className="fixed inset-x-0 bottom-0 z-[1800] border-t border-white/8 bg-[#090909] md:hidden">
          <div className="grid h-[78px] grid-cols-5 px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = currentPageName === item.page;
              return (
                <Link key={item.page} to={createPageUrl(item.page)} className="flex flex-col items-center justify-center gap-1 text-center">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${item.accent ? "bg-red-600 text-white shadow-lg shadow-red-900/30" : active ? "bg-white/10 text-white" : "text-stone-500"}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={`text-[11px] font-medium ${active || item.accent ? "text-white" : "text-stone-500"}`}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
