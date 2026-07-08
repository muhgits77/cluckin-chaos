/**
 * Loads the latest TruckDash publish for this site's VITE_TRUCK_ID.
 * Auto-refreshes on focus + interval so TruckDash publishes show up live.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  getLatestPublished,
  getTruckId,
  isUsablePublish,
  type PublishedPayload,
} from '../lib/publishedTruck';
import { getSupabaseConfigHint, isSupabaseConfigured } from '../lib/supabase';

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
        if (import.meta.env.DEV) {
          console.info('[usePublishedTruck] ready', {
            truckId,
            special: result.data.special,
            menu: result.data.menu.length,
            schedule: result.data.schedule.length,
            lastPublished: result.data.lastPublished,
          });
        }
      } catch (err) {
        if (!mounted) return;
        console.error('[usePublishedTruck] exception', err);
        setData(null);
        setError(err instanceof Error ? err.message : 'Failed to load published data');
        setStatus('error');
      }
    }

    void load(false);

    // Refresh when user returns to the tab (after publishing from TruckDash)
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

  return {
    data,
    status,
    error,
    truckId,
    hasLiveData: status === 'ready' && isUsablePublish(data),
    configHint: getSupabaseConfigHint(),
    lastFetchedAt,
    reload,
  };
}
