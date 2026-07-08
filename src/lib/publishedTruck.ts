/**
 * Fetch the latest TruckDash publish for this food truck site.
 * Source of truth: Supabase published_trucks (same table as TruckDash).
 * Fallback: public/menu.json when Supabase is unavailable (local dev).
 */

import {
  getMaskedAnonKey,
  getSupabase,
  getSupabaseConfigHint,
  getSupabaseUrl,
  isSupabaseConfigured,
} from './supabase';

/** Menu line from TruckDash (price as string). */
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
  day: string;
  neighborhood: string;
  spot: string;
  hoursStart: string;
  hoursEnd: string;
  closed?: boolean;
  note?: string;
};

/** App-facing payload (camelCase). */
export type PublishedPayload = {
  truckId?: string;
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
  menu: PublishedMenuItem[] | unknown;
  schedule: PublishedScheduleDay[] | unknown;
  last_published: string | null;
  version: number | null;
  payload: PublishedPayload | Record<string, unknown> | null;
};

export type FetchPublishedResult = {
  data: PublishedPayload | null;
  reason?: string;
  error?: string;
  truckId: string;
  source?: 'supabase' | 'json' | null;
  rawRow?: unknown;
  rawError?: unknown;
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

/** Path served by Vite from public/menu.json (dev fallback only). */
export const MENU_JSON_URL =
  (import.meta.env.VITE_MENU_JSON_URL as string | undefined)?.trim() || '/menu.json';

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

function coerceString(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
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
      return coerceToArray(JSON.parse(trimmed) as unknown);
    } catch {
      return [];
    }
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (Array.isArray(obj.items)) return obj.items;
    if (Array.isArray(obj.menu)) return obj.menu;
    if (Array.isArray(obj.data)) return obj.data;
    const keys = Object.keys(obj);
    if (keys.length > 0 && keys.every((k) => /^\d+$/.test(k))) {
      return keys.sort((a, b) => Number(a) - Number(b)).map((k) => obj[k]);
    }
  }
  return [];
}

export function normalizePublishedMenuItem(
  raw: unknown,
  index = 0,
): PublishedMenuItem | null {
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

export function parseMenuPriceNumber(price: string): number {
  const num = Number(String(price || '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(num) ? num : 0;
}

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
  if (/\b(tea|lemonade|soda|coke|pepsi|water|drink|coffee|sweet tea|sprite|dr pepper)\b/.test(n)) {
    return 'drinks';
  }
  if (/\b(fries|slaw|chips|side|biscuit|cornbread|coleslaw|pickle|beans)\b/.test(n)) {
    return 'sides';
  }
  return 'mains';
}

function asScheduleArray(value: unknown): PublishedScheduleDay[] {
  return coerceToArray(value).filter(
    (item): item is PublishedScheduleDay =>
      !!item && typeof item === 'object' && typeof (item as PublishedScheduleDay).day === 'string',
  );
}

function rowToPayload(row: PublishedTruckRow): PublishedPayload {
  const payloadObj =
    row.payload && typeof row.payload === 'object' ? (row.payload as Record<string, unknown>) : {};

  const menu = pickBestMenu(row.menu, payloadObj.menu, payloadObj.items);

  const scheduleFromRow = asScheduleArray(row.schedule);
  const scheduleFromPayload = asScheduleArray(payloadObj.schedule);
  const schedule =
    scheduleFromRow.length >= scheduleFromPayload.length ? scheduleFromRow : scheduleFromPayload;

  const lastPublished =
    row.last_published ||
    (typeof payloadObj.lastPublished === 'string' ? payloadObj.lastPublished : '') ||
    strField(payloadObj, 'last_published') ||
    '';

  return {
    ...DEFAULT_PUBLISHED,
    truckId: row.truck_id || strField(payloadObj, 'truckId', 'truck_id') || getTruckId(),
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
}

/** Normalize flat menu.json export into PublishedPayload. */
export function normalizePublishedPayload(raw: unknown): PublishedPayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const nested =
    obj.payload && typeof obj.payload === 'object'
      ? (obj.payload as Record<string, unknown>)
      : {};

  const menu = pickBestMenu(obj.menu, nested.menu, nested.items);
  const scheduleFromTop = asScheduleArray(obj.schedule);
  const scheduleFromNested = asScheduleArray(nested.schedule);
  const schedule =
    scheduleFromTop.length >= scheduleFromNested.length ? scheduleFromTop : scheduleFromNested;

  const lastPublished =
    strField(obj, 'lastPublished', 'last_published') ||
    strField(nested, 'lastPublished', 'last_published') ||
    '';

  return {
    ...DEFAULT_PUBLISHED,
    truckId: strField(obj, 'truckId', 'truck_id') || getTruckId(),
    truckName: strField(obj, 'truckName', 'truck_name') || strField(nested, 'truckName') || '',
    phone: strField(obj, 'phone') || strField(nested, 'phone') || '',
    orderUrl: strField(obj, 'orderUrl', 'order_url') || strField(nested, 'orderUrl') || '',
    location: strField(obj, 'location') || strField(nested, 'location') || '',
    hoursStart:
      strField(obj, 'hoursStart', 'hours_start') || strField(nested, 'hoursStart') || '',
    hoursEnd: strField(obj, 'hoursEnd', 'hours_end') || strField(nested, 'hoursEnd') || '',
    special: strField(obj, 'special') || strField(nested, 'special') || '',
    menu,
    schedule,
    lastPublished,
    version:
      typeof obj.version === 'number'
        ? obj.version
        : typeof nested.version === 'number'
          ? nested.version
          : 1,
  };
}

export function isUsablePublish(payload: PublishedPayload | null | undefined): boolean {
  if (!payload) return false;
  if (payload.lastPublished?.trim()) return true;
  if (payload.menu.length > 0) return true;
  if (payload.schedule.length > 0) return true;
  if (payload.special?.trim() || payload.location?.trim()) return true;
  return false;
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
    menuNames: payload.menu.map((m) => m.name),
    menuPrices: payload.menu.map((m) => m.price),
  };
}

/** Dev fallback: public/menu.json (cache-busted). */
export async function getPublishedFromJson(
  url: string = MENU_JSON_URL,
): Promise<FetchPublishedResult> {
  const truckId = getTruckId();
  const fetchUrl = `${url}${url.includes('?') ? '&' : '?'}_=${Date.now()}`;

  console.info('[publishedTruck] Fetching menu.json fallback', { url: fetchUrl, truckId });

  try {
    const res = await fetch(fetchUrl, {
      cache: 'no-store',
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      const error = `menu.json HTTP ${res.status} ${res.statusText}`;
      console.warn('[publishedTruck] menu.json', error);
      return {
        data: null,
        reason: res.status === 404 ? 'empty' : 'error',
        error,
        truckId,
        source: null,
      };
    }

    const raw = (await res.json()) as unknown;
    console.log('[publishedTruck] RAW menu.json', raw);

    const data = normalizePublishedPayload(raw);
    if (!data || !isUsablePublish(data)) {
      return {
        data,
        reason: 'empty',
        error: 'menu.json is empty or missing menu/schedule/special',
        truckId,
        source: 'json',
        rawRow: raw,
      };
    }

    console.info('[publishedTruck] Loaded menu.json', summarizePayload(data, truckId));
    return { data, truckId: data.truckId || truckId, source: 'json', rawRow: raw };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load menu.json';
    console.error('[publishedTruck] menu.json fetch failed', err);
    return {
      data: null,
      reason: 'error',
      error: message,
      truckId,
      source: null,
      rawError: err,
    };
  }
}

/** Primary: Supabase published_trucks row for truck_id. */
export async function getLatestPublishedFromSupabase(
  truckId?: string,
): Promise<FetchPublishedResult> {
  const id = (truckId ?? getTruckId()).trim() || 'cluckin-chaos';

  if (!isSupabaseConfigured()) {
    console.warn('[publishedTruck] Supabase not configured', {
      truckId: id,
      hint: getSupabaseConfigHint(),
    });
    return {
      data: null,
      reason: 'unconfigured',
      error: 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY',
      truckId: id,
      source: null,
    };
  }

  const supabase = getSupabase();
  if (!supabase) {
    return {
      data: null,
      reason: 'unconfigured',
      error: 'Could not create Supabase client',
      truckId: id,
      source: null,
    };
  }

  console.info('[publishedTruck] Fetching published_trucks', {
    truckId: id,
    url: getSupabaseUrl(),
    select: SELECT_COLS,
  });

  const { data, error } = await supabase
    .from('published_trucks')
    .select(SELECT_COLS)
    .eq('truck_id', id)
    .maybeSingle();

  console.log('[publishedTruck] RAW Supabase response', {
    truckId: id,
    error,
    data,
    menuField: data && (data as PublishedTruckRow).menu,
    menuIsArray: data ? Array.isArray((data as PublishedTruckRow).menu) : false,
    menuLength: (() => {
      const menuField = data ? (data as PublishedTruckRow).menu : null;
      if (Array.isArray(menuField)) return menuField.length;
      if (typeof menuField === 'string') return `string(${menuField.length})`;
      return null;
    })(),
    payloadMenu:
      data &&
      (data as PublishedTruckRow).payload &&
      typeof (data as PublishedTruckRow).payload === 'object'
        ? (data as PublishedTruckRow).payload
        : null,
  });

  if (error) {
    console.warn('[publishedTruck] maybeSingle failed, trying list fallback', error);
    const list = await supabase
      .from('published_trucks')
      .select(SELECT_COLS)
      .eq('truck_id', id)
      .order('last_published', { ascending: false })
      .limit(1);

    console.log('[publishedTruck] RAW list fallback', list);

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
        source: null,
        rawError: list.error,
      };
    }

    const row = (list.data?.[0] as PublishedTruckRow | undefined) ?? null;
    if (!row) {
      console.warn('[publishedTruck] No row for truck_id', id);
      return {
        data: null,
        reason: 'empty',
        error: `No published_trucks row for truck_id="${id}"`,
        truckId: id,
        source: null,
        rawRow: list.data,
      };
    }

    const payload = rowToPayload(row);
    console.info('[publishedTruck] Loaded via list fallback', summarizePayload(payload, id));
    return { data: payload, truckId: id, source: 'supabase', rawRow: row };
  }

  if (!data) {
    console.warn('[publishedTruck] No row for truck_id', id);
    return {
      data: null,
      reason: 'empty',
      error: `No published_trucks row for truck_id="${id}"`,
      truckId: id,
      source: null,
    };
  }

  const payload = rowToPayload(data as PublishedTruckRow);
  console.info('[publishedTruck] Loaded + mapped', summarizePayload(payload, id));
  return { data: payload, truckId: id, source: 'supabase', rawRow: data };
}

/**
 * Load publish for the site:
 *   1) Supabase published_trucks (source of truth)
 *   2) public/menu.json only when Supabase is unavailable or empty
 */
export async function getLatestPublished(
  truckId?: string,
): Promise<FetchPublishedResult> {
  const id = (truckId ?? getTruckId()).trim() || 'cluckin-chaos';

  if (isSupabaseConfigured()) {
    const fromSb = await getLatestPublishedFromSupabase(id);
    if (fromSb.data && isUsablePublish(fromSb.data)) {
      if (fromSb.data.menu.length === 0 && fromSb.data.schedule.length > 0) {
        console.warn(
          '[publishedTruck] Schedule live but menu empty — check TruckDash publish includes menu[]',
          { truckId: id, rawRow: fromSb.rawRow },
        );
      }
      return fromSb;
    }

    console.info('[publishedTruck] Supabase empty/error, trying menu.json fallback', {
      truckId: id,
      reason: fromSb.reason,
      error: fromSb.error,
    });
    const fromJson = await getPublishedFromJson();
    if (fromJson.data && isUsablePublish(fromJson.data)) {
      return fromJson;
    }

    return {
      ...fromSb,
      error: fromSb.error || fromJson.error || 'No Supabase publish and no menu.json',
      truckId: id,
    };
  }

  console.info('[publishedTruck] Supabase not configured — using menu.json only', { truckId: id });
  const fromJson = await getPublishedFromJson();
  return {
    ...fromJson,
    truckId: id,
    error: fromJson.error || getSupabaseConfigHint(),
  };
}

export function getTodayWeekdayAbbr(date: Date = new Date()): string {
  return date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase().slice(0, 3);
}

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