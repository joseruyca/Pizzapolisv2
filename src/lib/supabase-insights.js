import { supabase } from '@/lib/supabase';

export async function fetchApprovedSpots() {
  const { data, error } = await supabase
    .from('spots')
    .select('id,name,address,slice_price,best_slice,quick_note,photo_url,status,created_at,created_by')
    .eq('status', 'approved')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchActivePlans() {
  const { data, error } = await supabase
    .from('plans')
    .select('id,title,plan_date,plan_time,max_people,quick_note,status,created_by,spot_id,created_at')
    .eq('status', 'active')
    .order('plan_date', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function fetchProfilesByIds(ids = []) {
  const clean = [...new Set(ids.filter(Boolean))];
  if (!clean.length) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('id,email,username,avatar_url,role')
    .in('id', clean);
  if (error) throw error;
  return data || [];
}

export async function fetchSpotsByIds(ids = []) {
  const clean = [...new Set(ids.filter(Boolean))];
  if (!clean.length) return [];
  const { data, error } = await supabase
    .from('spots')
    .select('id,name,address,slice_price,best_slice,quick_note,photo_url,status,created_at,created_by')
    .in('id', clean);
  if (error) throw error;
  return data || [];
}

export async function fetchJoinedPlanIds(userId) {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('plan_members')
    .select('plan_id')
    .eq('user_id', userId)
    .eq('status', 'joined');
  if (error) throw error;
  return (data || []).map((row) => row.plan_id).filter(Boolean);
}
