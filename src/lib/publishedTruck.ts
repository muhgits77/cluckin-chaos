/**
 * TruckDash → Cluckin Chaos sync.
 * Source of truth: Supabase `published_trucks` (one row per truck_id).
 */

import {
  getSupabase,
  getSupabaseConfigHint,
  getSupabaseUrl,
  isSupabaseConfigured,
} from './supabase';

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

type PublishedTruckRow = {
  truck_id: string;
  truck_name: string;
  phone: string;
  order_url: string;
  location: string;
  hours_start: string;
  hours_end: string;
  special: string;
  menu: unknown;
  schedule: unknown;
  last_published: string | null;
  version: number | null;
};

export type FetchPublishedResult = {
  ok: boolean;
  data: PublishedPayload | null;
  truckId: string;
  error: string | null;
  rawRow: unknown;
};

// ── Config ───────────────────────────────────────────────────────────────────

const SELECT =
  'truck_id, truck_name, phone, order_url, location, hours_start, hours_end, special, menu, schedule, last_published, version';

const POLL_LOG_PREFIX = '[publishedTruck]';

export function getTruckId(): string {
  const env = import.meta.env.VITE_TRUCK_ID?.trim();
  return env || 'cluckin-chaos';
}

// ── Item keys (id → name fallback) ───────────────────────────────────────────

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Match key for sync diffing — TruckDash id first, normalized name second. */
export function menuItemKey(item: PublishedMenuItem): string {
  const id = item.id?.trim();
  if (id) return `id:${id}`;
  const name = normalizeName(item.name || '');
  return name ? `name:${name}` : 'unknown';
}

/** Stable cart / React id. */
export function menuItemSiteId(item: PublishedMenuItem): string {
  const id = item.id?.trim();
  if (id) return `live-${id}`;
  const slug = normalizeName(item.name || '').replace(/\s+/g, '-');
  return slug ? `live-name-${slug}` : 'live-unknown';
}

/** React list key — remounts on price or name change. */
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

// ── Parse Supabase JSONB ─────────────────────────────────────────────────────

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

  const tags = Array.isArray(o.tags)
    ? o.tags.filter((t): t is string => typeof t === 'string' && !!t.trim())
    : undefined;

  return {
    id,
    name,
    price,
    description: typeof o.description === 'string' ? o.description.trim() : undefined,
    category: typeof o.category === 'string' ? o.category.trim() : undefined,
    image: typeof o.image === 'string' ? o.image.trim() : undefined,
    note: typeof o.note === 'string' ? o.note.trim() : undefined,
    tags,
  };
}

export function parseMenu(value: unknown): PublishedMenuItem[] {
  if (!Array.isArray(value)) return [];
  const items: PublishedMenuItem[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < value.length; i++) {
    const item = parseMenuItem(value[i], i);
    if (!item) continue;
    const key = menuItemKey(item);
    if (seen.has(key)) {
      console.warn(POLL_LOG_PREFIX, 'duplicate menu key skipped', key, item);
      continue;
    }
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

function rowToPayload(row: PublishedTruckRow): PublishedPayload {
  return {
    truckId: row.truck_id,
    truckName: row.truck_name || '',
    phone: row.phone || '',
    orderUrl: row.order_url || '',
    location: row.location || '',
    hoursStart: row.hours_start || '',
    hoursEnd: row.hours_end || '',
    special: row.special || '',
    menu: parseMenu(row.menu),
    schedule: parseSchedule(row.schedule),
    lastPublished: row.last_published || '',
    version: row.version ?? 1,
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

// ── Fetch ────────────────────────────────────────────────────────────────────

export async function fetchPublishedTruck(
  truckId = getTruckId(),
): Promise<FetchPublishedResult> {
  const id = truckId.trim() || 'cluckin-chaos';

  if (!isSupabaseConfigured()) {
    const msg = getSupabaseConfigHint();
    console.error(POLL_LOG_PREFIX, 'not configured', msg);
    return { ok: false, data: null, truckId: id, error: msg, rawRow: null };
  }

  const supabase = getSupabase();
  if (!supabase) {
    const msg = 'Could not create Supabase client';
    console.error(POLL_LOG_PREFIX, msg);
    return { ok: false, data: null, truckId: id, error: msg, rawRow: null };
  }

  console.info(POLL_LOG_PREFIX, 'fetching', { truckId: id, url: getSupabaseUrl() });

  try {
    const { data: row, error } = await supabase
      .from('published_trucks')
      .select(SELECT)
      .eq('truck_id', id)
      .maybeSingle();

    if (error) {
      console.error(POLL_LOG_PREFIX, 'query error', {
        truckId: id,
        message: error.message,
        code: error.code,
        details: error.details,
      });
      return { ok: false, data: null, truckId: id, error: error.message, rawRow: null };
    }

    if (!row) {
      const msg = `No row in published_trucks for truck_id="${id}"`;
      console.warn(POLL_LOG_PREFIX, msg);
      return { ok: false, data: null, truckId: id, error: msg, rawRow: null };
    }

    const payload = rowToPayload(row as PublishedTruckRow);

    console.info(POLL_LOG_PREFIX, 'loaded', {
      truckId: id,
      menu: payload.menu.length,
      schedule: payload.schedule.length,
      lastPublished: payload.lastPublished,
      items: payload.menu.map((m) => `${m.name} ($${m.price})`),
    });

    return { ok: true, data: payload, truckId: id, error: null, rawRow: row };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown fetch error';
    console.error(POLL_LOG_PREFIX, 'exception', err);
    return { ok: false, data: null, truckId: id, error: msg, rawRow: null };
  }
}

/** @alias fetchPublishedTruck */
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

// Legacy aliases used by menuFromPublished
export const normalizeMenuItemName = normalizeName;
export const publishedMenuItemKey = menuItemKey;
export const publishedItemToSiteId = menuItemSiteId;
export const publishedItemListKey = menuItemListKey;
export const diffMenuSnapshots = diffMenu;