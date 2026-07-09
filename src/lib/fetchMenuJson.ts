/**
 * Download menu.json from the menu-data Supabase Storage bucket.
 */

import {
  MENU_DATA_BUCKET,
  menuJsonFullPath,
  menuJsonPath,
  menuJsonPublicUrl,
} from './menuStorage';
import { getSupabase, isSupabaseConfigured } from './supabase';

const LOG = '[fetchMenuJson]';

export async function fetchMenuJsonFromStorage(
  truckId: string,
): Promise<unknown | null> {
  const id = truckId.trim();
  if (!id || !isSupabaseConfigured()) return null;

  // Prefer Supabase client download (works with public buckets)
  const supabase = getSupabase();
  if (supabase) {
    const path = menuJsonPath(id);
    const { data, error } = await supabase.storage.from(MENU_DATA_BUCKET).download(path);

    if (!error && data) {
      try {
        const json = JSON.parse(await data.text()) as unknown;
        console.info(LOG, 'downloaded via client', { fullPath: menuJsonFullPath(id) });
        return json;
      } catch (parseErr) {
        console.error(LOG, 'invalid JSON', parseErr);
        return null;
      }
    }

    if (error) {
      console.warn(LOG, 'client download failed, trying public URL', error.message);
    }
  }

  // Fallback: public URL + cache bust (reliable on Vercel/CDN)
  const url = `${menuJsonPublicUrl(id)}?t=${Date.now()}`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      console.warn(LOG, 'HTTP', res.status, url);
      return null;
    }
    const json = (await res.json()) as unknown;
    console.info(LOG, 'downloaded via public URL', url);
    return json;
  } catch (err) {
    console.error(LOG, 'fetch failed', err);
    return null;
  }
}