import React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  CheckCircle2,
  EyeOff,
  Image as ImageIcon,
  Loader2,
  MapPin,
  MessageSquare,
  Pizza,
  Search,
  Shield,
  Sparkles,
  Trash2,
  UserCog,
  Users,
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { formatPrice } from '@/lib/place-helpers';
import { cn } from '@/lib/utils';

const TAB_ITEMS = [
  { id: 'overview', label: 'Resumen', icon: Sparkles },
  { id: 'spots', label: 'Spots', icon: Pizza },
  { id: 'plans', label: 'Planes', icon: CalendarDays },
  { id: 'comments', label: 'Comentarios', icon: MessageSquare },
  { id: 'photos', label: 'Fotos', icon: ImageIcon },
  { id: 'messages', label: 'Chat', icon: MessageSquare },
  { id: 'users', label: 'Usuarios', icon: UserCog },
];

function AdminActionButton({ onClick, variant = 'neutral', children, disabled = false }) {
  const styles = {
    approve: 'bg-[#216b33] text-white hover:bg-[#195026]',
    hide: 'bg-[#111111] text-white hover:bg-[#262626]',
    danger: 'bg-[#df5b43] text-white hover:bg-[#c84b35]',
    neutral: 'bg-white text-[#111111] hover:bg-[#f7f1e7]',
    warn: 'bg-[#efbf3a] text-[#111111] hover:bg-[#dfb22f]',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-10 items-center justify-center rounded-2xl px-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]}`}
    >
      {children}
    </button>
  );
}

function StatusPill({ tone = 'neutral', children }) {
  const tones = {
    success: 'bg-[#e6f5e8] text-[#216b33] border-[#cdebd3]',
    warn: 'bg-[#fff5d6] text-[#7a5a00] border-[#f1de9d]',
    danger: 'bg-[#fde8e4] text-[#a23c2d] border-[#f2c6bd]',
    dark: 'bg-[#141414] text-white border-[#141414]',
    neutral: 'bg-[#f3ecdf] text-[#141414] border-black/8',
  };

  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ${tones[tone]}`}>{children}</span>;
}

function AdminStat({ label, value, icon: Icon, accent = 'text-[#df5b43]' }) {
  return (
    <div className="rounded-[28px] border border-black/10 bg-[#fffaf1] px-5 py-5 shadow-[0_18px_40px_rgba(39,29,14,0.08)]">
      <div className="text-xs font-black uppercase tracking-[0.18em] text-[#8a8174]">{label}</div>
      <div className="mt-3 flex items-end gap-3">
        <div className="text-4xl font-black text-[#111111]">{value}</div>
        <Icon className={`mb-1 h-5 w-5 ${accent}`} />
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, text }) {
  return (
    <div className="rounded-[24px] border border-dashed border-black/10 bg-[#fbf6ed] px-6 py-12 text-center">
      <Icon className="mx-auto h-10 w-10 text-[#216b33]" />
      <h2 className="mt-4 text-xl font-black text-[#111111]">{title}</h2>
      <p className="mt-2 text-sm text-[#6d665b]">{text}</p>
    </div>
  );
}

function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
}

async function fetchRows(table, select = '*', orderBy = 'created_at') {
  const { data, error } = await supabase.from(table).select(select).order(orderBy, { ascending: false });
  if (error) throw error;
  return data || [];
}

async function deleteRow(table, id) {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw error;
}

async function updateRow(table, id, payload) {
  const { error } = await supabase.from(table).update(payload).eq('id', id);
  if (error) throw error;
}

function useAdminData(enabled) {
  const spotsQuery = useQuery({
    queryKey: ['admin-spots'],
    queryFn: () => fetchRows('spots'),
    enabled,
  });
  const plansQuery = useQuery({
    queryKey: ['admin-plans'],
    queryFn: () => fetchRows('plans'),
    enabled,
  });
  const commentsQuery = useQuery({
    queryKey: ['admin-comments'],
    queryFn: () => fetchRows('spot_comments'),
    enabled,
  });
  const photosQuery = useQuery({
    queryKey: ['admin-photos'],
    queryFn: () => fetchRows('spot_photos'),
    enabled,
  });
  const messagesQuery = useQuery({
    queryKey: ['admin-messages'],
    queryFn: () => fetchRows('messages'),
    enabled,
  });
  const usersQuery = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => fetchRows('profiles', 'id,email,username,avatar_url,role,created_at,updated_at'),
    enabled,
  });

  return {
    spotsQuery,
    plansQuery,
    commentsQuery,
    photosQuery,
    messagesQuery,
    usersQuery,
  };
}

function TableShell({ title, subtitle, actions, children }) {
  return (
    <div className="rounded-[30px] border border-black/10 bg-[#fffaf1] p-5 shadow-[0_20px_50px_rgba(34,25,11,0.10)]">
      <div className="flex flex-col gap-3 border-b border-black/8 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-black tracking-[-0.03em] text-[#111111]">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm text-[#6d665b]">{subtitle}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function RowCard({ title, meta, children, image, pill }) {
  return (
    <div className="rounded-[24px] border border-black/8 bg-white px-4 py-4 shadow-[0_12px_28px_rgba(39,29,14,0.06)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-4">
          {image ? (
            <img src={image} alt="" className="h-20 w-20 shrink-0 rounded-[20px] object-cover" />
          ) : null}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-black text-[#111111]">{title}</h3>
              {pill}
            </div>
            {meta ? <div className="mt-2 space-y-1 text-sm text-[#5d574d]">{meta}</div> : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 lg:justify-end">{children}</div>
      </div>
    </div>
  );
}

export default function Admin() {
  const { role, user, profile } = useAuth();
  const enabled = role === 'admin' && isSupabaseConfigured && Boolean(supabase);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = React.useState('overview');
  const [search, setSearch] = React.useState('');

  const { spotsQuery, plansQuery, commentsQuery, photosQuery, messagesQuery, usersQuery } = useAdminData(enabled);

  const spots = spotsQuery.data || [];
  const plans = plansQuery.data || [];
  const comments = commentsQuery.data || [];
  const photos = photosQuery.data || [];
  const messages = messagesQuery.data || [];
  const users = usersQuery.data || [];

  const loading = spotsQuery.isLoading || plansQuery.isLoading || commentsQuery.isLoading || photosQuery.isLoading || messagesQuery.isLoading || usersQuery.isLoading;

  const userMap = React.useMemo(() => new Map(users.map((item) => [item.id, item])), [users]);
  const spotMap = React.useMemo(() => new Map(spots.map((item) => [item.id, item])), [spots]);

  const pendingSpots = spots.filter((item) => item.status === 'pending');
  const hiddenSpots = spots.filter((item) => item.status === 'hidden');
  const activePlans = plans.filter((item) => item.status === 'active');
  const draftPlans = plans.filter((item) => item.status === 'draft');
  const cancelledPlans = plans.filter((item) => item.status === 'cancelled');
  const pendingComments = comments.filter((item) => item.status === 'pending');
  const pendingPhotos = photos.filter((item) => item.status === 'pending');

  const normalizedSearch = search.trim().toLowerCase();
  const includesSearch = React.useCallback((values) => {
    if (!normalizedSearch) return true;
    return values.join(' ').toLowerCase().includes(normalizedSearch);
  }, [normalizedSearch]);

  const filteredSpots = spots.filter((item) => includesSearch([item.name, item.address, item.best_slice, item.quick_note]));
  const filteredPlans = plans.filter((item) => includesSearch([item.title, item.quick_note, String(item.status)]));
  const filteredComments = comments.filter((item) => includesSearch([item.content, spotMap.get(item.spot_id)?.name, userMap.get(item.user_id)?.email]));
  const filteredPhotos = photos.filter((item) => includesSearch([spotMap.get(item.spot_id)?.name, userMap.get(item.user_id)?.email, item.status]));
  const filteredMessages = messages.filter((item) => includesSearch([item.content, userMap.get(item.user_id)?.email, item.plan_id]));
  const filteredUsers = users.filter((item) => includesSearch([item.email, item.username, item.role]));

  const invalidateAll = React.useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['admin-spots'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-plans'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-comments'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-photos'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-messages'] }),
      queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
    ]);
  }, [queryClient]);

  const spotMutation = useMutation({
    mutationFn: ({ id, payload }) => updateRow('spots', id, payload),
    onSuccess: invalidateAll,
  });
  const planMutation = useMutation({
    mutationFn: ({ id, payload }) => updateRow('plans', id, payload),
    onSuccess: invalidateAll,
  });
  const commentMutation = useMutation({
    mutationFn: ({ id, payload }) => updateRow('spot_comments', id, payload),
    onSuccess: invalidateAll,
  });
  const photoMutation = useMutation({
    mutationFn: ({ id, payload }) => updateRow('spot_photos', id, payload),
    onSuccess: invalidateAll,
  });
  const deleteMutation = useMutation({
    mutationFn: ({ table, id }) => deleteRow(table, id),
    onSuccess: invalidateAll,
  });

  const moderationPayload = React.useCallback((status) => ({
    status,
    reviewed_by: profile?.id || user?.id || null,
    reviewed_at: new Date().toISOString(),
  }), [profile?.id, user?.id]);

  if (!enabled) {
    return (
      <div className="admin-screen grid min-h-[calc(100vh-64px)] place-items-center bg-[#f4efe6] px-4 py-6">
        <div className="rounded-[28px] border border-black/10 bg-[#fffaf1] px-6 py-10 text-center shadow-[0_24px_60px_rgba(34,25,11,0.12)]">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#111111] text-[#f0bf39]"><Shield className="h-6 w-6" /></div>
          <h1 className="text-2xl font-black text-[#111111]">Zona solo para administradores</h1>
          <p className="mt-2 text-sm text-[#6d665b]">Necesitas un usuario con role = admin en profiles para entrar aquí.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-screen min-h-[calc(100vh-64px)] bg-[#f4efe6] px-3 py-3 text-[#111111] sm:px-4">
      <div className="mx-auto max-w-7xl space-y-5">
        <div className="rounded-[34px] border border-black/10 bg-[linear-gradient(180deg,#fffaf1_0%,#f8f1e6_100%)] px-5 py-6 shadow-[0_24px_60px_rgba(34,25,11,0.10)] md:px-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#216b33]">
                <Sparkles className="h-3.5 w-3.5" /> administración
              </div>
              <h1 className="mt-4 text-[clamp(2rem,4vw,3.4rem)] font-black leading-none tracking-[-0.06em]">Admin integrado con Supabase</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-[#6d665b]">
                Desde aquí moderas spots, planes, comentarios, fotos, chat y usuarios usando las tablas reales de Supabase. Si tu cuenta tiene role = admin, el acceso aparece automáticamente.
              </p>
            </div>
            <div className="rounded-[28px] border border-black/10 bg-white px-5 py-4 shadow-[0_18px_40px_rgba(39,29,14,0.08)]">
              <div className="text-xs font-black uppercase tracking-[0.18em] text-[#8a8174]">Sesión actual</div>
              <div className="mt-2 text-base font-bold">{user?.email}</div>
              <div className="mt-1 text-sm text-[#6d665b]">Role: {role}</div>
              <div className="mt-3 text-xs text-[#8a8174]">Supabase: {isSupabaseConfigured ? 'configurado' : 'sin configurar'}</div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <AdminStat label="Spots pendientes" value={pendingSpots.length} icon={Pizza} accent="text-[#df5b43]" />
          <AdminStat label="Comentarios pendientes" value={pendingComments.length} icon={MessageSquare} accent="text-[#216b33]" />
          <AdminStat label="Fotos pendientes" value={pendingPhotos.length} icon={ImageIcon} accent="text-[#111111]" />
          <AdminStat label="Planes activos" value={activePlans.length} icon={CalendarDays} accent="text-[#df5b43]" />
        </div>

        <div className="rounded-[30px] border border-black/10 bg-[#fffaf1] p-4 shadow-[0_20px_50px_rgba(34,25,11,0.10)]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              {TAB_ITEMS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveTab(id)}
                  className={cn(
                    'inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-bold transition',
                    activeTab === id ? 'bg-[#111111] text-white shadow-[0_12px_32px_rgba(17,17,17,0.18)]' : 'bg-[#f0e8dc] text-[#5d574d] hover:bg-[#eadfcc]'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-[320px]">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a8174]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar en admin"
                className="h-11 w-full rounded-2xl border border-black/10 bg-white pl-11 pr-4 text-sm text-[#111111] outline-none transition focus:border-[#efbf3a]"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid min-h-[320px] place-items-center rounded-[30px] border border-black/10 bg-[#fffaf1]">
            <Loader2 className="h-8 w-8 animate-spin text-[#111111]" />
          </div>
        ) : null}

        {!loading && activeTab === 'overview' ? (
          <div className="grid gap-5 xl:grid-cols-[1.15fr,0.85fr]">
            <TableShell title="Cola de revisión" subtitle="Lo primero que deberías revisar ahora mismo.">
              <div className="grid gap-3">
                {[...pendingSpots.slice(0, 3).map((item) => ({ type: 'Spot', id: item.id, title: item.name, extra: item.address })),
                  ...pendingComments.slice(0, 3).map((item) => ({ type: 'Comentario', id: item.id, title: spotMap.get(item.spot_id)?.name || 'Spot', extra: item.content })),
                  ...pendingPhotos.slice(0, 3).map((item) => ({ type: 'Foto', id: item.id, title: spotMap.get(item.spot_id)?.name || 'Spot', extra: item.photo_url }))]
                  .slice(0, 6)
                  .map((item) => (
                    <div key={`${item.type}-${item.id}`} className="rounded-[22px] border border-black/8 bg-white px-4 py-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="text-[11px] font-black uppercase tracking-[0.14em] text-[#8a8174]">{item.type}</div>
                          <div className="mt-1 text-base font-black text-[#111111]">{item.title}</div>
                          <div className="mt-1 text-sm text-[#6d665b] line-clamp-2">{item.extra}</div>
                        </div>
                        <StatusPill tone="warn">pendiente</StatusPill>
                      </div>
                    </div>
                  ))}
              </div>
            </TableShell>

            <TableShell title="Estado general" subtitle="Visión rápida del contenido moderable y de la comunidad.">
              <div className="grid gap-3">
                <div className="rounded-[22px] border border-black/8 bg-white px-4 py-4 text-sm text-[#5d574d]">
                  <div className="font-black text-[#111111]">Spots aprobados</div>
                  <div className="mt-1 text-3xl font-black text-[#111111]">{spots.filter((item) => item.status === 'approved').length}</div>
                </div>
                <div className="rounded-[22px] border border-black/8 bg-white px-4 py-4 text-sm text-[#5d574d]">
                  <div className="font-black text-[#111111]">Planes borrador / cancelados</div>
                  <div className="mt-1 text-3xl font-black text-[#111111]">{draftPlans.length + cancelledPlans.length}</div>
                </div>
                <div className="rounded-[22px] border border-black/8 bg-white px-4 py-4 text-sm text-[#5d574d]">
                  <div className="font-black text-[#111111]">Mensajes en grupos</div>
                  <div className="mt-1 text-3xl font-black text-[#111111]">{messages.length}</div>
                </div>
                <div className="rounded-[22px] border border-black/8 bg-white px-4 py-4 text-sm text-[#5d574d]">
                  <div className="font-black text-[#111111]">Usuarios registrados</div>
                  <div className="mt-1 text-3xl font-black text-[#111111]">{users.length}</div>
                </div>
              </div>
            </TableShell>
          </div>
        ) : null}

        {!loading && activeTab === 'spots' ? (
          <TableShell title="Spots" subtitle={`Pendientes: ${pendingSpots.length} · Hidden: ${hiddenSpots.length}`}>
            {filteredSpots.length ? (
              <div className="grid gap-3">
                {filteredSpots.map((spot) => {
                  const creator = userMap.get(spot.created_by);
                  const reviewer = userMap.get(spot.reviewed_by);
                  return (
                    <RowCard
                      key={spot.id}
                      title={spot.name}
                      image={spot.photo_url || undefined}
                      pill={<StatusPill tone={spot.status === 'approved' ? 'success' : spot.status === 'hidden' ? 'dark' : 'warn'}>{spot.status}</StatusPill>}
                      meta={(
                        <>
                          <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[#8a8174]" />{spot.address}</div>
                          <div>Slice price: <strong>{formatPrice(spot.slice_price)}</strong>{spot.best_slice ? ` · Best slice: ${spot.best_slice}` : ''}</div>
                          <div>Created by: {creator?.email || '—'} · Created: {formatDateTime(spot.created_at)}</div>
                          {reviewer ? <div>Reviewed by: {reviewer.email} · {formatDateTime(spot.reviewed_at)}</div> : null}
                          {spot.quick_note ? <div className="text-[#6d665b]">{spot.quick_note}</div> : null}
                        </>
                      )}
                    >
                      <AdminActionButton variant="approve" onClick={() => spotMutation.mutate({ id: spot.id, payload: moderationPayload('approved') })}><CheckCircle2 className="mr-2 h-4 w-4" />Approve</AdminActionButton>
                      <AdminActionButton variant="hide" onClick={() => spotMutation.mutate({ id: spot.id, payload: moderationPayload('hidden') })}><EyeOff className="mr-2 h-4 w-4" />Hide</AdminActionButton>
                      <AdminActionButton variant="danger" onClick={() => deleteMutation.mutate({ table: 'spots', id: spot.id })}><Trash2 className="mr-2 h-4 w-4" />Delete</AdminActionButton>
                    </RowCard>
                  );
                })}
              </div>
            ) : <EmptyState icon={Pizza} title="No spots yet" text="Cuando haya spots en Supabase aparecerán aquí para revisar, aprobar u ocultar." />}
          </TableShell>
        ) : null}

        {!loading && activeTab === 'plans' ? (
          <TableShell title="Planes" subtitle={`Activos: ${activePlans.length} · Drafts: ${draftPlans.length} · Cancelados: ${cancelledPlans.length}`}>
            {filteredPlans.length ? (
              <div className="grid gap-3">
                {filteredPlans.map((plan) => {
                  const creator = userMap.get(plan.created_by);
                  const linkedSpot = spotMap.get(plan.spot_id);
                  return (
                    <RowCard
                      key={plan.id}
                      title={plan.title}
                      image={linkedSpot?.photo_url || undefined}
                      pill={<StatusPill tone={plan.status === 'active' ? 'success' : plan.status === 'draft' ? 'warn' : 'dark'}>{plan.status}</StatusPill>}
                      meta={(
                        <>
                          <div>{linkedSpot?.name || 'No linked spot'}{linkedSpot?.address ? ` · ${linkedSpot.address}` : ''}</div>
                          <div>{plan.plan_date} · {plan.plan_time} · Max people: {plan.max_people}</div>
                          <div>Created by: {creator?.email || '—'} · {formatDateTime(plan.created_at)}</div>
                          {plan.quick_note ? <div className="text-[#6d665b]">{plan.quick_note}</div> : null}
                        </>
                      )}
                    >
                      <AdminActionButton variant="approve" onClick={() => planMutation.mutate({ id: plan.id, payload: { status: 'active' } })}>Activate</AdminActionButton>
                      <AdminActionButton variant="warn" onClick={() => planMutation.mutate({ id: plan.id, payload: { status: 'draft' } })}>Draft</AdminActionButton>
                      <AdminActionButton variant="hide" onClick={() => planMutation.mutate({ id: plan.id, payload: { status: 'cancelled' } })}>Cancel</AdminActionButton>
                      <AdminActionButton variant="danger" onClick={() => deleteMutation.mutate({ table: 'plans', id: plan.id })}>Delete</AdminActionButton>
                    </RowCard>
                  );
                })}
              </div>
            ) : <EmptyState icon={CalendarDays} title="No plans yet" text="Los planes creados por los usuarios aparecerán aquí para activarlos, moverlos a draft o cancelarlos." />}
          </TableShell>
        ) : null}

        {!loading && activeTab === 'comments' ? (
          <TableShell title="Comentarios" subtitle={`Pendientes: ${pendingComments.length}`}>
            {filteredComments.length ? (
              <div className="grid gap-3">
                {filteredComments.map((comment) => {
                  const author = userMap.get(comment.user_id);
                  const linkedSpot = spotMap.get(comment.spot_id);
                  return (
                    <RowCard
                      key={comment.id}
                      title={linkedSpot?.name || 'Spot'}
                      pill={<StatusPill tone={comment.status === 'approved' ? 'success' : comment.status === 'hidden' ? 'dark' : 'warn'}>{comment.status}</StatusPill>}
                      meta={(
                        <>
                          <div>By: {author?.email || '—'} · {formatDateTime(comment.created_at)}</div>
                          <div className="text-[#111111]">{comment.content}</div>
                        </>
                      )}
                    >
                      <AdminActionButton variant="approve" onClick={() => commentMutation.mutate({ id: comment.id, payload: moderationPayload('approved') })}>Approve</AdminActionButton>
                      <AdminActionButton variant="hide" onClick={() => commentMutation.mutate({ id: comment.id, payload: moderationPayload('hidden') })}>Hide</AdminActionButton>
                      <AdminActionButton variant="danger" onClick={() => deleteMutation.mutate({ table: 'spot_comments', id: comment.id })}>Delete</AdminActionButton>
                    </RowCard>
                  );
                })}
              </div>
            ) : <EmptyState icon={MessageSquare} title="No comments yet" text="Los comentarios moderables aparecerán aquí para aprobarlos o ocultarlos." />}
          </TableShell>
        ) : null}

        {!loading && activeTab === 'photos' ? (
          <TableShell title="Fotos" subtitle={`Pendientes: ${pendingPhotos.length}`}>
            {filteredPhotos.length ? (
              <div className="grid gap-3">
                {filteredPhotos.map((photo) => {
                  const author = userMap.get(photo.user_id);
                  const linkedSpot = spotMap.get(photo.spot_id);
                  return (
                    <RowCard
                      key={photo.id}
                      title={linkedSpot?.name || 'Spot'}
                      image={photo.photo_url}
                      pill={<StatusPill tone={photo.status === 'approved' ? 'success' : photo.status === 'hidden' ? 'dark' : 'warn'}>{photo.status}</StatusPill>}
                      meta={(
                        <>
                          <div>By: {author?.email || '—'} · {formatDateTime(photo.created_at)}</div>
                          <div className="break-all text-[#6d665b]">{photo.photo_url}</div>
                        </>
                      )}
                    >
                      <AdminActionButton variant="approve" onClick={() => photoMutation.mutate({ id: photo.id, payload: moderationPayload('approved') })}>Approve</AdminActionButton>
                      <AdminActionButton variant="hide" onClick={() => photoMutation.mutate({ id: photo.id, payload: moderationPayload('hidden') })}>Hide</AdminActionButton>
                      <AdminActionButton variant="danger" onClick={() => deleteMutation.mutate({ table: 'spot_photos', id: photo.id })}>Delete</AdminActionButton>
                    </RowCard>
                  );
                })}
              </div>
            ) : <EmptyState icon={ImageIcon} title="No photos yet" text="Las fotos enviadas por usuarios aparecerán aquí para aprobarlas, ocultarlas o borrarlas." />}
          </TableShell>
        ) : null}

        {!loading && activeTab === 'messages' ? (
          <TableShell title="Chat" subtitle="Mensajes de grupos almacenados en la tabla messages.">
            {filteredMessages.length ? (
              <div className="grid gap-3">
                {filteredMessages.map((message) => {
                  const author = userMap.get(message.user_id);
                  const linkedPlan = plans.find((item) => item.id === message.plan_id);
                  return (
                    <RowCard
                      key={message.id}
                      title={linkedPlan?.title || 'Plan'}
                      pill={<StatusPill tone="neutral">message</StatusPill>}
                      meta={(
                        <>
                          <div>By: {author?.email || '—'} · {formatDateTime(message.created_at)}</div>
                          <div className="text-[#111111]">{message.content}</div>
                        </>
                      )}
                    >
                      <AdminActionButton variant="danger" onClick={() => deleteMutation.mutate({ table: 'messages', id: message.id })}>Delete</AdminActionButton>
                    </RowCard>
                  );
                })}
              </div>
            ) : <EmptyState icon={MessageSquare} title="No messages yet" text="Los mensajes de grupo aparecerán aquí para moderación puntual si hace falta." />}
          </TableShell>
        ) : null}

        {!loading && activeTab === 'users' ? (
          <TableShell title="Usuarios" subtitle="Listado básico de perfiles y roles.">
            {filteredUsers.length ? (
              <div className="grid gap-3">
                {filteredUsers.map((person) => (
                  <RowCard
                    key={person.id}
                    title={person.username || person.email || 'User'}
                    pill={<StatusPill tone={person.role === 'admin' ? 'dark' : 'neutral'}>{person.role || 'user'}</StatusPill>}
                    meta={(
                      <>
                        <div>{person.email || '—'}</div>
                        <div>Created: {formatDateTime(person.created_at)}</div>
                        <div>Updated: {formatDateTime(person.updated_at)}</div>
                      </>
                    )}
                  >
                    {person.role !== 'admin' ? (
                      <AdminActionButton variant="warn" onClick={() => updateRow('profiles', person.id, { role: 'admin' }).then(invalidateAll)}>Make admin</AdminActionButton>
                    ) : (
                      <AdminActionButton variant="hide" onClick={() => updateRow('profiles', person.id, { role: 'user' }).then(invalidateAll)} disabled={person.id === profile?.id}>Remove admin</AdminActionButton>
                    )}
                  </RowCard>
                ))}
              </div>
            ) : <EmptyState icon={Users} title="No users yet" text="Los perfiles de Supabase aparecerán aquí para revisar roles y moderación." />}
          </TableShell>
        ) : null}
      </div>
    </div>
  );
}
