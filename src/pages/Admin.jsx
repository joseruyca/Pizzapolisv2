import React from 'react';
import { Shield, Database, Users, MapPinned, MessageSquare, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const cards = [
  {
    title: 'Spots',
    description: 'Move the public pizza map to Supabase and remove all local fallback content.',
    icon: MapPinned,
  },
  {
    title: 'Plans',
    description: 'Store real plans, membership and discovery state in Supabase.',
    icon: Users,
  },
  {
    title: 'Messages',
    description: 'Attach real chat threads to plan membership instead of local browser data.',
    icon: MessageSquare,
  },
  {
    title: 'Moderation',
    description: 'Keep this area for admin-only tools once real content tables are live.',
    icon: Shield,
  },
];

export default function Admin() {
  const { role, user } = useAuth();

  if (role !== 'admin') {
    return <div className="min-h-screen bg-[#080808] pt-14 grid place-items-center text-stone-400">No tienes acceso a esta zona.</div>;
  }

  return (
    <div className="min-h-screen bg-[#080808] pt-14 pb-20 px-4 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="rounded-[32px] border border-white/10 bg-[#111] p-6 shadow-2xl shadow-black/30">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600/15 text-red-400">
              <Shield className="h-7 w-7" />
            </div>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-red-300">Admin</div>
              <h1 className="mt-1 text-3xl font-black tracking-tight">Clean admin base</h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-stone-400">
                Signed in as {user?.email}. Demo moderation panels have been removed so this area only reflects the real product roadmap.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-[28px] border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="h-4 w-4" />
              Admin access is now role-based from profiles.role
            </div>
            <p className="mt-2 text-emerald-50/85">
              Use Supabase to set your user as admin in the profiles table. The route remains protected in the app.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.title} className="rounded-[28px] border border-white/10 bg-[#111] p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.04] text-stone-200">
                  <Icon className="h-5 w-5" />
                </div>
                <h2 className="mt-4 text-xl font-bold">{card.title}</h2>
                <p className="mt-2 text-sm leading-7 text-stone-400">{card.description}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-6 rounded-[28px] border border-white/10 bg-[#111] p-5">
          <div className="flex items-center gap-3 text-stone-100">
            <Database className="h-5 w-5 text-red-400" />
            <h2 className="text-lg font-bold">Next real migration</h2>
          </div>
          <ul className="mt-4 grid gap-3 text-sm text-stone-400">
            <li>• spots</li>
            <li>• plans</li>
            <li>• plan_members</li>
            <li>• messages</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
