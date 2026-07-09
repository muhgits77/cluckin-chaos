/**
 * Cluckin Chaos live data — fetched from Supabase Storage menu-data bucket.
 * Path: menu-data/{truckId}/menu.json
 * Images: public URLs in menu-images bucket (set by TruckDash on publish).
 * Fallback: published_trucks table (if menu.json not yet uploaded).
 */

import { fetchMenuJsonFromStorage } from './fetchMenuJson';
import { getSupabase, getSupabaseConfigHint, isSupabaseConfigured } from './supabase';

// ── Types ────────────────────────────────────────────────────────────────────

export type PublishedMenuItem = {
  id: string;
  name: string;
  price: string;
  description?: string;
  category?: string;
  tags?: string[];
  image?: string;
  note?: string;
};

export type PublishedScheduleDay = {
  id: string;
  day: string;
  neighborhood: string;
  spot: string;
  hoursStart: string;
  hoursEnd: string;
  closed?: boolean;
  note?: string;
};

export type PublishedPayload = {
  truckId: string;
  truckName: string;
  phone: string;
  orderUrl: string;
  location: string;
  hoursStart: string;
  hoursEnd: string;
  special: string;
  menu: PublishedMenuItem[];
  schedule: PublishedScheduleDay[];
  lastPublished: string;
  version: number;
};

export type FetchPublishedResult = {
  ok: boolean;
  data: PublishedPayload | null;
  truckId: string;
  error: string | null;
};

const LOG = '[publishedTruck]';

export function getTruckId(): string {
  return import.meta.env.VITE_TRUCK_ID?.trim() || 'cluckin-chaos';
}

// ── Item keys ────────────────────────────────────────────────────────────────

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function menuItemKey(item: PublishedMenuItem): string {
  const id = item.id?.trim();
  if (id) return `id:${id}`;
  const name = normalizeName(item.name || '');
  return name ? `name:${name}` : 'unknown';
}

export function menuItemSiteId(item: PublishedMenuItem): string {
  const id = item.id?.trim();
  if (id) return `live-${id}`;
  const slug = normalizeName(item.name || '').replace(/\s+/g, '-');
  return slug ? `live-name-${slug}` : 'live-unknown';
}

export function menuItemListKey(item: PublishedMenuItem): string {
  return `${menuItemKey(item)}|${item.price}|${item.name}`;
}

export function diffMenu(
  before: PublishedMenuItem[],
  after: PublishedMenuItem[],
): { added: string[]; removed: string[]; updated: string[] } {
  const prev = new Map(before.map((item) => [menuItemKey(item), item]));
  const next = new Map(after.map((item) => [menuItemKey(item), item]));
  const added: string[] = [];
  const removed: string[] = [];
  const updated: string[] = [];

  for (const [key, item] of next) {
    const old = prev.get(key);
    if (!old) added.push(item.name);
    else if (old.name !== item.name || old.price !== item.price) {
      updated.push(`${old.name} $${old.price} → ${item.name} $${item.price}`);
    }
  }
  for (const [key, item] of prev) {
    if (!next.has(key)) removed.push(item.name);
  }
  return { added, removed, updated };
}

// ── Parse JSON ───────────────────────────────────────────────────────────────

function parseMenuItem(raw: unknown, index: number): PublishedMenuItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const name = typeof o.name === 'string' ? o.name.trim() : '';
  if (!name) return null;

  const id =
    (typeof o.id === 'string' && o.id.trim()) ||
    (typeof o.id === 'number' && String(o.id)) ||
    `item-${index}`;

  const price =
    typeof o.price === 'string'
      ? o.price.trim()
      : typeof o.price === 'number'
        ? String(o.price)
        : '';

  return {
    id,
    name,
    price,
    description: typeof o.description === 'string' ? o.description.trim() : undefined,
    category: typeof o.category === 'string' ? o.category.trim() : undefined,
    image: typeof o.image === 'string' ? o.image.trim() : undefined,
    note: typeof o.note === 'string' ? o.note.trim() : undefined,
    tags: Array.isArray(o.tags)
      ? o.tags.filter((t): t is string => typeof t === 'string')
      : undefined,
  };
}

export function parseMenu(value: unknown): PublishedMenuItem[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const items: PublishedMenuItem[] = [];

  for (let i = 0; i < value.length; i++) {
    const item = parseMenuItem(value[i], i);
    if (!item) continue;
    const key = menuItemKey(item);
    if (seen.has(key)) continue;
    seen.add(key);
    items.push(item);
  }
  return items;
}

function parseSchedule(value: unknown): PublishedScheduleDay[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (d): d is PublishedScheduleDay =>
      !!d && typeof d === 'object' && typeof (d as PublishedScheduleDay).day === 'string',
  );
}

function jsonToPayload(raw: Record<string, unknown>, truckId: string): PublishedPayload {
  return {
    truckId: (typeof raw.truckId === 'string' ? raw.truckId : truckId) || truckId,
    truckName: typeof raw.truckName === 'string' ? raw.truckName : '',
    phone: typeof raw.phone === 'string' ? raw.phone : '',
    orderUrl: typeof raw.orderUrl === 'string' ? raw.orderUrl : '',
    location: typeof raw.location === 'string' ? raw.location : '',
    hoursStart: typeof raw.hoursStart === 'string' ? raw.hoursStart : '',
    hoursEnd: typeof raw.hoursEnd === 'string' ? raw.hoursEnd : '',
    special: typeof raw.special === 'string' ? raw.special : '',
    menu: parseMenu(raw.menu),
    schedule: parseSchedule(raw.schedule),
    lastPublished: typeof raw.lastPublished === 'string' ? raw.lastPublished : '',
    version: typeof raw.version === 'number' ? raw.version : 1,
  };
}

export function hasPublishedData(data: PublishedPayload | null): boolean {
  if (!data) return false;
  return (
    !!data.lastPublished ||
    data.menu.length > 0 ||
    data.schedule.length > 0 ||
    !!data.special ||
    !!data.location
  );
}

// ── Fetch from Storage (+ table fallback) ────────────────────────────────────

async function fetchFromPublishedTrucksTable(
  truckId: string,
): Promise<PublishedPayload | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('published_trucks')
    .select('*')
    .eq('truck_id', truckId)
    .maybeSingle();

  if (error || !data) {
    if (error) console.warn(LOG, 'published_trucks fallback failed', error.message);
    return null;
  }

  const row = data as Record<string, unknown>;
  const payloadJson =
    row.payload && typeof row.payload === 'object'
      ? (row.payload as Record<string, unknown>)
      : {};

  // Prefer column fields; fill gaps from payload JSON
  const merged: Record<string, unknown> = {
    truckId,
    truckName: row.truck_name ?? payloadJson.truckName ?? '',
    phone: row.phone ?? payloadJson.phone ?? '',
    orderUrl: row.order_url ?? payloadJson.orderUrl ?? '',
    location: row.location ?? payloadJson.location ?? '',
    hoursStart: row.hours_start ?? payloadJson.hoursStart ?? '',
    hoursEnd: row.hours_end ?? payloadJson.hoursEnd ?? '',
    special: row.special ?? payloadJson.special ?? '',
    menu: row.menu ?? payloadJson.menu ?? [],
    schedule: row.schedule ?? payloadJson.schedule ?? [],
    lastPublished:
      (typeof row.last_published === 'string' && row.last_published) ||
      (typeof payloadJson.lastPublished === 'string' && payloadJson.lastPublished) ||
      '',
    version: typeof row.version === 'number' ? row.version : 1,
  };

  return jsonToPayload(merged, truckId);
}

export async function fetchPublishedTruck(
  truckId = getTruckId(),
): Promise<FetchPublishedResult> {
  const id = truckId.trim() || 'cluckin-chaos';

  if (!isSupabaseConfigured()) {
    const msg = getSupabaseConfigHint();
    console.error(LOG, 'not configured', msg);
    return { ok: false, data: null, truckId: id, error: msg };
  }

  console.info(LOG, 'fetching menu-data bucket', { truckId: id });

  try {
    const raw = await fetchMenuJsonFromStorage(id);
    if (raw) {
      const payload = jsonToPayload(raw as Record<string, unknown>, id);

      console.info(LOG, 'loaded from menu.json', {
        truckId: id,
        menu: payload.menu.length,
        schedule: payload.schedule.length,
        lastPublished: payload.lastPublished,
        images: payload.menu.filter((m) => m.image).length,
      });

      return { ok: true, data: payload, truckId: id, error: null };
    }

    console.warn(LOG, `No menu.json in menu-data for "${id}" — trying published_trucks fallback`);
    const fallback = await fetchFromPublishedTrucksTable(id);
    if (fallback && hasPublishedData(fallback)) {
      console.info(LOG, 'loaded from published_trucks fallback', {
        truckId: id,
        menu: fallback.menu.length,
        schedule: fallback.schedule.length,
        lastPublished: fallback.lastPublished,
      });
      return { ok: true, data: fallback, truckId: id, error: null };
    }

    const msg = `No menu.json in menu-data bucket for truck_id="${id}"`;
    console.warn(LOG, msg);
    return { ok: false, data: null, truckId: id, error: msg };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Fetch failed';
    console.error(LOG, 'exception', err);
    return { ok: false, data: null, truckId: id, error: msg };
  }
}

export const getLatestPublished = fetchPublishedTruck;

// ── Display helpers ──────────────────────────────────────────────────────────

export function parseMenuPriceNumber(price: string): number {
  const n = Number(String(price).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export function inferMenuCategory(
  name: string,
  explicit?: string,
): 'mains' | 'sides' | 'drinks' {
  const cat = (explicit || '').toLowerCase();
  if (/drink|bev|tea|soda/.test(cat)) return 'drinks';
  if (/side|extra|snack/.test(cat)) return 'sides';
  const n = name.toLowerCase();
  if (/tea|lemonade|soda|coke|pepsi|water|drink|coffee/.test(n)) return 'drinks';
  if (/fries|slaw|chips|side|biscuit|cornbread/.test(n)) return 'sides';
  return 'mains';
}

export function formatMenuPrice(price: string | number): string {
  const raw = String(price ?? '').trim();
  if (!raw) return '—';
  if (raw.startsWith('$')) return raw;
  const n = Number(raw.replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) && /[0-9]/.test(raw) ? `$${n.toFixed(2)}` : raw;
}

export function getTodayWeekdayAbbr(date = new Date()): string {
  return date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase().slice(0, 3);
}

export function weekdayAbbrToFull(abbr: string): string {
  const map: Record<string, string> = {
    SUN: 'Sunday', MON: 'Monday', TUE: 'Tuesday', WED: 'Wednesday',
    THU: 'Thursday', FRI: 'Friday', SAT: 'Saturday',
  };
  return map[abbr.toUpperCase()] || abbr;
}

export function formatHoursRange(start: string, end: string): string {
  const s = start?.trim();
  const e = end?.trim();
  if (s && e) return `${s} – ${e}`;
  return s || e || '';
}

export function formatPublishedTimestamp(iso: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

// Legacy aliases
export const normalizeMenuItemName = normalizeName;
export const publishedMenuItemKey = menuItemKey;
export const publishedItemToSiteId = menuItemSiteId;
export const publishedItemListKey = menuItemListKey;
export const diffMenuSnapshots = diffMenu;