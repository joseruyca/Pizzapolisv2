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
    { label: 'Add Site', page: 'CrearQuedada', icon: PlusCircle, accent: true },
    { label: 'Mis grupos', page: 'MisMatches', icon: Users },
    { label: 'Perfil', page: 'Profile', icon: User },
  ];

  const navItems = [...publicNavItems, ...privateNavItems];
  const menuItems = role === 'admin' && isAuthenticated ? [...navItems, { label: 'Admin', page: 'Admin', icon: Shield }] : navItems;
  const hideHeader = currentPageName === 'Landing' || currentPageName === 'Descubrir';
  const hideBottomNav = currentPageName === 'Descubrir';

  return (
    <div className="app-shell">
      {!hideHeader && (
        <header className="app-header">
          <div className="app-header-inner">
            <Link to={createPageUrl('Landing')} className="app-brand no-tap-highlight">
              <div className="app-brand-mark">🍕</div>
              <div className="min-w-0">
                <div className="app-brand-title">Pizzapolis</div>
                <div className="app-brand-subtitle">Planes de pizza. Gente nueva.</div>
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
                        ? 'bg-red-600 text-white hover:bg-red-500'
                        : active
                          ? 'bg-white/10 text-white'
                          : 'text-stone-400 hover:bg-white/5 hover:text-white'
                    }`}
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
                <Button variant="ghost" size="icon" className="hidden md:inline-flex">
                  <Bell className="h-4 w-4" />
                </Button>
              )}
              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-11 w-11 rounded-2xl border border-white/10 bg-white/[0.03] text-stone-100 hover:bg-white/5 hover:text-white">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="z-[2500] w-[320px] border-white/10 bg-[#111] p-0 text-white">
                  <div className="p-6">
                    <div className="mb-8 flex items-center gap-3">
                      <div className="app-brand-mark">🍕</div>
                      <div>
                        <div className="text-xl font-black">Pizzapolis</div>
                        <div className="text-[10px] uppercase tracking-[0.18em] text-stone-500">Planes de pizza. Gente nueva.</div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {menuItems.map((item) => {
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
                      <div className="text-sm font-semibold text-stone-200">{isAuthenticated ? 'Tu cuenta' : 'Explora sin cuenta'}</div>
                      <div className="mt-1 text-sm text-stone-500">{user?.full_name || user?.email || 'Puedes explorar el mapa sin registrarte. Entra para crear planes, usar grupos y tu perfil.'}</div>
                      {isAuthenticated ? (
                        <Button onClick={logout} variant="outline" className="mt-4 w-full rounded-2xl border-white/10 bg-transparent text-stone-200 hover:bg-white/5">
                          <LogOut className="mr-2 h-4 w-4" />
                          Cerrar sesión
                        </Button>
                      ) : (
                        <Link
                          to="/auth"
                          onClick={() => setMenuOpen(false)}
                          className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-2xl bg-red-600 text-sm font-bold text-white hover:bg-red-500"
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
                <Link key={item.page} to={createPageUrl(item.page)} className="flex flex-col items-center justify-center gap-1 text-center no-tap-highlight">
                  <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${item.accent ? 'bg-red-600 text-white shadow-lg shadow-red-900/30' : active ? 'bg-white/10 text-white' : 'text-stone-500'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={`text-[11px] font-medium ${active || item.accent ? 'text-white' : 'text-stone-500'}`}>{item.label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
