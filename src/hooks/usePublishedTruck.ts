/**
 * Loads the latest TruckDash publish for this site's VITE_TRUCK_ID.
 * Auto-refreshes on focus + interval so TruckDash publishes show up live.
 *
 * Exposes pre-mapped `menuItems` so Live Board + Menu share one source of truth.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { publishedMenuToMenuItems } from '../lib/menuFromPublished';
import {
  getLatestPublished,
  getTruckId,
  isUsablePublish,
  type PublishedPayload,
} from '../lib/publishedTruck';
import { getSupabaseConfigHint, isSupabaseConfigured } from '../lib/supabase';
import type { MenuItem } from '../types';

export type PublishedTruckStatus =
  | 'loading'
  | 'ready'
  | 'empty'
  | 'unconfigured'
  | 'error';

export type UsePublishedTruckResult = {
  data: PublishedPayload | null;
  status: PublishedTruckStatus;
  error: string | null;
  truckId: string;
  /** True when we have usable publish content to display. */
  hasLiveData: boolean;
  /** True when the publish includes at least one menu line. */
  hasLiveMenu: boolean;
  /**
   * Full menu mapped for UI (name, price, description, image).
   * Empty array when offline / no menu — never null.
   */
  menuItems: MenuItem[];
  /** Human-readable config line for debug UI. */
  configHint: string;
  lastFetchedAt: string | null;
  /** Raw Supabase row for LiveBoard diagnostics. */
  rawRow: unknown;
  reload: () => void;
};

const POLL_MS = 45_000;

/** Ultra-safe fallback mapper — never throws, never depends on image imports. */
function emergencyMapMenu(data: PublishedPayload): MenuItem[] {
  const list = Array.isArray(data.menu) ? data.menu : [];
  return list.map((m, i) => ({
    id: `published-${m.id || i}`,
    name: m.name || `Item ${i + 1}`,
    price: Number(String(m.price ?? '').replace(/[^0-9.]/g, '')) || 0,
    description:
      m.description ||
      m.note ||
      `Fresh from the truck — ${m.name || 'menu item'}. Hand-prepped with Kentucky soul.`,
    category: 'mains' as const,
    image: m.image || '',
    tags: ['Live from TruckDash'],
  }));
}

export function usePublishedTruck(truckIdOverride?: string): UsePublishedTruckResult {
  const truckId = truckIdOverride?.trim() || getTruckId();
  const [data, setData] = useState<PublishedPayload | null>(null);
  const [status, setStatus] = useState<PublishedTruckStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);
  const [rawRow, setRawRow] = useState<unknown>(null);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let mounted = true;

    async function load(silent = false) {
      if (!silent) {
        setStatus((prev) => (prev === 'ready' ? prev : 'loading'));
        setError(null);
      }

      console.log('[usePublishedTruck] load start', {
        truckId,
        VITE_TRUCK_ID: import.meta.env.VITE_TRUCK_ID,
        configured: isSupabaseConfigured(),
        silent,
      });

      if (!isSupabaseConfigured()) {
        if (!mounted) return;
        console.warn('[usePublishedTruck] unconfigured', getSupabaseConfigHint());
        setData(null);
        setRawRow(null);
        setStatus('unconfigured');
        setError(getSupabaseConfigHint());
        return;
      }

      try {
        const result = await getLatestPublished(truckId);
        if (!mounted) return;

        setLastFetchedAt(new Date().toISOString());
        setRawRow(result.rawRow ?? null);

        console.log('[usePublishedTruck] getLatestPublished result', {
          truckId: result.truckId,
          reason: result.reason,
          error: result.error,
          hasData: !!result.data,
          menuCount: result.data?.menu?.length ?? 0,
          menu: result.data?.menu,
          scheduleCount: result.data?.schedule?.length ?? 0,
          rawRow: result.rawRow,
          rawError: result.rawError,
        });

        if (result.reason === 'unconfigured') {
          setData(null);
          setStatus('unconfigured');
          setError(result.error || getSupabaseConfigHint());
          return;
        }

        if (result.reason === 'error') {
          setData(null);
          setStatus('error');
          setError(result.error || 'Failed to load published data');
          return;
        }

        if (!result.data || !isUsablePublish(result.data)) {
          setData(result.data);
          setStatus('empty');
          setError(result.error || `No publish found for truck_id="${truckId}"`);
          console.warn('[usePublishedTruck] empty', {
            truckId,
            error: result.error,
            data: result.data,
          });
          return;
        }

        setData(result.data);
        setStatus('ready');
        setError(null);
        console.info('[usePublishedTruck] READY', {
          truckId,
          special: result.data.special,
          menuCount: result.data.menu.length,
          menuNames: result.data.menu.map((m) => `${m.name} ($${m.price})`),
          scheduleCount: result.data.schedule.length,
          lastPublished: result.data.lastPublished,
        });
      } catch (err) {
        if (!mounted) return;
        console.error('[usePublishedTruck] exception', err);
        setData(null);
        setRawRow(null);
        setError(err instanceof Error ? err.message : 'Failed to load published data');
        setStatus('error');
      }
    }

    void load(false);

    const onFocus = () => void load(true);
    const onVisible = () => {
      if (document.visibilityState === 'visible') void load(true);
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);

    const interval = window.setInterval(() => void load(true), POLL_MS);

    return () => {
      mounted = false;
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(interval);
    };
  }, [truckId, tick]);

  const menuItems = useMemo(() => {
    if (!data) return [];
    const rawLen = Array.isArray(data.menu) ? data.menu.length : 0;
    if (rawLen === 0) {
      console.warn('[usePublishedTruck] menuItems: data.menu empty', data);
      return [];
    }
    try {
      const mapped = publishedMenuToMenuItems(data.menu);
      console.log('[usePublishedTruck] menuItems mapped', {
        rawLen,
        mappedLen: mapped.length,
        names: mapped.map((m) => m.name),
      });
      if (mapped.length === 0) {
        console.warn('[usePublishedTruck] mapper returned empty — using emergency fallback');
        return emergencyMapMenu(data);
      }
      return mapped;
    } catch (err) {
      console.error('[usePublishedTruck] menu map failed — emergency fallback', err, data.menu);
      return emergencyMapMenu(data);
    }
  }, [data]);

  const hasLiveData = status === 'ready' && isUsablePublish(data);
  // Prefer raw menu length so UI still lights up even if mapper glitches
  const hasLiveMenu =
    hasLiveData && ((data?.menu?.length ?? 0) > 0 || menuItems.length > 0);

  return {
    data,
    status,
    error,
    truckId,
    hasLiveData,
    hasLiveMenu,
    menuItems,
    configHint: getSupabaseConfigHint(),
    lastFetchedAt,
    rawRow,
    reload,
  };
}
