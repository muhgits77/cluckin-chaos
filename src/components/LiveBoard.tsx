/**
 * Live board — today's special, location, hours, menu, schedule from Supabase.
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
import type { UsePublishedTruckResult } from '../hooks/usePublishedTruck';
import {
  formatHoursRange,
  formatPublishedTimestamp,
  getTodayWeekdayAbbr,
  weekdayAbbrToFull,
  type PublishedScheduleDay,
} from '../lib/publishedTruck';
import PublishedMenuGrid from './PublishedMenuGrid';
import type { MenuItem } from '../types';

function scheduleLocation(day: PublishedScheduleDay): string {
  return [day.spot, day.neighborhood].filter(Boolean).join(' · ') || 'TBA';
}

function scheduleHours(day: PublishedScheduleDay): string {
  if (day.closed) return day.note?.trim() || 'Closed';
  return formatHoursRange(day.hoursStart, day.hoursEnd) || day.note?.trim() || 'Hours TBA';
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
    menuItems,
    reload,
    truckId,
    configHint,
    lastFetchedAt,
  } = published;

  const todayAbbr = getTodayWeekdayAbbr();
  const todayRow = data?.schedule?.find((d) => d.day.toUpperCase() === todayAbbr);
  const hoursToday =
    todayRow && !todayRow.closed
      ? formatHoursRange(todayRow.hoursStart, todayRow.hoursEnd)
      : formatHoursRange(data?.hoursStart || '', data?.hoursEnd || '');
  const locationToday =
    (todayRow && !todayRow.closed && scheduleLocation(todayRow)) || data?.location || '';

  return (
    <section
      id="live-board"
      className="py-16 sm:py-20 bg-slate-950 relative border-b border-slate-900"
      aria-labelledby="live-board-heading"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
            Menu, specials, and weekly route — loaded from Supabase Storage when Jesse hits
            Publish in TruckDash.
          </p>
        </div>

        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400" role="status">
            <RefreshCw className="w-8 h-8 animate-spin text-brand-yellow" />
            <p className="font-mono text-xs uppercase tracking-widest">Loading menu-data bucket…</p>
          </div>
        )}

        {(status === 'unconfigured' || status === 'empty' || status === 'error') && (
          <div className="max-w-2xl mx-auto mb-10">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 text-center space-y-3">
              <AlertCircle className="w-8 h-8 mx-auto text-brand-amber" />
              <h3 className="font-display font-black text-white uppercase tracking-tight text-lg">
                {status === 'unconfigured'
                  ? 'Supabase not connected'
                  : status === 'empty'
                    ? 'No published data yet'
                    : 'Could not load live board'}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {status === 'unconfigured' && (
                  <>
                    Set <code className="text-brand-yellow text-xs">VITE_SUPABASE_URL</code>,{' '}
                    <code className="text-brand-yellow text-xs">VITE_SUPABASE_ANON_KEY</code>, and{' '}
                    <code className="text-brand-yellow text-xs">VITE_TRUCK_ID</code> in{' '}
                    <code className="text-brand-yellow text-xs">.env.local</code> or Vercel, then
                    redeploy.
                  </>
                )}
                {status === 'empty' && (
                  <>
                    No row for <code className="text-brand-yellow text-xs">{truckId}</code>. In
                    TruckDash: set Truck ID → enable Supabase Sync → Publish.
                  </>
                )}
                {status === 'error' && (error || 'Check console for details.')}
              </p>
              <div className="text-left bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-[10px] text-slate-500 space-y-1">
                <p>truck_id: <span className="text-brand-yellow">{truckId}</span></p>
                <p className="break-all">{configHint}</p>
                {error && <p className="text-red-400/90">{error}</p>}
              </div>
              <button
                type="button"
                onClick={reload}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-950 border border-slate-700 text-brand-yellow font-display text-xs font-black uppercase tracking-widest hover:border-brand-yellow/50"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Try again
              </button>
            </div>
          </div>
        )}

        {hasLiveData && data && (
          <div className="space-y-10">
            <div className="grid sm:grid-cols-3 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-brand-red/20 to-slate-900 border border-brand-red/40 rounded-2xl p-5 sm:p-6 shadow-lg space-y-2 relative overflow-hidden"
              >
                <div className="flex items-center gap-2 text-brand-yellow font-mono text-[10px] uppercase tracking-widest font-black">
                  <Flame className="w-4 h-4 fill-brand-yellow" />
                  Today&apos;s Special
                </div>
                <p className="font-display font-extrabold text-xl text-white uppercase tracking-tight">
                  {data.special?.trim() || 'Ask the window'}
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
                <p className="font-display font-bold text-lg text-white">
                  {locationToday || 'Location TBA'}
                </p>
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
                <p className="font-display font-bold text-lg text-white">
                  {todayRow?.closed ? todayRow.note || 'Closed today' : hoursToday || 'Hours TBA'}
                </p>
              </motion.div>
            </div>

            <div id="live-menu" className="space-y-4 scroll-mt-28">
              {hasLiveMenu ? (
                <PublishedMenuGrid
                  items={menuItems}
                  onAddToCart={onAddToCart}
                  lastPublished={data.lastPublished}
                  truckName={data.truckName}
                  variant="board"
                />
              ) : (
                <div className="bg-slate-900 border border-dashed border-amber-900/40 rounded-2xl p-6 text-center text-slate-400 text-sm">
                  Schedule is live but menu is empty — add items in TruckDash and Publish.
                </div>
              )}
              <p className="text-center font-mono text-[10px] text-slate-600">
                menu-data/{truckId}/menu.json · items={data.menu.length} · schedule=
                {data.schedule.length}
                {lastFetchedAt && ` · ${formatPublishedTimestamp(lastFetchedAt)}`}
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-display font-black text-lg uppercase tracking-tight text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-brand-red" />
                Weekly Schedule
              </h3>
              {data.schedule.length === 0 ? (
                <div className="bg-slate-900 border border-dashed border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-sm">
                  No schedule published yet.
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {data.schedule.map((day) => {
                    const isToday = day.day.toUpperCase() === todayAbbr;
                    return (
                      <div
                        key={day.id || day.day}
                        className={`p-4 rounded-xl border flex flex-col gap-1.5 ${
                          isToday
                            ? 'bg-slate-900 border-brand-red ring-1 ring-brand-red/25'
                            : 'bg-slate-900 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-display font-extrabold text-sm uppercase text-slate-200">
                            {weekdayAbbrToFull(day.day)}
                          </span>
                          <span className="font-mono text-[11px] text-slate-400">
                            {scheduleHours(day)}
                          </span>
                        </div>
                        {!day.closed && (
                          <div className="flex items-start gap-1.5 text-slate-300 text-xs">
                            <MapPin className="w-3.5 h-3.5 text-brand-amber shrink-0 mt-0.5" />
                            <span>{scheduleLocation(day)}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-900">
              <p className="text-slate-500 font-mono text-[11px] uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-brand-yellow" />
                Last published:{' '}
                <span className="text-slate-300 normal-case">
                  {formatPublishedTimestamp(data.lastPublished)}
                </span>
              </p>
              <button
                type="button"
                onClick={reload}
                className="inline-flex items-center gap-2 text-xs font-display font-black uppercase tracking-widest text-slate-400 hover:text-brand-yellow"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}