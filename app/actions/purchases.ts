'use server';

import { createHash } from 'node:crypto';
import { headers } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase';

export type ActionResult =
  | { ok: true; qty_purchased: number; qty_needed: number }
  | { ok: false; message: string };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const UNDO_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

const GENERIC_ERROR = 'Something went wrong. Please try again.';

function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

async function getIpHash(): Promise<string> {
  const headerList = await headers();
  const forwardedFor = headerList.get('x-forwarded-for');
  const realIp = headerList.get('x-real-ip');
  const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : (realIp ?? '');
  const salt = process.env.RATE_LIMIT_SALT || 'baby-shower';
  return createHash('sha256').update(ip + salt).digest('hex');
}

export async function markPurchased(itemId: string): Promise<ActionResult> {
  try {
    if (!isSupabaseConfigured()) {
      return { ok: false, message: 'Purchases are not enabled yet.' };
    }

    if (typeof itemId !== 'string' || !UUID_RE.test(itemId)) {
      return { ok: false, message: GENERIC_ERROR };
    }

    const ipHash = await getIpHash();
    const supabase = createServerClient();

    // Double-tap guard.
    const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    const { data: recent, error: recentError } = await supabase
      .from('purchases')
      .select('id')
      .eq('item_id', itemId)
      .eq('ip_hash', ipHash)
      .eq('source', 'honor')
      .gte('created_at', since)
      .limit(1);

    if (recentError) throw recentError;
    if (recent && recent.length > 0) {
      return { ok: false, message: 'Already counted — thank you!' };
    }

    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('id, source, is_active, qty_needed, qty_purchased')
      .eq('id', itemId)
      .single();

    if (itemError || !item) throw itemError ?? new Error('Item not found');

    if (
      item.source !== 'external' ||
      !item.is_active ||
      item.qty_purchased >= item.qty_needed
    ) {
      return { ok: false, message: 'This gift is already spoken for.' };
    }

    const { data: updatedItem, error: updateError } = await supabase
      .from('items')
      .update({ qty_purchased: item.qty_purchased + 1 })
      .eq('id', itemId)
      .lt('qty_purchased', item.qty_needed)
      .select('qty_purchased, qty_needed')
      .single();

    if (updateError || !updatedItem) {
      // Someone else's update won the race.
      return { ok: false, message: 'This gift is already spoken for.' };
    }

    const { error: insertError } = await supabase.from('purchases').insert({
      item_id: itemId,
      source: 'honor',
      qty: 1,
      ip_hash: ipHash,
    });

    if (insertError) throw insertError;

    revalidatePath('/');

    return {
      ok: true,
      qty_purchased: updatedItem.qty_purchased,
      qty_needed: updatedItem.qty_needed,
    };
  } catch (err) {
    console.error('markPurchased failed', err);
    return { ok: false, message: GENERIC_ERROR };
  }
}

export async function undoPurchase(itemId: string): Promise<ActionResult> {
  try {
    if (!isSupabaseConfigured()) {
      return { ok: false, message: 'Purchases are not enabled yet.' };
    }

    if (typeof itemId !== 'string' || !UUID_RE.test(itemId)) {
      return { ok: false, message: GENERIC_ERROR };
    }

    const ipHash = await getIpHash();
    const supabase = createServerClient();

    const since = new Date(Date.now() - UNDO_WINDOW_MS).toISOString();
    const { data: recentPurchases, error: recentError } = await supabase
      .from('purchases')
      .select('id')
      .eq('item_id', itemId)
      .eq('ip_hash', ipHash)
      .eq('source', 'honor')
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(1);

    if (recentError) throw recentError;
    const purchase = recentPurchases?.[0];
    if (!purchase) {
      return { ok: false, message: 'Nothing to undo.' };
    }

    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('qty_purchased, qty_needed')
      .eq('id', itemId)
      .single();

    if (itemError || !item) throw itemError ?? new Error('Item not found');

    const { error: deleteError } = await supabase
      .from('purchases')
      .delete()
      .eq('id', purchase.id);

    if (deleteError) throw deleteError;

    const newQtyPurchased = Math.max(0, item.qty_purchased - 1);

    const { data: updatedItem, error: updateError } = await supabase
      .from('items')
      .update({ qty_purchased: newQtyPurchased })
      .eq('id', itemId)
      .select('qty_purchased, qty_needed')
      .single();

    if (updateError || !updatedItem) throw updateError ?? new Error('Update failed');

    revalidatePath('/');

    return {
      ok: true,
      qty_purchased: updatedItem.qty_purchased,
      qty_needed: updatedItem.qty_needed,
    };
  } catch (err) {
    console.error('undoPurchase failed', err);
    return { ok: false, message: GENERIC_ERROR };
  }
}
