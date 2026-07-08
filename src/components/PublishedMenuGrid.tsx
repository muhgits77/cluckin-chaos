/**
 * Full published menu grid — TruckDash / Supabase payload.
 * Warm Kentucky fried-chicken styling matching Cluckin' Chaos.
 */

import { Flame, Plus, Check, Radio, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import type { MenuItem } from '../types';
import { menuItemPriceLabel } from '../lib/menuFromPublished';
import { formatPublishedTimestamp } from '../lib/publishedTruck';

type PublishedMenuGridProps = {
  items: MenuItem[];
  onAddToCart?: (item: MenuItem) => void;
  /** Optional “last published” line under the heading */
  lastPublished?: string;
  truckName?: string;
  /** Compact cards (Live Board) vs full interactive (Menu section) */
  variant?: 'board' | 'menu';
};

export default function PublishedMenuGrid({
  items,
  onAddToCart,
  lastPublished,
  truckName,
  variant = 'board',
}: PublishedMenuGridProps) {
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  if (items.length === 0) {
    return (
      <div className="bg-slate-900 border border-dashed border-slate-800 rounded-2xl p-8 text-center text-slate-400 text-sm">
        No menu items in this TruckDash publish yet.
      </div>
    );
  }

  const handleAdd = (item: MenuItem) => {
    if (!onAddToCart) return;
    onAddToCart(item);
    setAddedIds((prev) => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [item.id]: false }));
    }, 1400);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div className="space-y-1">
          <span className="text-brand-yellow font-mono text-[10px] uppercase tracking-widest font-extrabold inline-flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            Live from TruckDash
            {truckName ? ` · ${truckName}` : ''}
          </span>
          <h3 className="font-display font-black text-xl sm:text-2xl uppercase tracking-tight text-white flex items-center gap-2">
            <Flame className="w-5 h-5 text-brand-red fill-brand-red" />
            Full Published Menu
          </h3>
          <p className="text-slate-400 text-xs sm:text-sm max-w-xl">
            What&apos;s on the board right now — prices and items update when the truck hits
            Publish in TruckDash.
          </p>
        </div>
        {lastPublished && (
          <p className="text-slate-500 font-mono text-[10px] uppercase tracking-wider shrink-0">
            Updated {formatPublishedTimestamp(lastPublished)}
          </p>
        )}
      </div>

      <div
        className={
          variant === 'menu'
            ? 'grid sm:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'grid sm:grid-cols-2 gap-4'
        }
      >
        {items.map((item, index) => {
          const isDrink = item.category === 'drinks';
          const isSide = item.category === 'sides';
          const borderHover = isDrink
            ? 'hover:border-sky-500/40'
            : isSide
              ? 'hover:border-amber-500/40'
              : 'hover:border-brand-red/40';
          const priceColor = isDrink
            ? 'text-sky-400 border-sky-500'
            : isSide
              ? 'text-brand-yellow border-brand-yellow'
              : 'text-brand-yellow border-brand-yellow/40';
          const badgeBg = isDrink
            ? 'bg-sky-700'
            : isSide
              ? 'bg-amber-700'
              : 'bg-brand-red/90';

          return (
            <motion.article
              key={item.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(index * 0.04, 0.24) }}
              className={`bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col group transition-all duration-300 ${borderHover}`}
            >
              {/* Image */}
              <div className="aspect-[16/10] w-full overflow-hidden relative bg-slate-950">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-red-950/40 to-slate-950">
                    <Flame className="w-12 h-12 text-brand-yellow/40 fill-brand-yellow/20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

                <div
                  className={`absolute top-3 right-3 bg-slate-950/95 border-2 font-mono font-black px-3 py-1 rounded-full text-sm shadow-lg backdrop-blur-md ${priceColor}`}
                >
                  {menuItemPriceLabel(item)}
                </div>

                <div
                  className={`absolute bottom-3 left-3 ${badgeBg} text-white font-mono text-[10px] font-black px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1 uppercase tracking-widest border border-white/10`}
                >
                  {isDrink ? (
                    <>
                      <Sparkles className="w-3 h-3 text-brand-yellow" /> Ice Cold
                    </>
                  ) : isSide ? (
                    <>
                      <Flame className="w-3 h-3 text-brand-yellow fill-brand-yellow" /> Side Kick
                    </>
                  ) : (
                    <>
                      <Flame className="w-3 h-3 text-brand-yellow fill-brand-yellow" />
                      {item.chaosLevel ? `Chaos lvl ${item.chaosLevel}` : 'Fresh Main'}
                    </>
                  )}
                </div>
              </div>

              {/* Body */}
              <div className="p-5 flex flex-col flex-grow space-y-3">
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="bg-slate-950 text-brand-yellow font-mono text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded border border-slate-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <h4 className="font-display font-black text-lg text-white uppercase tracking-tight group-hover:text-brand-red transition-colors leading-snug">
                  {item.name}
                </h4>

                <p className="text-slate-400 text-xs leading-relaxed flex-grow line-clamp-3">
                  {item.description}
                </p>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  <span className="font-mono text-sm font-black text-brand-yellow">
                    {menuItemPriceLabel(item)}
                  </span>
                  {onAddToCart ? (
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleAdd(item)}
                      className={`py-2 px-3.5 rounded-xl font-display text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-colors ${
                        addedIds[item.id]
                          ? 'bg-green-600 text-white'
                          : isDrink
                            ? 'bg-sky-600 hover:bg-sky-500 text-white'
                            : isSide
                              ? 'bg-amber-600 hover:bg-amber-500 text-white'
                              : 'bg-brand-red hover:bg-brand-red-hover text-white'
                      }`}
                    >
                      {addedIds[item.id] ? (
                        <>
                          <Check className="w-4 h-4" /> Added!
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4" /> Add
                        </>
                      )}
                    </motion.button>
                  ) : (
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">
                      On the truck board
                    </span>
                  )}
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>
    </div>
  );
}
