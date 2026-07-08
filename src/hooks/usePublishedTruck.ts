/**
 * React hook: polls Supabase published_trucks for VITE_TRUCK_ID.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { publishedMenuToMenuItems } from '../lib/menuFromPublished';
import {
  diffMenu,
  fetchPublishedTruck,
  getTruckId,
  hasPublishedData,
  type PublishedPayload,
} from '../lib/publishedTruck';
import { getSupabaseConfigHint } from '../lib/supabase';
import type { MenuItem } from '../types';

export type PublishedTruckStatus = 'loading' | 'ready' | 'empty' | 'unconfigured' | 'error';

export type UsePublishedTruckResult = {
  data: PublishedPayload | null;
  status: PublishedTruckStatus;
  error: string | null;
  truckId: string;
  hasLiveData: boolean;
  hasLiveMenu: boolean;
  menuItems: MenuItem[];
  configHint: string;
  lastFetchedAt: string | null;
  reload: () => void;
};

const POLL_MS = 30_000;

export function usePublishedTruck(truckIdOverride?: string): UsePublishedTruckResult {
  const truckId = truckIdOverride?.trim() || getTruckId();
  const [data, setData] = useState<PublishedPayload | null>(null);
  const [status, setStatus] = useState<PublishedTruckStatus>('loading');
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const prevMenu = useRef<PublishedPayload['menu']>([]);

  const reload = useCallback(() => setTick((n) => n + 1), []);

  useEffect(() => {
    let alive = true;

    async function load(silent = false) {
      if (!silent) setStatus((s) => (s === 'ready' ? s : 'loading'));

      console.log('[usePublishedTruck] fetch', { truckId, silent });

      const result = await fetchPublishedTruck(truckId);
      if (!alive) return;

      setLastFetchedAt(new Date().toISOString());

      if (!result.ok || !result.data) {
        const isConfig = result.error?.includes('Missing') || result.error?.includes('not configured');
        setData(null);
        setStatus(isConfig ? 'unconfigured' : result.error?.includes('No row') ? 'empty' : 'error');
        setError(result.error);
        console.warn('[usePublishedTruck] failed', result);
        return;
      }

      if (!hasPublishedData(result.data)) {
        setData(result.data);
        setStatus('empty');
        setError(`No publish content for truck_id="${truckId}"`);
        return;
      }

      const changes = diffMenu(prevMenu.current, result.data.menu);
      if (changes.added.length || changes.removed.length || changes.updated.length) {
        console.info('[usePublishedTruck] menu changes', changes);
      }
      prevMenu.current = result.data.menu;

      setData(result.data);
      setStatus('ready');
      setError(null);

      console.info('[usePublishedTruck] ready', {
        truckId,
        menu: result.data.menu.length,
        schedule: result.data.schedule.length,
        lastPublished: result.data.lastPublished,
      });
    }

    void load();

    const onRefresh = () => void load(true);
    window.addEventListener('focus', onRefresh);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') onRefresh();
    });
    const timer = setInterval(() => void load(true), POLL_MS);

    return () => {
      alive = false;
      window.removeEventListener('focus', onRefresh);
      clearInterval(timer);
    };
  }, [truckId, tick]);

  const menuItems = useMemo(
    () => (data?.menu ? publishedMenuToMenuItems(data.menu) : []),
    [data],
  );

  const hasLiveData = status === 'ready' && hasPublishedData(data);
  const hasLiveMenu = hasLiveData && menuItems.length > 0;

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
    reload,
  };
}