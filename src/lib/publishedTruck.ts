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

/** Menu line from TruckDash (price stored as string). */
export type PublishedMenuItem = {
  id: string;
  name: string;
  price: string;
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

function asMenuArray(value: unknown): PublishedMenuItem[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is PublishedMenuItem =>
      !!item && typeof item === 'object' && typeof (item as PublishedMenuItem).name === 'string',
  );
}

function asScheduleArray(value: unknown): PublishedScheduleDay[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is PublishedScheduleDay =>
      !!item && typeof item === 'object' && typeof (item as PublishedScheduleDay).day === 'string',
  );
}

function rowToPayload(row: PublishedTruckRow): PublishedPayload {
  const payloadObj =
    row.payload && typeof row.payload === 'object' ? (row.payload as Record<string, unknown>) : {};

  const fromPayload: Partial<PublishedPayload> = {
    truckName: typeof payloadObj.truckName === 'string' ? payloadObj.truckName : undefined,
    phone: typeof payloadObj.phone === 'string' ? payloadObj.phone : undefined,
    orderUrl: typeof payloadObj.orderUrl === 'string' ? payloadObj.orderUrl : undefined,
    location: typeof payloadObj.location === 'string' ? payloadObj.location : undefined,
    hoursStart: typeof payloadObj.hoursStart === 'string' ? payloadObj.hoursStart : undefined,
    hoursEnd: typeof payloadObj.hoursEnd === 'string' ? payloadObj.hoursEnd : undefined,
    special: typeof payloadObj.special === 'string' ? payloadObj.special : undefined,
    menu: asMenuArray(payloadObj.menu),
    schedule: asScheduleArray(payloadObj.schedule),
    lastPublished:
      typeof payloadObj.lastPublished === 'string' ? payloadObj.lastPublished : undefined,
    version: typeof payloadObj.version === 'number' ? payloadObj.version : undefined,
  };

  const menu = asMenuArray(row.menu).length ? asMenuArray(row.menu) : fromPayload.menu || [];
  const schedule = asScheduleArray(row.schedule).length
    ? asScheduleArray(row.schedule)
    : fromPayload.schedule || [];

  return {
    ...DEFAULT_PUBLISHED,
    truckName: row.truck_name || fromPayload.truckName || '',
    phone: row.phone || fromPayload.phone || '',
    orderUrl: row.order_url || fromPayload.orderUrl || '',
    location: row.location || fromPayload.location || '',
    hoursStart: row.hours_start || fromPayload.hoursStart || '',
    hoursEnd: row.hours_end || fromPayload.hoursEnd || '',
    special: row.special || fromPayload.special || '',
    menu,
    schedule,
    lastPublished: row.last_published || fromPayload.lastPublished || '',
    version: row.version ?? fromPayload.version ?? 1,
  };
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
