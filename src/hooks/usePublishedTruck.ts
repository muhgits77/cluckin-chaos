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
  reload: () => void;
};

const POLL_MS = 45_000; // re-check after TruckDash publish

export function usePublishedTruck(truckIdOverride?: string): UsePublishedTruckResult {
  const truckId = truckIdOverride?.trim() || getTruckId();
  const [data, setData] = useState<PublishedPayload | null>(null);
  const [status, setStatus] = useState<PublishedTruckStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    let mounted = true;

    async function load(silent = false) {
      if (!silent) {
        setStatus((prev) => (prev === 'ready' ? prev : 'loading'));
        setError(null);
      }

      if (!isSupabaseConfigured()) {
        if (!mounted) return;
        console.warn('[usePublishedTruck] unconfigured', getSupabaseConfigHint());
        setData(null);
        setStatus('unconfigured');
        setError(getSupabaseConfigHint());
        return;
      }

      try {
        const result = await getLatestPublished(truckId);
        if (!mounted) return;

        setLastFetchedAt(new Date().toISOString());

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
          });
          return;
        }

        setData(result.data);
        setStatus('ready');
        setError(null);
        console.info('[usePublishedTruck] ready', {
          truckId,
          special: result.data.special,
          menuCount: result.data.menu.length,
          menuNames: result.data.menu.map((m) => m.name),
          scheduleCount: result.data.schedule.length,
          lastPublished: result.data.lastPublished,
        });
      } catch (err) {
        if (!mounted) return;
        console.error('[usePublishedTruck] exception', err);
        setData(null);
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
    if (!data?.menu?.length) return [];
    try {
      return publishedMenuToMenuItems(data.menu);
    } catch (err) {
      console.error('[usePublishedTruck] menu map failed', err, data.menu);
      // Minimal fallback so UI still shows names/prices
      return data.menu.map((m, i) => ({
        id: m.id || `fallback-${i}`,
        name: m.name,
        price: Number(String(m.price).replace(/[^0-9.]/g, '')) || 0,
        description: m.description || m.note || `Fresh from the truck — ${m.name}.`,
        category: 'mains' as const,
        image: '',
        tags: ['Live from TruckDash'],
      }));
    }
  }, [data]);

  const hasLiveData = status === 'ready' && isUsablePublish(data);

  return {
    data,
    status,
    error,
    truckId,
    hasLiveData,
    hasLiveMenu: hasLiveData && menuItems.length > 0,
    menuItems,
    configHint: getSupabaseConfigHint(),
    lastFetchedAt,
    reload,
  };
}
