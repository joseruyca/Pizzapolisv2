import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Loader2, CheckCircle2, EyeOff, Trash2, Image as ImageIcon, MessageSquare, Pizza, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

function AdminActionButton({ onClick, variant = 'neutral', children }) {
  const styles = {
    approve: 'bg-[#2f8f46] text-white hover:bg-[#216b33]',
    hide: 'bg-[#111111] text-white hover:bg-[#252525]',
    danger: 'bg-[#df5b43] text-white hover:bg-[#c84b35]',
    neutral: 'bg-white text-[#111111] hover:bg-[#f7f1e7]',
  };

  return (
    <button onClick={onClick} className={`inline-flex h-10 items-center justify-center rounded-2xl px-3 text-sm font-semibold transition ${styles[variant]}`}>
      {children}
    </button>
  );
}

export default function Admin() {
  const { role, user } = useAuth();
  const [activeTab, setActiveTab] = React.useState('comments');
  const queryClient = useQueryClient();
  const enabled = role === 'admin';

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ['admin-comments'],
    queryFn: () => base44.asServiceRole.entities.Comment.list('-created_date', 100),
    enabled,
  });
  const { data: photos = [], isLoading: photosLoading } = useQuery({
    queryKey: ['admin-photos'],
    queryFn: () => base44.asServiceRole.entities.Photo.list('-created_date', 100),
    enabled,
  });
  const { data: places = [] } = useQuery({
    queryKey: ['admin-places'],
    queryFn: () => base44.asServiceRole.entities.PizzaPlace.list('-created_date', 100),
    enabled,
  });

  const pendingComments = comments.filter((c) => c.status !== 'visible');
  const pendingPhotos = photos.filter((p) => p.status !== 'visible');

  const updateCommentMutation = useMutation({
    mutationFn: ({ id, status }) => base44.asServiceRole.entities.Comment.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-comments'] }),
  });
  const updatePhotoMutation = useMutation({
    mutationFn: ({ id, status }) => base44.asServiceRole.entities.Photo.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-photos'] }),
  });
  const deleteCommentMutation = useMutation({
    mutationFn: (id) => base44.asServiceRole.entities.Comment.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-comments'] }),
  });
  const deletePhotoMutation = useMutation({
    mutationFn: (id) => base44.asServiceRole.entities.Photo.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-photos'] }),
  });

  if (!enabled) {
    return <div className="admin-screen grid place-items-center bg-[#f4efe6] px-4"><div className="rounded-[28px] border border-black/10 bg-[#fffaf1] px-6 py-10 text-center shadow-[0_24px_60px_rgba(34,25,11,0.12)]"><div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#111111] text-[#f0bf39]"><Shield className="h-6 w-6" /></div><h1 className="text-2xl font-black text-[#111111]">Zona solo para administradores</h1><p className="mt-2 text-sm text-[#6d665b]">Necesitas un usuario con role = admin para entrar aquí.</p></div></div>;
  }

  const tabItems = [
    { id: 'comments', label: 'Comentarios', count: pendingComments.length, icon: MessageSquare },
    { id: 'photos', label: 'Fotos', count: pendingPhotos.length, icon: ImageIcon },
  ];

  const currentList = activeTab === 'comments' ? pendingComments : pendingPhotos;
  const currentLoading = activeTab === 'comments' ? commentsLoading : photosLoading;

  return (
    <div className="admin-screen bg-[#f4efe6] text-[#111111]">
      <div className="admin-shell">
        <div className="admin-hero">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#fffaf1] px-3 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-[#216b33]">
              <Sparkles className="h-3.5 w-3.5" /> administración
            </div>
            <h1 className="mt-4 text-[clamp(2rem,4vw,3.4rem)] font-black leading-none tracking-[-0.06em]">Panel de moderación</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[#6d665b]">Revisa comentarios, fotos y contenido pendiente sin pelearte con una interfaz vieja. Este panel queda aislado del resto de pantallas para que futuros cambios no rompan la moderación.</p>
          </div>
          <div className="rounded-[28px] border border-black/10 bg-[#fffaf1] px-5 py-4 shadow-[0_18px_40px_rgba(39,29,14,0.08)]">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-[#8a8174]">Sesión actual</div>
            <div className="mt-2 text-base font-bold">{user?.email}</div>
            <div className="mt-1 text-sm text-[#6d665b]">Role: {role}</div>
          </div>
        </div>

        <div className="admin-grid">
          <div className="admin-stat"><div className="text-xs font-black uppercase tracking-[0.18em] text-[#8a8174]">Comentarios pendientes</div><div className="mt-3 flex items-end gap-3"><div className="text-4xl font-black text-[#111111]">{pendingComments.length}</div><MessageSquare className="mb-1 h-5 w-5 text-[#df5b43]" /></div></div>
          <div className="admin-stat"><div className="text-xs font-black uppercase tracking-[0.18em] text-[#8a8174]">Fotos pendientes</div><div className="mt-3 flex items-end gap-3"><div className="text-4xl font-black text-[#111111]">{pendingPhotos.length}</div><ImageIcon className="mb-1 h-5 w-5 text-[#2f8f46]" /></div></div>
          <div className="admin-stat"><div className="text-xs font-black uppercase tracking-[0.18em] text-[#8a8174]">Spots totales</div><div className="mt-3 flex items-end gap-3"><div className="text-4xl font-black text-[#111111]">{places.length}</div><Pizza className="mb-1 h-5 w-5 text-[#f0bf39]" /></div></div>
        </div>

        <div className="admin-panel mt-5">
          <div className="border-b border-black/8 px-4 py-4 sm:px-6">
            <div className="flex flex-wrap items-center gap-2">
              {tabItems.map(({ id, label, count, icon: Icon }) => (
                <button key={id} onClick={() => setActiveTab(id)} className={`inline-flex h-11 items-center gap-2 rounded-2xl px-4 text-sm font-semibold transition ${activeTab === id ? 'bg-[#111111] text-white' : 'bg-[#f3ecdf] text-[#111111] hover:bg-[#ece2cf]'}`}>
                  <Icon className="h-4 w-4" />
                  {label}
                  {count > 0 ? <span className={`inline-flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-bold ${activeTab === id ? 'bg-white/15 text-white' : 'bg-white text-[#111111]'}`}>{count}</span> : null}
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 py-4 sm:px-6">
            {currentLoading ? (
              <div className="grid place-items-center py-12"><Loader2 className="h-8 w-8 animate-spin text-[#111111]" /></div>
            ) : currentList.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-black/10 bg-[#fbf6ed] px-6 py-12 text-center">
                <CheckCircle2 className="mx-auto h-10 w-10 text-[#2f8f46]" />
                <h2 className="mt-4 text-xl font-black text-[#111111]">Nada pendiente aquí</h2>
                <p className="mt-2 text-sm text-[#6d665b]">Todo lo de esta pestaña ya está moderado.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeTab === 'comments' && pendingComments.map((comment) => (
                  <div key={comment.id} className="rounded-[24px] border border-black/8 bg-white p-4 shadow-[0_12px_30px_rgba(34,25,11,0.06)] sm:p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="text-xs font-black uppercase tracking-[0.16em] text-[#8a8174]">Comentario pendiente</div>
                        <div className="mt-2 text-base font-bold">{comment.user_name || 'Usuario'}</div>
                        <div className="mt-1 text-sm text-[#6d665b]">{comment.user_email}</div>
                        <div className="mt-2 inline-flex rounded-full border border-black/8 bg-[#f7f1e7] px-3 py-1 text-xs font-semibold text-[#111111]">{places.find((p) => p.id === comment.place_id)?.name || 'Spot sin nombre'}</div>
                      </div>
                      <div className="flex flex-wrap gap-2 sm:justify-end">
                        <AdminActionButton variant="approve" onClick={() => updateCommentMutation.mutate({ id: comment.id, status: 'visible' })}>Aprobar</AdminActionButton>
                        <AdminActionButton variant="hide" onClick={() => updateCommentMutation.mutate({ id: comment.id, status: 'hidden' })}><EyeOff className="mr-2 h-4 w-4" />Ocultar</AdminActionButton>
                        <AdminActionButton variant="danger" onClick={() => deleteCommentMutation.mutate(comment.id)}><Trash2 className="mr-2 h-4 w-4" />Eliminar</AdminActionButton>
                      </div>
                    </div>
                    <p className="mt-4 rounded-[20px] border border-black/8 bg-[#fffaf1] px-4 py-4 text-sm leading-7 text-[#111111]">{comment.text || comment.texto}</p>
                  </div>
                ))}

                {activeTab === 'photos' && pendingPhotos.map((photo) => (
                  <div key={photo.id} className="rounded-[24px] border border-black/8 bg-white p-4 shadow-[0_12px_30px_rgba(34,25,11,0.06)] sm:p-5">
                    <div className="flex flex-col gap-4 md:flex-row">
                      <img src={photo.file_url || photo.image_url || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=400&auto=format&fit=crop'} alt="" className="h-40 w-full rounded-[20px] object-cover md:h-32 md:w-40 md:shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-black uppercase tracking-[0.16em] text-[#8a8174]">Foto pendiente</div>
                        <div className="mt-2 text-base font-bold">{photo.user_name || 'Usuario'}</div>
                        <div className="mt-1 text-sm text-[#6d665b]">{photo.user_email}</div>
                        <div className="mt-2 inline-flex rounded-full border border-black/8 bg-[#f7f1e7] px-3 py-1 text-xs font-semibold text-[#111111]">{places.find((p) => p.id === photo.place_id)?.name || 'Spot sin nombre'}</div>
                        {photo.caption ? <p className="mt-3 text-sm leading-7 text-[#111111]">{photo.caption}</p> : null}
                        <div className="mt-4 flex flex-wrap gap-2">
                          <AdminActionButton variant="approve" onClick={() => updatePhotoMutation.mutate({ id: photo.id, status: 'visible' })}>Aprobar</AdminActionButton>
                          <AdminActionButton variant="hide" onClick={() => updatePhotoMutation.mutate({ id: photo.id, status: 'hidden' })}><EyeOff className="mr-2 h-4 w-4" />Ocultar</AdminActionButton>
                          <AdminActionButton variant="danger" onClick={() => deletePhotoMutation.mutate(photo.id)}><Trash2 className="mr-2 h-4 w-4" />Eliminar</AdminActionButton>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
