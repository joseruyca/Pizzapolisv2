import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Map, Flame, PlusCircle, Users, User, Menu, LogOut, Bell, ChevronRight, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import NotificationCenter from '@/components/NotificationCenter';
import { useAuth } from '@/lib/AuthContext';

export default function Layout({ children, currentPageName }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, role, logout, isAuthenticated } = useAuth();

  const publicNavItems = [
    { label: 'Mapa', page: 'Home', icon: Map },
    { label: 'Descubrir', page: 'Descubrir', icon: Flame },
  ];

  const privateNavItems = [
    { label: 'Add Plan', page: 'CrearQuedada', icon: PlusCircle, accent: true },
    { label: 'Mis grupos', page: 'MisMatches', icon: Users },
    { label: 'Perfil', page: 'Profile', icon: User },
  ];

  const navItems = [...publicNavItems, ...privateNavItems];
  const menuItems = role === 'admin' && isAuthenticated ? [...navItems, { label: 'Admin', page: 'Admin', icon: Shield }] : navItems;
  const hideHeader = currentPageName === 'Landing' || currentPageName === 'Descubrir';
  const hideBottomNav = currentPageName === 'Descubrir';
  const publicPages = new Set(['Landing', 'Home', 'Descubrir']);

  const navTarget = (page) => {
    if (publicPages.has(page) || isAuthenticated) return createPageUrl(page);
    return `/auth?next=${encodeURIComponent(createPageUrl(page))}`;
  };

  const navClass = (active, accent = false) => {
    if (accent) return 'bg-[#e25545] text-white shadow-[0_12px_32px_rgba(226,85,69,0.24)] hover:bg-[#cf493a]';
    if (active) return 'bg-white text-[#141414] shadow-[0_12px_28px_rgba(20,20,20,0.08)]';
    return 'text-[#5e574d] hover:bg-white/80 hover:text-[#141414]';
  };

  return (
    <div className="app-shell">
      {!hideHeader && (
        <header className="app-header">
          <div className="app-header-inner">
            <Link to={createPageUrl('Landing')} className="app-brand no-tap-highlight">
              <div className="app-brand-mark">🍕</div>
              <div className="min-w-0">
                <div className="app-brand-title">Pizzapolis</div>
                <div className="app-brand-subtitle">Mapa social de slices y planes</div>
              </div>
            </Link>

            <div className="hidden items-center gap-2 md:flex">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = currentPageName === item.page;
                return (
                  <Link
                    key={item.page}
                    to={navTarget(item.page)}
                    className={`inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-semibold transition ${navClass(active, item.accent)}`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              {user ? (
                <NotificationCenter user={user} />
              ) : (
                <Button variant="ghost" size="icon" className="hidden h-11 w-11 rounded-2xl border border-black/10 bg-white/50 text-[#141414] hover:bg-white md:inline-flex">
                  <Bell className="h-4 w-4" />
                </Button>
              )}
              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-11 w-11 rounded-2xl border border-black/10 bg-white/55 text-[#141414] hover:bg-white">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="z-[2500] w-[340px] border-black/10 bg-[#fff9f0] p-0 text-[#141414]">
                  <div className="p-6">
                    <div className="mb-8 flex items-center gap-3">
                      <div className="app-brand-mark">🍕</div>
                      <div>
                        <div className="text-2xl font-black">Pizzapolis</div>
                        <div className="text-[11px] uppercase tracking-[0.18em] text-[#8a8174]">Planes de pizza. Gente nueva.</div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      {menuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.page}
                            to={navTarget(item.page)}
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-[#292621] transition hover:bg-white hover:text-[#141414]"
                          >
                            <Icon className="h-4 w-4" />
                            <span>{item.label}</span>
                            <ChevronRight className="ml-auto h-4 w-4 opacity-40" />
                          </Link>
                        );
                      })}
                    </div>

                    <div className="mt-8 rounded-[28px] border border-black/8 bg-[#f4ede2] p-5 shadow-[0_18px_40px_rgba(39,29,14,0.08)]">
                      <div className="text-base font-bold text-[#141414]">{isAuthenticated ? 'Tu cuenta' : 'Explora sin cuenta'}</div>
                      <div className="mt-2 text-sm leading-6 text-[#6d665b]">
                        {user?.full_name || user?.email || 'Puedes explorar el mapa sin registrarte. Entra para crear planes, usar grupos y gestionar tu perfil.'}
                      </div>
                      {isAuthenticated ? (
                        <Button onClick={logout} variant="outline" className="mt-4 h-12 w-full rounded-2xl border-black/10 bg-white text-[#141414] hover:bg-[#fffdf8]">
                          <LogOut className="mr-2 h-4 w-4" />
                          Cerrar sesión
                        </Button>
                      ) : (
                        <Link
                          to="/auth"
                          onClick={() => setMenuOpen(false)}
                          className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[#e25545] text-sm font-bold text-white hover:bg-[#cf493a]"
                        >
                          Entrar / Crear cuenta
                        </Link>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </header>
      )}
      <main className={hideHeader ? '' : 'app-content'}>{children}</main>
      {!hideHeader && !hideBottomNav && (
        <nav className="mobile-tabbar">
          <div className="mobile-tabbar-grid">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = currentPageName === item.page;
              return (
                <Link key={item.page} to={navTarget(item.page)} className="flex flex-col items-center justify-center gap-1 text-center no-tap-highlight">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl transition ${item.accent ? 'bg-[#e25545] text-white shadow-[0_12px_30px_rgba(226,85,69,0.22)]' : active ? 'bg-white text-[#141414] shadow-[0_12px_24px_rgba(20,20,20,0.08)]' : 'text-[#786f61]'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={`text-[11px] font-medium ${active || item.accent ? 'text-[#141414]' : 'text-[#786f61]'}`}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
