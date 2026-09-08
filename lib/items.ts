import 'server-only';
import { createPublicClient } from './supabase';
import { SEED_ITEMS } from './seed-data';
import type { Item } from './types';

/**
 * Fetches active registry items, ordered for display.
 *
 * Falls back to the static SEED_ITEMS when Supabase env vars are not
 * configured, or when the query fails for any reason.
 */
export async function getItems(): Promise<Item[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return SEED_ITEMS;
  }

  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return (data ?? []) as Item[];
  } catch (err) {
    console.error('getItems: falling back to SEED_ITEMS', err);
    return SEED_ITEMS;
  }
}
