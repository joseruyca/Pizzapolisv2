import { supabase } from '@/lib/supabase';

function normalizeScore(value) {
  return Math.max(0, Math.min(5, Math.round((Number(value) || 0) * 2) / 2));
}

export async function fetchMySpotRating(spotId, userId) {
  if (!supabase || !spotId || !userId) return 0;
  const { data, error } = await supabase
    .from('spot_ratings')
    .select('score')
    .eq('spot_id', spotId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return normalizeScore(data?.score || 0);
}

export async function fetchSpotRatingsAggregate(spotId) {
  if (!supabase || !spotId) return { average_rating: 0, ratings_count: 0 };
  const { data, error } = await supabase
    .from('spot_ratings')
    .select('score')
    .eq('spot_id', spotId);

  if (error) throw error;
  const rows = data || [];
  const ratings_count = rows.length;
  if (!ratings_count) return { average_rating: 0, ratings_count: 0 };

  const total = rows.reduce((sum, row) => sum + (Number(row.score) || 0), 0);
  return {
    average_rating: total / ratings_count,
    ratings_count,
  };
}

export async function saveSpotRating({ spotId, userId, score }) {
  if (!supabase || !spotId || !userId) throw new Error('Missing rating data.');
  const normalized = normalizeScore(score);
  const { error } = await supabase
    .from('spot_ratings')
    .upsert(
      {
        spot_id: spotId,
        user_id: userId,
        score: normalized,
      },
      { onConflict: 'spot_id,user_id' },
    );

  if (error) throw error;
  return normalized;
}

export { normalizeScore };
