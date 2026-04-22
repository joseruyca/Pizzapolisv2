import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { Settings, Shield, Upload, LogOut } from 'lucide-react';

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
  const { user, profile, role, refreshProfile, logout } = useAuth();
  const [avatarPreview, setAvatarPreview] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    resolveAvatar(profile?.avatar_url || user?.avatar_url).then(setAvatarPreview);
  }, [profile?.avatar_url, user?.avatar_url]);

  if (!user) return <div className="min-h-[calc(100vh-64px)] bg-[#060606]" />;

  const displayName = profile?.username || user.username || user.full_name || 'User';
  const handle = displayName.toLowerCase().replace(/\s+/g, '_');

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
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#060606] px-4 py-4">
      <div className="mx-auto max-w-md rounded-[30px] border border-white/10 bg-[#101010] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-[#efbf3a] to-[#df5b43] text-2xl font-black text-white">
              {avatarPreview ? <img src={avatarPreview} alt={displayName} className="h-full w-full object-cover" /> : displayName.slice(0, 1).toUpperCase()}
              <label className="absolute bottom-0 right-0 grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-black/70 text-white">
                <Upload className="h-4 w-4" />
                <input type="file" accept="image/*" className="hidden" onChange={onUploadAvatar} />
              </label>
            </div>
            <div>
              <div className="text-[1.8rem] font-black tracking-tight text-white">{displayName}</div>
              <div className="text-sm text-stone-500">@{handle}</div>
              <div className="mt-2 text-sm text-stone-400">Your email stays private. Your username is public.</div>
              <div className="mt-2 text-xs text-stone-500">{uploading ? 'Uploading avatar...' : 'Core profile only: avatar, username and account settings.'}</div>
            </div>
          </div>
          <Link to={createPageUrl('SettingsPage')} className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-stone-200"><Settings className="h-4 w-4" /></Link>
        </div>

        {role === 'admin' ? <Link to={createPageUrl('Admin')} className="mt-6 flex items-center justify-between rounded-[26px] border border-[#efbf3a]/30 bg-[#111] px-5 py-5 text-white"><div><div className="text-[11px] font-black uppercase tracking-[0.16em] text-[#efbf3a]">Admin</div><div className="mt-2 text-lg font-black">Open moderation panel</div><div className="mt-1 text-sm text-white/70">Manage spots, plans, photos and moderation.</div></div><div className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold"><Shield className="h-4 w-4" /></div></Link> : null}

        <div className="mt-8 space-y-3">
          <Link to={createPageUrl('SettingsPage')} className="flex w-full items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3.5 text-left text-stone-200 transition hover:bg-white/[0.05]">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.04]"><Settings className="h-4 w-4 text-red-400" /></div>
            <span className="font-medium">Settings</span>
          </Link>
          <button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3.5 text-left text-stone-200 transition hover:bg-white/[0.05]">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.04]"><LogOut className="h-4 w-4 text-red-400" /></div>
            <span className="font-medium">Log out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
