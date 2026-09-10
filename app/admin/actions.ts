'use server';

import { randomUUID } from 'node:crypto';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase';
import { CATEGORIES } from '@/lib/types';
import type { Item, Source } from '@/lib/types';
import { SEED_ITEMS } from '@/lib/seed-data';
import {
  requireAdmin,
  setAdminCookie,
  clearAdminCookie,
  verifyPassword,
} from '@/lib/admin-auth';
import {
  runAmazonSync,
  getRecentSyncRuns,
  getLastSuccessfulSyncAt,
  type SyncResult,
} from '@/lib/sync';

const NOT_CONFIGURED = { ok: false as const, error: 'Supabase is not configured.' };

function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function login(
  prevState: { error?: string } | undefined,
  formData: FormData,
): Promise<{ error?: string }> {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return { error: 'ADMIN_PASSWORD is not configured.' };
  }

  const password = formData.get('password');
  if (typeof password !== 'string' || !verifyPassword(password)) {
    return { error: 'Incorrect password.' };
  }

  await setAdminCookie();
  redirect('/admin');
}

export async function logout(): Promise<void> {
  await requireAdmin();
  await clearAdminCookie();
  redirect('/admin/login');
}

export async function getAdminItems(): Promise<Item[]> {
  await requireAdmin();

  if (!isSupabaseConfigured()) {
    return SEED_ITEMS;
  }

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data ?? []) as Item[];
  } catch (err) {
    console.error('getAdminItems failed', err);
    return SEED_ITEMS;
  }
}

export type SaveState = { ok?: boolean; error?: string; id?: string };

function parseHttpUrl(value: FormDataEntryValue | null): string | null {
  if (typeof value !== 'string' || value.trim() === '') return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.toString();
  } catch {
    return null;
  }
}

export async function saveItem(
  prevState: SaveState | undefined,
  formData: FormData,
): Promise<SaveState> {
  await requireAdmin();

  if (!isSupabaseConfigured()) {
    return { error: 'Supabase is not configured.' };
  }

  try {
    const idRaw = formData.get('id');
    const id = typeof idRaw === 'string' && idRaw.trim() !== '' ? idRaw.trim() : null;
    if (id && !UUID_RE.test(id)) {
      return { error: 'Invalid item id.' };
    }

    const name = formData.get('name');
    if (typeof name !== 'string' || name.trim() === '') {
      return { error: 'Name is required.' };
    }

    const priceRaw = formData.get('price');
    let price: number | null = null;
    if (typeof priceRaw === 'string' && priceRaw.trim() !== '') {
      const parsed = Number(priceRaw);
      if (!Number.isFinite(parsed) || parsed < 0) {
        return { error: 'Price must be a non-negative number.' };
      }
      price = parsed;
    }

    const imageUrlRaw = formData.get('image_url');
    const image_url =
      typeof imageUrlRaw === 'string' && imageUrlRaw.trim() !== ''
        ? imageUrlRaw.trim()
        : null;

    const descriptionRaw = formData.get('description');
    const description =
      typeof descriptionRaw === 'string' && descriptionRaw.trim() !== ''
        ? descriptionRaw.trim()
        : null;

    const category = formData.get('category');
    if (
      typeof category !== 'string' ||
      !(CATEGORIES as readonly string[]).includes(category)
    ) {
      return { error: 'Category must be one of: ' + CATEGORIES.join(', ') + '.' };
    }

    const store = formData.get('store');
    if (typeof store !== 'string' || store.trim() === '') {
      return { error: 'Store is required.' };
    }

    const buy_url = parseHttpUrl(formData.get('buy_url'));
    if (!buy_url) {
      return { error: 'Buy URL must be a valid http(s) URL.' };
    }

    const qtyNeededRaw = formData.get('qty_needed');
    const qty_needed = Number(qtyNeededRaw);
    if (!Number.isInteger(qty_needed) || qty_needed < 1) {
      return { error: 'Quantity needed must be an integer of at least 1.' };
    }

    const qtyPurchasedRaw = formData.get('qty_purchased');
    const qty_purchased = Number(qtyPurchasedRaw);
    if (!Number.isInteger(qty_purchased) || qty_purchased < 0) {
      return { error: 'Quantity purchased must be a non-negative integer.' };
    }

    const source = formData.get('source');
    if (source !== 'amazon' && source !== 'external') {
      return { error: 'Source must be "amazon" or "external".' };
    }

    const sortOrderRaw = formData.get('sort_order');
    const sort_order =
      typeof sortOrderRaw === 'string' && sortOrderRaw.trim() !== ''
        ? Number(sortOrderRaw)
        : 0;
    if (!Number.isInteger(sort_order)) {
      return { error: 'Sort order must be an integer.' };
    }

    const is_active = formData.get('is_active') === 'on';

    const supabase = createServerClient();

    const payload = {
      name: name.trim(),
      price,
      image_url,
      description,
      category,
      store: store.trim(),
      buy_url,
      qty_needed,
      qty_purchased,
      source: source as Source,
      sort_order,
      is_active,
    };

    if (id) {
      const { error } = await supabase.from('items').update(payload).eq('id', id);
      if (error) throw error;

      revalidatePath('/');
      revalidatePath('/admin');
      return { ok: true, id };
    } else {
      const newId = randomUUID();
      const { error } = await supabase
        .from('items')
        .insert({ id: newId, ...payload });
      if (error) throw error;

      revalidatePath('/');
      revalidatePath('/admin');
      return { ok: true, id: newId };
    }
  } catch (err) {
    console.error('saveItem failed', err);
    return { error: 'Something went wrong. Please try again.' };
  }
}

export async function deleteItem(id: string): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();

  if (!isSupabaseConfigured()) {
    return NOT_CONFIGURED;
  }

  if (!UUID_RE.test(id)) {
    return { ok: false, error: 'Invalid item id.' };
  }

  try {
    const supabase = createServerClient();
    const { error } = await supabase.from('items').delete().eq('id', id);
    if (error) throw error;

    revalidatePath('/');
    revalidatePath('/admin');
    return { ok: true };
  } catch (err) {
    console.error('deleteItem failed', err);
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }
}

export async function setPurchased(
  id: string,
  purchased: boolean,
): Promise<{ ok: boolean; error?: string }> {
  await requireAdmin();

  if (!isSupabaseConfigured()) {
    return NOT_CONFIGURED;
  }

  if (!UUID_RE.test(id)) {
    return { ok: false, error: 'Invalid item id.' };
  }

  try {
    const supabase = createServerClient();
    const { data: item, error: itemError } = await supabase
      .from('items')
      .select('qty_needed')
      .eq('id', id)
      .single();

    if (itemError || !item) throw itemError ?? new Error('Item not found');

    const qty_purchased = purchased ? item.qty_needed : 0;

    const { error: updateError } = await supabase
      .from('items')
      .update({ qty_purchased })
      .eq('id', id);

    if (updateError) throw updateError;

    const { error: insertError } = await supabase.from('purchases').insert({
      item_id: id,
      source: 'admin',
      qty: 1,
      note: purchased ? 'manual toggle on' : 'manual toggle off',
    });

    if (insertError) throw insertError;

    revalidatePath('/');
    revalidatePath('/admin');
    return { ok: true };
  } catch (err) {
    console.error('setPurchased failed', err);
    return { ok: false, error: 'Something went wrong. Please try again.' };
  }
}

export async function moveItem(
  id: string,
  direction: 'up' | 'down',
): Promise<{ ok: boolean }> {
  await requireAdmin();

  if (!isSupabaseConfigured()) {
    return { ok: false };
  }

  if (!UUID_RE.test(id)) {
    return { ok: false };
  }

  try {
    const supabase = createServerClient();
    const { data: items, error } = await supabase
      .from('items')
      .select('id, sort_order, created_at')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw error;
    if (!items || items.length === 0) return { ok: false };

    // If all sort_orders are equal, renumber everyone 0..n-1 by current order.
    const allEqual = items.every((it) => it.sort_order === items[0].sort_order);
    let ordered = items;
    if (allEqual) {
      const renumbered = items.map((it, idx) => ({ ...it, sort_order: idx }));
      for (const it of renumbered) {
        const { error: renumberError } = await supabase
          .from('items')
          .update({ sort_order: it.sort_order })
          .eq('id', it.id);
        if (renumberError) throw renumberError;
      }
      ordered = renumbered;
    }

    const index = ordered.findIndex((it) => it.id === id);
    if (index === -1) return { ok: false };

    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= ordered.length) return { ok: false };

    const current = ordered[index];
    const neighbor = ordered[swapIndex];

    const { error: err1 } = await supabase
      .from('items')
      .update({ sort_order: neighbor.sort_order })
      .eq('id', current.id);
    if (err1) throw err1;

    const { error: err2 } = await supabase
      .from('items')
      .update({ sort_order: current.sort_order })
      .eq('id', neighbor.id);
    if (err2) throw err2;

    revalidatePath('/');
    revalidatePath('/admin');
    return { ok: true };
  } catch (err) {
    console.error('moveItem failed', err);
    return { ok: false };
  }
}

export async function triggerSync(): Promise<SyncResult> {
  await requireAdmin();

  const result = await runAmazonSync();
  revalidatePath('/');
  revalidatePath('/admin');
  return result;
}

export async function recentSyncRuns() {
  await requireAdmin();

  if (!isSupabaseConfigured()) {
    return [];
  }

  return getRecentSyncRuns(5);
}

/**
 * Polled by the admin while it waits for a bookmarklet sync to land.
 * Returns the ISO time of the latest successful sync, or null.
 */
export async function lastSuccessfulSyncAt(): Promise<string | null> {
  await requireAdmin();

  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    return await getLastSuccessfulSyncAt();
  } catch (err) {
    console.error('lastSuccessfulSyncAt:', err);
    return null;
  }
}
