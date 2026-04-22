import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Bell, CalendarDays, CircleHelp, MapPin, Settings, Shield, Upload, Users } from 'lucide-react';

async function getProfileData(userId) {
  const [{ count: createdPlansCount = 0 }, { count: joinedCount = 0 }, { count: spotsCount = 0 }, joinedPlansRes] = await Promise.all([
    supabase.from('plans').select('id', { count: 'exact', head: true }).eq('created_by', userId),
    supabase.from('plan_members').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'joined'),
    supabase.from('spots').select('id', { count: 'exact', head: true }).eq('created_by', userId),
    supabase.from('plan_members').select('plan_id').eq('user_id', userId).eq('status', 'joined'),
  ]);
  const joinedPlanIds = (joinedPlansRes.data || []).map((row) => row.plan_id).filter(Boolean);
  const ownedPlansRes = await supabase.from('plans').select('id,title,plan_date,plan_time,spot_id').eq('created_by', userId).order('plan_date', { ascending: true }).limit(3);
  const joinedOnlyIds = joinedPlanIds.filter((id) => !(ownedPlansRes.data || []).some((plan) => plan.id === id)).slice(0, 3);
  const joinedOnlyRes = joinedOnlyIds.length ? await supabase.from('plans').select('id,title,plan_date,plan_time,spot_id').in('id', joinedOnlyIds) : { data: [] };
  const plans = [...(ownedPlansRes.data || []), ...(joinedOnlyRes.data || [])].slice(0, 3);
  const spotIds = plans.map((plan) => plan.spot_id).filter(Boolean);
  const spotsRes = spotIds.length ? await supabase.from('spots').select('id,name,address').in('id', spotIds) : { data: [] };
  const spotMap = new Map((spotsRes.data || []).map((spot) => [spot.id, spot]));
  return { createdPlansCount, joinedCount, spotsCount, upcomingPlans: plans.map((plan) => ({ ...plan, spots: spotMap.get(plan.spot_id) || null })) };
}

async function resolveAvatar(value) {
  if (!value) return '';
  if (String(value).startsWith('http')) return value;
  const bucket = supabase.storage.from('avatars');
  const { data: signed } = await bucket.createSignedUrl(value, 60 * 60);
  if (signed?.signedUrl) return signed.signedUrl;
  const { data: publicData } = bucket.getPublicUrl(value);
  return publicData?.publicUrl || '';
}

export default function Profile() {
  const { user, profile, role, refreshProfile } = useAuth();
  const [avatarPreview, setAvatarPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const { data, isLoading } = useQuery({ queryKey: ['profile-supabase', user?.id], enabled: Boolean(user?.id && isSupabaseConfigured && supabase), queryFn: () => getProfileData(user.id), staleTime: 10000 });
  useEffect(() => { resolveAvatar(profile?.avatar_url || user?.avatar_url).then(setAvatarPreview); }, [profile?.avatar_url, user?.avatar_url]);
  const stats = useMemo(() => ({ created: data?.createdPlansCount || 0, joined: data?.joinedCount || 0, spots: data?.spotsCount || 0 }), [data]);
  if (!user) return <div className="min-h-[calc(100vh-64px)] bg-[#060606]" />;
  const displayName = profile?.username || user.username || user.full_name || 'User';
  const handle = displayName.toLowerCase().replace(/\s+/g, '_');
  const items = [{ icon: CalendarDays, label: 'My groups', page: 'MisMatches' }, { icon: MapPin, label: 'Add spot', page: 'Home' }, { icon: Settings, label: 'Settings', page: 'SettingsPage' }, { icon: CircleHelp, label: 'Help & support', page: 'SupportPage' }];
  const onUploadAvatar = async (event) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const filePath = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true, cacheControl: '3600' });
      if (uploadError) throw uploadError;
      const { error } = await supabase.from('profiles').update({ avatar_url: filePath, updated_at: new Date().toISOString() }).eq('id', user.id);
      if (error) throw error;
      setAvatarPreview(await resolveAvatar(filePath));
      await refreshProfile?.();
    } catch (error) {
      console.error(error);
      window.alert(error?.message || 'Could not upload avatar. Check the avatars bucket and storage policies in Supabase.');
    } finally { setUploading(false); }
  };
  return <div className="min-h-[calc(100vh-64px)] bg-[#060606] px-4 py-4"><div className="mx-auto max-w-md rounded-[30px] border border-white/10 bg-[#101010] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]"><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-4"><div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-[#efbf3a] to-[#df5b43] text-2xl font-black text-white">{avatarPreview ? <img src={avatarPreview} alt={displayName} className="h-full w-full object-cover" /> : displayName.slice(0,1).toUpperCase()}<label className="absolute bottom-0 right-0 grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-black/70 text-white"><Upload className="h-4 w-4" /><input type="file" accept="image/*" className="hidden" onChange={onUploadAvatar} /></label></div><div><div className="text-[1.8rem] font-black tracking-tight text-white">{displayName}</div><div className="text-sm text-stone-500">@{handle}</div><div className="mt-2 text-sm text-stone-400">{role === 'admin' ? 'Pizzapolis admin' : 'Real plans, cheap slices and better group meetups.'}</div><div className="mt-2 text-xs text-stone-500">{uploading ? 'Uploading avatar...' : 'Your email stays private. Your username is public.'}</div></div></div><div className="flex items-center gap-2"><button className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-stone-200"><Bell className="h-4 w-4" /></button><Link to={createPageUrl('SettingsPage')} className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-stone-200"><Settings className="h-4 w-4" /></Link></div></div>{role === 'admin' ? <Link to={createPageUrl('Admin')} className="mt-6 flex items-center justify-between rounded-[26px] border border-[#efbf3a]/30 bg-[#111] px-5 py-5 text-white"><div><div className="text-[11px] font-black uppercase tracking-[0.16em] text-[#efbf3a]">Admin</div><div className="mt-2 text-lg font-black">Open moderation panel</div><div className="mt-1 text-sm text-white/70">Manage spots, plans, comments, photos and chat.</div></div><div className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold"><Shield className="h-4 w-4" /></div></Link> : null}<div className="mt-6 grid grid-cols-3 gap-3 rounded-[26px] border border-white/8 bg-white/[0.03] p-4 text-center"><div><div className="text-3xl font-black text-white">{isLoading ? '…' : stats.joined}</div><div className="mt-1 text-xs uppercase tracking-[0.14em] text-stone-500">Groups</div></div><div><div className="text-3xl font-black text-white">{isLoading ? '…' : stats.created}</div><div className="mt-1 text-xs uppercase tracking-[0.14em] text-stone-500">Plans</div></div><div><div className="text-3xl font-black text-white">{isLoading ? '…' : stats.spots}</div><div className="mt-1 text-xs uppercase tracking-[0.14em] text-stone-500">Spots</div></div></div><div className="mt-8"><div className="flex items-center justify-between"><div className="text-sm font-bold uppercase tracking-[0.16em] text-stone-500">Upcoming plans</div><Link to={createPageUrl('MisMatches')} className="text-sm font-semibold text-red-400">Open groups</Link></div><div className="mt-4 space-y-3 rounded-[26px] border border-white/8 bg-white/[0.03] p-4">{(data?.upcomingPlans?.length ? data.upcomingPlans : []).slice(0, 3).map((plan) => <div key={plan.id} className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-stone-300"><div className="font-bold text-white">{plan.title}</div><div className="mt-1 text-stone-400">{plan.spots?.name || 'Spot'} · {plan.plan_date} · {String(plan.plan_time).slice(0,5)}</div></div>)}{!data?.upcomingPlans?.length && !isLoading ? <div className="text-sm leading-7 text-stone-400">You have not created or joined a real plan yet.</div> : null}</div></div><div className="mt-8 space-y-2">{items.map((item) => { const Icon = item.icon; return <Link key={item.label} to={createPageUrl(item.page)} className="flex w-full items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3.5 text-left text-stone-200 transition hover:bg-white/[0.05]"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.04]"><Icon className="h-4 w-4 text-red-400" /></div><span className="font-medium">{item.label}</span></Link>; })}</div></div></div>;
}
