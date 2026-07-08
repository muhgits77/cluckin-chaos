/**
 * Fetch the latest TruckDash publish for this food truck site.
 * Source of truth: public.published_trucks (same table as TruckDash).
 */

import {
  getMaskedAnonKey,
  getSupabase,
  getSupabaseUrl,
  isSupabaseConfigured,
} from './supabase';

/**
 * Menu line from TruckDash.
 * Core fields: id, name, price (string). Optional extras if owner/app adds them later.
 */
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

/** One day on the weekly route from TruckDash. */
export type PublishedScheduleDay = {
  id: string;
  day: string; // MON, TUE, ...
  neighborhood: string;
  spot: string;
  hoursStart: string;
  hoursEnd: string;
  closed?: boolean;
  note?: string;
};

/** App-facing payload (camelCase). */
export type PublishedPayload = {
  truckName: string;
  phone: string;
  orderUrl: string;
  location: string;
  hoursStart: string;
  hoursEnd: string;
  special: string;
  menu: PublishedMenuItem[];
  schedule: PublishedScheduleDay[];
  lastPublished: string; // ISO
  version: number;
};

/** Row shape from published_trucks (snake_case). */
export type PublishedTruckRow = {
  id: string;
  truck_id: string;
  user_id: string | null;
  truck_name: string;
  phone: string;
  order_url: string;
  location: string;
  hours_start: string;
  hours_end: string;
  special: string;
  menu: PublishedMenuItem[] | null;
  schedule: PublishedScheduleDay[] | null;
  last_published: string | null;
  version: number | null;
  payload: PublishedPayload | Record<string, unknown> | null;
};

export type FetchPublishedResult = {
  data: PublishedPayload | null;
  /** Why we didn't get data (for UI / debug). */
  reason?: string;
  /** Raw PostgREST / network error message. */
  error?: string;
  truckId: string;
};

const DEFAULT_PUBLISHED: PublishedPayload = {
  truckName: '',
  phone: '',
  orderUrl: '',
  location: '',
  hoursStart: '',
  hoursEnd: '',
  special: '',
  menu: [],
  schedule: [],
  lastPublished: '',
  version: 1,
};

const SELECT_COLS =
  'id, truck_id, user_id, truck_name, phone, order_url, location, hours_start, hours_end, special, menu, schedule, last_published, version, payload';

/** Truck id from env, default cluckin-chaos for this site. */
export function getTruckId(): string {
  const fromEnv = (import.meta.env.VITE_TRUCK_ID as string | undefined)?.trim();
  return fromEnv || 'cluckin-chaos';
}

function strField(obj: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return undefined;
}

/** Coerce unknown values that may be JSON strings / wrappers into an array. */
function coerceToArray(value: unknown): unknown[] {
  if (value == null) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      return coerceToArray(parsed);
    } catch {
      return [];
    }
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    // TruckDash / future shapes: { items: [...] } or { menu: [...] }
    if (Array.isArray(obj.items)) return obj.items;
    if (Array.isArray(obj.menu)) return obj.menu;
    if (Array.isArray(obj.data)) return obj.data;
  }
  return [];
}

function coerceString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return undefined;
}

/** Normalize a raw JSON menu line from TruckDash / Supabase. */
export function normalizePublishedMenuItem(
  raw: unknown,
  index = 0,
): PublishedMenuItem | null {
  // Plain string line: "Pulled Pork Sandwich"
  if (typeof raw === 'string' && raw.trim()) {
    const name = raw.trim();
    return {
      id: `pub-${index}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name,
      price: '',
    };
  }

  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;

  const name =
    strField(obj, 'name', 'title', 'item', 'item_name', 'itemName', 'label') ||
    coerceString(obj.name);
  if (!name) return null;

  const priceRaw = obj.price ?? obj.cost ?? obj.amount ?? obj.Price ?? '';
  const price = coerceString(priceRaw) ?? '';

  const id =
    strField(obj, 'id') ||
    coerceString(obj.id) ||
    `pub-${index}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

  const tagsRaw = obj.tags ?? obj.labels;
  const tags = Array.isArray(tagsRaw)
    ? tagsRaw.filter((t): t is string => typeof t === 'string' && !!t.trim())
    : undefined;

  return {
    id,
    name,
    price,
    description: strField(obj, 'description', 'desc', 'details', 'blurb', 'about'),
    category: strField(obj, 'category', 'type', 'section'),
    tags,
    image: strField(obj, 'image', 'imageUrl', 'photo', 'img', 'image_url'),
    note: strField(obj, 'note', 'notes'),
  };
}

/**
 * Parse published menu from column or payload (handles arrays, JSON strings, wrappers).
 */
export function asMenuArray(value: unknown): PublishedMenuItem[] {
  const list = coerceToArray(value);
  const out: PublishedMenuItem[] = [];
  for (let i = 0; i < list.length; i++) {
    const item = normalizePublishedMenuItem(list[i], i);
    if (item) out.push(item);
  }
  return out;
}

/** Prefer the richest non-empty menu source (column vs payload). */
export function pickBestMenu(...sources: unknown[]): PublishedMenuItem[] {
  let best: PublishedMenuItem[] = [];
  for (const source of sources) {
    const parsed = asMenuArray(source);
    if (parsed.length > best.length) best = parsed;
  }
  return best;
}

/** Parse price string ("10", "$10.00") to number for cart / display math. */
export function parseMenuPriceNumber(price: string): number {
  const num = Number(String(price || '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(num) ? num : 0;
}

/** Guess category from name when TruckDash doesn't send one. */
export function inferMenuCategory(
  name: string,
  explicit?: string,
): 'mains' | 'sides' | 'drinks' {
  const cat = (explicit || '').toLowerCase();
  if (cat.includes('drink') || cat.includes('bev') || cat.includes('tea') || cat.includes('soda')) {
    return 'drinks';
  }
  if (cat.includes('side') || cat.includes('extra') || cat.includes('snack')) {
    return 'sides';
  }
  if (cat.includes('main') || cat.includes('entree') || cat.includes('entrée')) {
    return 'mains';
  }

  const n = name.toLowerCase();
  if (
    /\b(tea|lemonade|soda|coke|pepsi|water|drink|coffee|sweet tea|sprite|dr pepper)\b/.test(n)
  ) {
    return 'drinks';
  }
  if (
    /\b(fries|slaw|chips|side|biscuit|cornbread|coleslaw|pickle|beans)\b/.test(n)
  ) {
    return 'sides';
  }
  return 'mains';
}

function asScheduleArray(value: unknown): PublishedScheduleDay[] {
  const list = coerceToArray(value);
  return list.filter(
    (item): item is PublishedScheduleDay =>
      !!item && typeof item === 'object' && typeof (item as PublishedScheduleDay).day === 'string',
  );
}

function rowToPayload(row: PublishedTruckRow): PublishedPayload {
  const payloadObj =
    row.payload && typeof row.payload === 'object' ? (row.payload as Record<string, unknown>) : {};

  // Merge menu from BOTH the menu column and payload.menu (whichever is richer).
  // This fixes cases where one side is empty / stringified / nested.
  const menu = pickBestMenu(row.menu, payloadObj.menu, payloadObj.items);

  const scheduleFromRow = asScheduleArray(row.schedule);
  const scheduleFromPayload = asScheduleArray(payloadObj.schedule);
  const schedule =
    scheduleFromRow.length >= scheduleFromPayload.length ? scheduleFromRow : scheduleFromPayload;

  const lastPublished =
    row.last_published ||
    (typeof payloadObj.lastPublished === 'string' ? payloadObj.lastPublished : '') ||
    '';

  const payload: PublishedPayload = {
    ...DEFAULT_PUBLISHED,
    truckName:
      row.truck_name ||
      (typeof payloadObj.truckName === 'string' ? payloadObj.truckName : '') ||
      '',
    phone: row.phone || (typeof payloadObj.phone === 'string' ? payloadObj.phone : '') || '',
    orderUrl:
      row.order_url || (typeof payloadObj.orderUrl === 'string' ? payloadObj.orderUrl : '') || '',
    location:
      row.location || (typeof payloadObj.location === 'string' ? payloadObj.location : '') || '',
    hoursStart:
      row.hours_start ||
      (typeof payloadObj.hoursStart === 'string' ? payloadObj.hoursStart : '') ||
      '',
    hoursEnd:
      row.hours_end || (typeof payloadObj.hoursEnd === 'string' ? payloadObj.hoursEnd : '') || '',
    special: row.special || (typeof payloadObj.special === 'string' ? payloadObj.special : '') || '',
    menu,
    schedule,
    lastPublished,
    version: row.version ?? (typeof payloadObj.version === 'number' ? payloadObj.version : 1),
  };

  if (import.meta.env.DEV) {
    console.info('[publishedTruck] rowToPayload menu', {
      columnMenu: Array.isArray(row.menu) ? row.menu.length : typeof row.menu,
      payloadMenu: Array.isArray(payloadObj.menu) ? (payloadObj.menu as unknown[]).length : typeof payloadObj.menu,
      resolvedMenu: menu.length,
      sample: menu.slice(0, 2).map((m) => m.name),
    });
  }

  return payload;
}

/**
 * True when a row has usable publish content (timestamp and/or menu/schedule).
 * TruckDash always sets last_published on publish.
 */
export function isUsablePublish(payload: PublishedPayload | null | undefined): boolean {
  if (!payload) return false;
  if (payload.lastPublished?.trim()) return true;
  if (payload.menu.length > 0) return true;
  if (payload.schedule.length > 0) return true;
  if (payload.special?.trim() || payload.location?.trim()) return true;
  return false;
}

/**
 * Fetch the latest published row for truck_id.
 * Returns structured result with reason/error for debugging.
 */
export async function getLatestPublished(
  truckId?: string,
): Promise<FetchPublishedResult> {
  const id = (truckId ?? getTruckId()).trim() || 'cluckin-chaos';

  if (!isSupabaseConfigured()) {
    console.warn('[publishedTruck] Supabase not configured', {
      truckId: id,
      url: getSupabaseUrl() || '(empty)',
      key: getMaskedAnonKey(),
    });
    return {
      data: null,
      reason: 'unconfigured',
      error: 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY',
      truckId: id,
    };
  }

  const supabase = getSupabase();
  if (!supabase) {
    return {
      data: null,
      reason: 'unconfigured',
      error: 'Could not create Supabase client',
      truckId: id,
    };
  }

  console.info('[publishedTruck] Fetching published_trucks', {
    truckId: id,
    url: getSupabaseUrl(),
  });

  // truck_id is UNIQUE — single row per truck. Prefer eq + maybeSingle (no order needed).
  const { data, error } = await supabase
    .from('published_trucks')
    .select(SELECT_COLS)
    .eq('truck_id', id)
    .maybeSingle();

  if (error) {
    // Fallback: list query (helps diagnose RLS / multiple-row edge cases)
    console.warn('[publishedTruck] maybeSingle failed, trying list', error);
    const list = await supabase
      .from('published_trucks')
      .select(SELECT_COLS)
      .eq('truck_id', id)
      .order('last_published', { ascending: false })
      .limit(1);

    if (list.error) {
      console.error('[publishedTruck] Fetch error', {
        truckId: id,
        message: list.error.message,
        code: list.error.code,
        details: list.error.details,
        hint: list.error.hint,
      });
      return {
        data: null,
        reason: 'error',
        error: list.error.message || error.message,
        truckId: id,
      };
    }

    const row = (list.data?.[0] as PublishedTruckRow | undefined) ?? null;
    if (!row) {
      console.warn('[publishedTruck] No row for truck_id', id);
      return {
        data: null,
        reason: 'empty',
        error: `No published_trucks row for truck_id="${id}". Publish from TruckDash with this id.`,
        truckId: id,
      };
    }

    const payload = rowToPayload(row);
    console.info('[publishedTruck] Loaded via list fallback', summarizePayload(payload, id));
    return { data: payload, truckId: id };
  }

  if (!data) {
    console.warn('[publishedTruck] No row for truck_id', id, {
      tip: 'In TruckDash Settings set Truck ID to this value, enable Supabase Sync, sign in, then Publish.',
    });
    return {
      data: null,
      reason: 'empty',
      error: `No published_trucks row for truck_id="${id}". Publish from TruckDash with this id.`,
      truckId: id,
    };
  }

  const payload = rowToPayload(data as PublishedTruckRow);
  console.info('[publishedTruck] Loaded', summarizePayload(payload, id));
  return { data: payload, truckId: id };
}

function summarizePayload(payload: PublishedPayload, truckId: string) {
  return {
    truckId,
    truckName: payload.truckName,
    special: payload.special,
    location: payload.location,
    menuCount: payload.menu.length,
    scheduleCount: payload.schedule.length,
    lastPublished: payload.lastPublished,
  };
}

/** MON / TUE / … matching TruckDash schedule day keys. */
export function getTodayWeekdayAbbr(date: Date = new Date()): string {
  return date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase().slice(0, 3);
}

/** Full weekday name from abbr (for display). */
export function weekdayAbbrToFull(abbr: string): string {
  const map: Record<string, string> = {
    SUN: 'Sunday',
    MON: 'Monday',
    TUE: 'Tuesday',
    WED: 'Wednesday',
    THU: 'Thursday',
    FRI: 'Friday',
    SAT: 'Saturday',
  };
  return map[abbr.toUpperCase()] || abbr;
}

export function formatHoursRange(start: string, end: string): string {
  const s = start?.trim();
  const e = end?.trim();
  if (s && e) return `${s} – ${e}`;
  if (s) return s;
  if (e) return e;
  return '';
}

export function formatPublishedTimestamp(iso: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

/** Format a menu price string for display. */
export function formatMenuPrice(price: string): string {
  const raw = (price || '').trim();
  if (!raw) return '—';
  if (raw.startsWith('$')) return raw;
  const num = Number(raw.replace(/[^0-9.]/g, ''));
  if (!Number.isNaN(num) && raw.match(/[0-9]/)) {
    return `$${num.toFixed(2)}`;
  }
  return raw;
}
