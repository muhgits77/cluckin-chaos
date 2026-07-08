/**
 * Live menu & schedule board — pulls the latest TruckDash publish
 * from Supabase (published_trucks) for VITE_TRUCK_ID.
 *
 * Shows: today's special, location, hours, full menu, weekly schedule,
 * and "Last published" timestamp. Falls back gracefully when offline / empty.
 */

import {
  Sparkles,
  MapPin,
  Clock,
  Calendar,
  Flame,
  RefreshCw,
  AlertCircle,
  Radio,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useMemo } from 'react';
import type { UsePublishedTruckResult } from '../hooks/usePublishedTruck';
import { publishedMenuToMenuItems } from '../lib/menuFromPublished';
import {
  formatHoursRange,
  formatMenuPrice,
  formatPublishedTimestamp,
  getTodayWeekdayAbbr,
  getTruckId,
  weekdayAbbrToFull,
  type PublishedScheduleDay,
} from '../lib/publishedTruck';
import PublishedMenuGrid from './PublishedMenuGrid';
import type { MenuItem } from '../types';

function scheduleLocation(day: PublishedScheduleDay): string {
  const parts = [day.spot, day.neighborhood].filter(Boolean);
  return parts.join(' · ') || 'TBA';
}

function scheduleHours(day: PublishedScheduleDay): string {
  if (day.closed) return day.note?.trim() || 'Closed';
  const range = formatHoursRange(day.hoursStart, day.hoursEnd);
  return range || day.note?.trim() || 'Hours TBA';
}

type LiveBoardProps = {
  published: UsePublishedTruckResult;
  onAddToCart?: (item: MenuItem) => void;
};

export default function LiveBoard({ published, onAddToCart }: LiveBoardProps) {
  const {
    data,
    status,
    error,
    hasLiveData,
    hasLiveMenu,
    menuItems: hookMenuItems,
    reload,
    truckId,
    configHint,
    lastFetchedAt,
    rawRow,
  } = published;

  // Bulletproof: prefer hook menuItems; if empty but data.menu has rows, map here
  const liveMenuItems = useMemo(() => {
    if (hookMenuItems.length > 0) return hookMenuItems;
    if (data?.menu?.length) {
      console.warn('[LiveBoard] hook menuItems empty but data.menu has items — remapping locally');
      try {
        return publishedMenuToMenuItems(data.menu);
      } catch (e) {
        console.error('[LiveBoard] local remap failed', e);
        return data.menu.map((m, i) => ({
          id: `lb-${m.id || i}`,
          name: m.name,
          price: Number(String(m.price).replace(/[^0-9.]/g, '')) || 0,
          description: m.description || `Fresh from the truck — ${m.name}.`,
          category: 'mains' as const,
          image: '',
          tags: ['Live from TruckDash'],
        }));
      }
    }
    return [];
  }, [hookMenuItems, data?.menu]);

  // ── TEMP DIAGNOSTIC LOGS (remove after verifying menu) ──
  useEffect(() => {
    const envTruckId = import.meta.env.VITE_TRUCK_ID;
    console.group('%c[LiveBoard DIAGNOSTIC]', 'color:#f59e0b;font-weight:bold');
    console.log('VITE_TRUCK_ID (import.meta.env):', envTruckId);
    console.log('getTruckId():', getTruckId());
    console.log('hook truckId:', truckId);
    console.log('status:', status);
    console.log('error:', error);
    console.log('configHint:', configHint);
    console.log('hasLiveData:', hasLiveData);
    console.log('hasLiveMenu:', hasLiveMenu);
    console.log('lastFetchedAt:', lastFetchedAt);
    console.log('FULL published.data:', data);
    console.log('data.menu (raw array):', data?.menu);
    console.log('data.menu length:', data?.menu?.length ?? 0);
    console.log('hookMenuItems length:', hookMenuItems.length);
    console.log('liveMenuItems length:', liveMenuItems.length);
    console.log('liveMenuItems:', liveMenuItems);
    console.log('FULL raw Supabase row:', rawRow);
    if (error) console.error('LiveBoard error state:', error);
    console.groupEnd();
  }, [
    truckId,
    status,
    error,
    configHint,
    hasLiveData,
    hasLiveMenu,
    lastFetchedAt,
    data,
    hookMenuItems,
    liveMenuItems,
    rawRow,
  ]);

  const todayAbbr = getTodayWeekdayAbbr();
  const todayRow = data?.schedule?.find((d) => d.day.toUpperCase() === todayAbbr);
  const hoursToday =
    todayRow && !todayRow.closed
      ? formatHoursRange(todayRow.hoursStart, todayRow.hoursEnd)
      : formatHoursRange(data?.hoursStart || '', data?.hoursEnd || '');
  const locationToday =
    (todayRow && !todayRow.closed && scheduleLocation(todayRow)) ||
    data?.location ||
    '';

  const showMenu =
    hasLiveData && (liveMenuItems.length > 0 || (data?.menu?.length ?? 0) > 0);

  return (
    <section
      id="live-board"
      className="py-16 sm:py-20 bg-slate-950 relative border-b border-slate-900"
      aria-labelledby="live-board-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <span className="text-brand-yellow font-mono text-xs uppercase tracking-widest font-extrabold inline-flex items-center justify-center gap-1.5">
            <Radio className="w-4 h-4 animate-pulse" />
            Live from TruckDash
          </span>
          <h2
            id="live-board-heading"
            className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight text-white"
          >
            Today&apos;s <span className="text-brand-red">Chaos Board</span>
          </h2>
          <div className="h-1.5 w-24 bg-gradient-to-r from-brand-yellow to-brand-red mx-auto rounded-full" />
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Menu, specials, and the weekly Lake Cumberland route — updated whenever Jesse hits
            Publish in TruckDash.
          </p>
        </div>

        {/* Loading */}
        {status === 'loading' && (
          <div
            className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400"
            role="status"
            aria-live="polite"
          >
            <RefreshCw className="w-8 h-8 animate-spin text-brand-yellow" />
            <p className="font-mono text-xs uppercase tracking-widest">Loading live board…</p>
          </div>
        )}

        {/* Unconfigured / empty / error fallbacks */}
        {(status === 'unconfigured' || status === 'empty' || status === 'error') && (
          <div className="max-w-2xl mx-auto mb-10">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-center space-y-3">
              <AlertCircle className="w-8 h-8 mx-auto text-brand-amber" />
              <h3 className="font-display font-black text-white uppercase tracking-tight text-lg">
                {status === 'unconfigured'
                  ? 'Live board not connected yet'
                  : status === 'empty'
                    ? 'No published menu yet'
                    : 'Couldn’t reach the live board'}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {status === 'unconfigured' && (
                  <>
                    Add <code className="text-brand-yellow text-xs">VITE_SUPABASE_URL</code>,{' '}
                    <code className="text-brand-yellow text-xs">VITE_SUPABASE_ANON_KEY</code>, and{' '}
                    <code className="text-brand-yellow text-xs">VITE_TRUCK_ID=cluckin-chaos</code> to{' '}
                    <code className="text-brand-yellow text-xs">.env.local</code> (or Vercel env), then
                    restart the dev server / redeploy. Use the <strong>same</strong> Supabase project
                    as TruckDash. The static menu below still works.
                  </>
                )}
                {status === 'empty' && (
                  <>
                    Looking for truck_id{' '}
                    <code className="text-brand-yellow text-xs">{truckId}</code>. In TruckDash:
                    Settings → Truck ID = this value → enable Supabase Sync → sign in →{' '}
                    <strong>Publish Updates to My Website</strong>.
                  </>
                )}
                {status === 'error' && (
                  <>
                    {error || 'Something went wrong loading from Supabase.'} Showing the site
                    menu below so you can still order.
                  </>
                )}
              </p>
              {/* Connection debug (helps when env/RLS/truck_id mismatch) */}
              <div className="text-left bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1 font-mono text-[10px] text-slate-500">
                <p>
                  <span className="text-slate-400">status:</span> {status}
                </p>
                <p>
                  <span className="text-slate-400">truck_id:</span>{' '}
                  <span className="text-brand-yellow">{truckId}</span>
                </p>
                <p className="break-all">
                  <span className="text-slate-400">supabase:</span> {configHint}
                </p>
                {error && (
                  <p className="break-all text-red-400/90">
                    <span className="text-slate-400">error:</span> {error}
                  </p>
                )}
                {lastFetchedAt && (
                  <p>
                    <span className="text-slate-400">last fetch:</span>{' '}
                    {formatPublishedTimestamp(lastFetchedAt)}
                  </p>
                )}
                <p className="text-slate-600 pt-1">
                  Open browser console for [publishedTruck] / [usePublishedTruck] logs.
                </p>
              </div>
              <button
                type="button"
                onClick={reload}
                className="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-brand-yellow font-display text-xs font-black uppercase tracking-widest hover:border-brand-yellow/50 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Try again
              </button>
            </div>
          </div>
        )}

        {/* Live content */}
        {hasLiveData && data && (
          <div className="space-y-10">
            {/* Snapshot cards: special · location · hours */}
            <div className="grid sm:grid-cols-3 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-brand-red/20 to-slate-900 border border-brand-red/40 rounded-2xl p-5 sm:p-6 shadow-lg space-y-2 relative overflow-hidden"
              >
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-brand-yellow/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex items-center gap-2 text-brand-yellow font-mono text-[10px] uppercase tracking-widest font-black">
                  <Flame className="w-4 h-4 fill-brand-yellow" />
                  Today&apos;s Special
                </div>
                <p className="font-display font-extrabold text-xl text-white uppercase tracking-tight leading-snug">
                  {data.special?.trim() || 'Ask the window — board is cooking'}
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.05 }}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-lg space-y-2"
              >
                <div className="flex items-center gap-2 text-brand-amber font-mono text-[10px] uppercase tracking-widest font-black">
                  <MapPin className="w-4 h-4" />
                  Where we&apos;re parked
                </div>
                <p className="font-display font-bold text-lg text-white leading-snug">
                  {locationToday || 'Location TBA — check back soon'}
                </p>
                {data.truckName && (
                  <p className="text-slate-500 text-xs font-mono uppercase tracking-wider">
                    {data.truckName}
                  </p>
                )}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-lg space-y-2"
              >
                <div className="flex items-center gap-2 text-emerald-400 font-mono text-[10px] uppercase tracking-widest font-black">
                  <Clock className="w-4 h-4" />
                  Hours today
                </div>
                <p className="font-display font-bold text-lg text-white leading-snug">
                  {todayRow?.closed
                    ? todayRow.note || 'Closed today'
                    : hoursToday || 'Hours TBA'}
                </p>
                <p className="text-slate-500 text-xs font-mono uppercase tracking-wider">
                  {weekdayAbbrToFull(todayAbbr)}
                </p>
              </motion.div>
            </div>

            {/* Full published menu (TruckDash `menu` array via Supabase) */}
            <div id="live-menu" className="space-y-4 scroll-mt-28">
              {showMenu && liveMenuItems.length > 0 ? (
                <PublishedMenuGrid
                  items={liveMenuItems}
                  onAddToCart={onAddToCart}
                  lastPublished={data.lastPublished}
                  truckName={data.truckName}
                  variant="board"
                />
              ) : showMenu && data.menu.length > 0 ? (
                /* Last-resort plain list if card mapper fails */
                <div className="space-y-3">
                  <h3 className="font-display font-black text-xl uppercase text-white tracking-tight">
                    Published Menu
                  </h3>
                  <ul className="space-y-2">
                    {data.menu.map((item) => (
                      <li
                        key={item.id || item.name}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3.5"
                      >
                        <div>
                          <span className="font-display font-bold text-white uppercase tracking-tight">
                            {item.name}
                          </span>
                          {(item.description || item.note) && (
                            <p className="text-slate-400 text-xs mt-0.5">
                              {item.description || item.note}
                            </p>
                          )}
                        </div>
                        <span className="font-mono font-black text-brand-yellow shrink-0">
                          {formatMenuPrice(item.price)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="bg-slate-900 border border-dashed border-amber-900/40 rounded-2xl p-6 text-center space-y-2">
                  <p className="font-display font-black text-white uppercase text-sm tracking-tight">
                    Menu not in this publish yet
                  </p>
                  <p className="text-slate-400 text-xs leading-relaxed max-w-md mx-auto">
                    Schedule is live, but the <code className="text-brand-yellow">menu</code> array
                    is empty. In TruckDash, add menu items and hit{' '}
                    <strong className="text-slate-200">Publish Updates to My Website</strong> again.
                  </p>
                  <p className="font-mono text-[10px] text-slate-600">
                    truck_id={truckId} · data.menu={data.menu?.length ?? 0} · mapped=
                    {liveMenuItems.length}
                  </p>
                </div>
              )}
              {liveMenuItems.length > 0 && (
                <p className="text-center text-[11px] text-slate-500 font-mono">
                  {liveMenuItems.length} item{liveMenuItems.length === 1 ? '' : 's'} from Supabase ·{' '}
                  <a href="#menu" className="text-brand-yellow hover:underline">
                    Jump to full menu section
                  </a>
                </p>
              )}

              {/* TEMP on-screen diagnostic strip */}
              <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 px-4 py-3 font-mono text-[10px] text-amber-200/90 space-y-1">
                <p className="font-bold uppercase tracking-widest text-brand-yellow">
                  Temporary Supabase diagnostic
                </p>
                <p>VITE_TRUCK_ID = {String(import.meta.env.VITE_TRUCK_ID ?? '(undefined)')}</p>
                <p>resolved truckId = {truckId}</p>
                <p>
                  status={status} · hasLiveData={String(hasLiveData)} · hasLiveMenu=
                  {String(hasLiveMenu)} · showMenu={String(showMenu)}
                </p>
                <p>
                  data.menu.length={data.menu?.length ?? 0} · liveMenuItems=
                  {liveMenuItems.length}
                </p>
                <p className="break-all">
                  menu names:{' '}
                  {(data.menu || []).map((m) => m.name).join(', ') || '(none)'}
                </p>
                {error && <p className="text-red-400">error: {error}</p>}
                <p className="text-amber-200/50">See browser console: [LiveBoard DIAGNOSTIC]</p>
              </div>
            </div>

            {/* Weekly schedule */}
            <div className="space-y-4">
              <h3 className="font-display font-black text-lg uppercase tracking-tight text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-red" />
                Weekly Schedule
              </h3>

              {data.schedule.length === 0 ? (
                <div className="bg-slate-900 border border-dashed border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-sm">
                  No weekly route published yet. See Find Us below for the usual stops.
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {data.schedule.map((day) => {
                    const isToday = day.day.toUpperCase() === todayAbbr;
                    return (
                      <div
                        key={day.id || day.day}
                        className={`p-4 rounded-xl border flex flex-col gap-1.5 transition-all ${
                          isToday
                            ? 'bg-slate-900 border-brand-red shadow-md ring-1 ring-brand-red/25'
                            : day.closed
                              ? 'bg-slate-900/60 border-slate-800/80 opacity-70'
                              : 'bg-slate-900 border-slate-800 hover:border-brand-yellow/30'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-display font-extrabold text-sm uppercase tracking-wide text-slate-200">
                              {weekdayAbbrToFull(day.day)}
                            </span>
                            {isToday && (
                              <span className="bg-green-900/30 text-green-400 text-[9px] font-mono uppercase font-black px-2 py-0.5 rounded-md flex items-center gap-1 border border-green-800/30 animate-pulse">
                                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                                Today
                              </span>
                            )}
                            {day.closed && (
                              <span className="bg-slate-950 text-slate-500 text-[9px] font-mono uppercase font-semibold px-2 py-0.5 rounded-md border border-slate-800">
                                Closed
                              </span>
                            )}
                          </div>
                          <span className="font-mono text-[11px] text-slate-400 font-semibold shrink-0">
                            {scheduleHours(day)}
                          </span>
                        </div>
                        {!day.closed && (
                          <div className="flex items-start gap-1.5 text-slate-300 text-xs">
                            <MapPin className="w-3.5 h-3.5 text-brand-amber shrink-0 mt-0.5" />
                            <span>{scheduleLocation(day)}</span>
                          </div>
                        )}
                        {day.note && !day.closed && (
                          <p className="text-[11px] text-slate-500 font-mono pl-5">{day.note}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Last published + refresh */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-900">
              <p className="text-slate-500 font-mono text-[11px] uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-brand-yellow" />
                Last published:{' '}
                <span className="text-slate-300 font-semibold normal-case tracking-normal">
                  {formatPublishedTimestamp(data.lastPublished)}
                </span>
              </p>
              <button
                type="button"
                onClick={reload}
                className="inline-flex items-center gap-2 text-xs font-display font-black uppercase tracking-widest text-slate-400 hover:text-brand-yellow transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh board
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
