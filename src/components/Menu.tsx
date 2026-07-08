import React, { useState } from 'react';
import { Flame, Plus, Search, Check, Sparkles, Filter, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MenuItem } from '../types';
import { MENU_ITEMS } from '../data';
import type { UsePublishedTruckResult } from '../hooks/usePublishedTruck';
import PublishedMenuGrid from './PublishedMenuGrid';

interface MenuProps {
  onAddToCart: (item: MenuItem) => void;
  /** TruckDash / Supabase publish — when menuItems present, that is the source of truth. */
  published?: UsePublishedTruckResult;
}

export default function Menu({ onAddToCart, published }: MenuProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'mains' | 'sides' | 'drinks'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [addedItemIds, setAddedItemIds] = useState<Record<string, boolean>>({});
  const [detailedItem, setDetailedItem] = useState<MenuItem | null>(null);
  const [isWrapSelected, setIsWrapSelected] = useState(false);

  // Prefer pre-mapped menu from the publish hook (single source of truth with Live Board).
  // Also accept raw data.menu length so we don't fall back to static while live data exists.
  const isLiveMenu = !!(
    published?.hasLiveData &&
    ((published.menuItems?.length ?? 0) > 0 || (published.data?.menu?.length ?? 0) > 0)
  );
  const sourceItems: MenuItem[] =
    isLiveMenu && (published!.menuItems?.length ?? 0) > 0
      ? published!.menuItems
      : isLiveMenu && published!.data?.menu?.length
        ? published!.data.menu.map(
            (m, i): MenuItem => ({
              id: `published-${m.id || i}`,
              name: m.name,
              price: Number(String(m.price).replace(/[^0-9.]/g, '')) || 0,
              description:
                m.description ||
                m.note ||
                `Fresh from the truck — ${m.name}. Hand-prepped with Kentucky soul.`,
              category: 'mains',
              image: '',
              tags: ['Live from TruckDash'],
              chaosLevel: 1,
            }),
          )
        : MENU_ITEMS;

  const categories = [
    { id: 'all', name: 'Full Menu' },
    { id: 'mains', name: 'Cluckin\' Mains' },
    { id: 'sides', name: 'Chaos Sides' },
    { id: 'drinks', name: 'Southern Brews' },
  ] as const;

  const filteredItems = sourceItems.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      (item.description || '').toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const handleOpenDetailed = (item: MenuItem) => {
    setIsWrapSelected(false);
    setDetailedItem(item);
  };

  const handleAddToCartWithWrap = (item: MenuItem, e?: React.MouseEvent, forceWrap = false) => {
    if (e) e.stopPropagation(); // prevent opening detailed modal
    
    let finalItem = item;
    const shouldMakeWrap = forceWrap || (item.id.startsWith('salad_') && isWrapSelected);
    
    if (item.id.startsWith('salad_') && shouldMakeWrap) {
      finalItem = {
        ...item,
        id: `${item.id}_wrap`,
        name: item.name.replace(" Salad", " Wrap"),
        price: item.price + 1.00,
        description: `Warm, toasted flour tortilla wrap stuffed with ${item.description.toLowerCase().replace("salad", "wrap")}`
      };
    }
    
    onAddToCart(finalItem);
    
    // Show a quick success checkmark on the button for the base item
    setAddedItemIds((prev) => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setAddedItemIds((prev) => ({ ...prev, [item.id]: false }));
    }, 1500);
  };

  return (
    <section id="menu" className="py-20 bg-slate-950 relative border-b border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-brand-red font-mono text-xs uppercase tracking-widest font-extrabold flex items-center justify-center gap-1">
            {isLiveMenu ? (
              <>
                <Radio className="w-4.5 h-4.5 animate-pulse" /> Live from TruckDash
              </>
            ) : (
              <>
                <Sparkles className="w-4.5 h-4.5" /> High-Voltage Comfort Food
              </>
            )}
          </span>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl uppercase tracking-tight text-white">
            {isLiveMenu ? (
              <>
                Today&apos;s <span className="text-brand-red">Published Menu</span>
              </>
            ) : (
              <>
                The Interactive <span className="text-brand-red">Chaos Menu</span>
              </>
            )}
          </h2>
          <div className="h-1.5 w-24 bg-gradient-to-r from-brand-yellow to-brand-red mx-auto rounded-full"></div>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            {isLiveMenu
              ? 'Pulled live from TruckDash via Supabase — same board the truck publishes for the road. Prices and items stay in sync when Jesse hits Publish.'
              : 'Every item is prepared raw, double-dipped in seasoned milk-wash, hand-breaded in our 12-spice dry rub, and fried fresh on location. Warning: Highly addictive southern flavors.'}
          </p>
        </div>

        {/* Filter Toolbar (Search + Tabs) */}
        <div id="menu-toolbar" className="flex flex-col md:flex-row gap-4 items-center justify-between mb-12 bg-slate-900 p-4 rounded-2xl border border-slate-800">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2.5 rounded-xl font-display text-xs font-black uppercase tracking-wider transition-all duration-200 ${
                  selectedCategory === cat.id
                    ? 'bg-brand-red text-white shadow-md shadow-brand-red/20'
                    : 'bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative w-full md:max-w-sm shrink-0">
            <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder={isLiveMenu ? 'Search published menu…' : 'Search tenders, tea, fries...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 pl-9 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-red focus:bg-slate-950 transition-all text-white font-sans placeholder-slate-500"
            />
          </div>
        </div>

        {/* Live published menu — primary when Supabase has TruckDash menu[] */}
        {isLiveMenu && (
          <div id="menu-items-grid" className="mb-4">
            <PublishedMenuGrid
              items={filteredItems}
              onAddToCart={onAddToCart}
              lastPublished={published?.data?.lastPublished}
              truckName={published?.data?.truckName}
              variant="menu"
            />
            {filteredItems.length === 0 && (
              <div className="col-span-full text-center py-12 bg-slate-900 rounded-2xl border border-dashed border-slate-800 space-y-3 mt-4">
                <Filter className="w-10 h-10 mx-auto text-slate-600" />
                <h4 className="font-display font-black text-white uppercase text-lg">No Items Match Filter</h4>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                  }}
                  className="text-xs bg-brand-red text-white py-2 px-4 rounded-xl uppercase font-black tracking-widest font-display"
                >
                  Show All Published Items
                </button>
              </div>
            )}
          </div>
        )}

        {/* Static catalog grid — only when TruckDash menu is not live */}
        <div
          className={`grid sm:grid-cols-2 lg:grid-cols-3 gap-8 ${isLiveMenu ? 'hidden' : ''}`}
        >
          <AnimatePresence mode="popLayout">
            {filteredItems.map((item) => (
              <motion.div
                layout
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                onClick={() => handleOpenDetailed(item)}
                className={
                  item.id === 'fries'
                    ? "bg-slate-900 border border-amber-950 rounded-2xl overflow-hidden shadow-xl hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(234,179,8,0.18)] transition-all duration-500 flex flex-col group cursor-pointer relative"
                    : item.id.startsWith('salad_')
                    ? "bg-slate-900 border border-emerald-950/80 rounded-2xl overflow-hidden shadow-xl hover:border-emerald-500/30 hover:shadow-[0_0_25px_rgba(16,185,129,0.08)] transition-all duration-300 flex flex-col group cursor-pointer relative"
                    : item.category === 'drinks'
                    ? "bg-slate-900 border border-sky-950/80 rounded-2xl overflow-hidden shadow-xl hover:border-sky-500/30 hover:shadow-[0_0_25px_rgba(14,165,233,0.08)] transition-all duration-300 flex flex-col group cursor-pointer relative"
                    : "bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl hover:border-red-900/40 hover:shadow-2xl transition-all duration-300 flex flex-col group cursor-pointer relative"
                }
              >
                {/* Image Wrap */}
                <div className="aspect-video w-full overflow-hidden relative bg-slate-950">
                  <img
                    src={item.image}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Subtle steam particles/plumes effect overlay for hot Crispy Chaos Fries */}
                  {item.id === 'fries' && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden mix-blend-screen opacity-25">
                      {/* Steam Plume 1 */}
                      <motion.div
                        initial={{ y: 80, x: 20, opacity: 0, scaleY: 0.5 }}
                        animate={{ 
                          y: -100, 
                          x: [20, 15, 25, 20],
                          opacity: [0, 0.4, 0.4, 0],
                          scaleY: [0.5, 1, 1.5, 2]
                        }}
                        transition={{
                          duration: 4,
                          repeat: Infinity,
                          ease: "linear",
                          delay: 0
                        }}
                        className="absolute bottom-4 left-1/4 w-12 h-24 bg-gradient-to-t from-transparent via-white/20 to-transparent blur-xl rounded-full"
                      />
                      {/* Steam Plume 2 */}
                      <motion.div
                        initial={{ y: 80, x: -10, opacity: 0, scaleY: 0.5 }}
                        animate={{ 
                          y: -100, 
                          x: [-10, -5, -15, -10],
                          opacity: [0, 0.5, 0.5, 0],
                          scaleY: [0.5, 1.2, 1.6, 2.2]
                        }}
                        transition={{
                          duration: 5,
                          repeat: Infinity,
                          ease: "linear",
                          delay: 1.5
                        }}
                        className="absolute bottom-4 left-1/2 w-16 h-32 bg-gradient-to-t from-transparent via-white/25 to-transparent blur-2xl rounded-full"
                      />
                      {/* Steam Plume 3 */}
                      <motion.div
                        initial={{ y: 80, x: 5, opacity: 0, scaleY: 0.5 }}
                        animate={{ 
                          y: -100, 
                          x: [5, 10, 0, 5],
                          opacity: [0, 0.3, 0.3, 0],
                          scaleY: [0.5, 1, 1.4, 1.8]
                        }}
                        transition={{
                          duration: 4.5,
                          repeat: Infinity,
                          ease: "linear",
                          delay: 3
                        }}
                        className="absolute bottom-4 left-2/3 w-10 h-20 bg-gradient-to-t from-transparent via-white/15 to-transparent blur-xl rounded-full"
                      />
                    </div>
                  )}

                  {/* Floating Price Tag */}
                  {item.id === 'fries' ? (
                    <div className="absolute top-4 right-4 bg-slate-950/90 border-2 border-brand-yellow text-brand-yellow font-mono font-black px-3.5 py-1.5 rounded-full text-sm shadow-lg backdrop-blur-md">
                      ${item.price.toFixed(2)}
                    </div>
                  ) : item.id.startsWith('salad_') ? (
                    <div className="absolute top-4 right-4 bg-slate-950/95 border-2 border-emerald-500 text-emerald-400 font-mono font-black px-3.5 py-1.5 rounded-full text-sm shadow-lg backdrop-blur-md">
                      ${item.price.toFixed(2)}
                    </div>
                  ) : item.category === 'drinks' ? (
                    <div className="absolute top-4 right-4 bg-slate-950/95 border-2 border-sky-500 text-sky-400 font-mono font-black px-3.5 py-1.5 rounded-full text-sm shadow-lg backdrop-blur-md">
                      ${item.price.toFixed(2)}
                    </div>
                  ) : (
                    <div className="absolute top-4 right-4 bg-slate-950 border border-brand-yellow/30 text-brand-yellow font-mono font-black px-3 py-1 rounded-full text-sm shadow-md">
                      ${item.price.toFixed(2)}
                    </div>
                  )}

                  {/* Spicy / Chaos Flame Badge */}
                  {item.id === 'fries' ? (
                    <div className="absolute bottom-4 left-4 bg-red-600 text-white font-mono text-[10px] font-black px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1 uppercase tracking-widest border border-red-500/30">
                      <Flame className="w-3.5 h-3.5 text-brand-yellow fill-brand-yellow shrink-0 animate-bounce" />
                      CHAOS LVL 1
                    </div>
                  ) : item.id.startsWith('salad_') ? (
                    <div className="absolute bottom-4 left-4 bg-emerald-700 text-white font-mono text-[10px] font-black px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1 uppercase tracking-widest border border-emerald-600/30">
                      <Sparkles className="w-3.5 h-3.5 text-brand-yellow fill-brand-yellow shrink-0 animate-spin" />
                      FRESH MAIN
                    </div>
                  ) : item.category === 'drinks' ? (
                    <div className="absolute bottom-4 left-4 bg-sky-700 text-white font-mono text-[10px] font-black px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1 uppercase tracking-widest border border-sky-600/30">
                      <Sparkles className="w-3.5 h-3.5 text-brand-yellow fill-brand-yellow shrink-0 animate-spin" />
                      ICE COLD
                    </div>
                  ) : (
                    item.chaosLevel !== undefined && item.chaosLevel > 0 && (
                      <div className="absolute bottom-4 left-4 bg-brand-red/90 text-white font-mono text-[10px] font-black px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1 uppercase tracking-widest backdrop-blur-sm border border-white/10">
                        <Flame className="w-3.5 h-3.5 text-brand-yellow fill-brand-yellow shrink-0 animate-bounce" />
                        Chaos lvl {item.chaosLevel}
                      </div>
                    )
                  )}
                </div>

                {/* Content */}
                <div className="p-6 flex flex-col flex-grow space-y-3">
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {item.tags?.map((tag) => {
                      const isFries = item.id === 'fries';
                      const isHouseSeasoned = tag.toLowerCase() === 'house seasoned';
                      const isAlwaysHot = tag.toLowerCase() === 'always hot';
                      const isSalad = item.id.startsWith('salad_');
                      const isDrink = item.category === 'drinks';
                      return (
                        <span
                          key={tag}
                          className={
                            isFries
                              ? isHouseSeasoned
                                ? "bg-amber-950/40 text-brand-yellow font-mono text-[9px] uppercase font-black tracking-widest px-2.5 py-1 rounded border border-brand-yellow/25"
                                : isAlwaysHot
                                ? "bg-red-950/40 text-red-400 font-mono text-[9px] uppercase font-black tracking-widest px-2.5 py-1 rounded border border-red-900/25"
                                : "bg-slate-950 text-brand-yellow font-mono text-[9px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded border border-slate-850"
                              : isSalad
                              ? tag === 'Wrap Option'
                                ? "bg-amber-950/40 text-brand-yellow font-mono text-[9px] uppercase font-black tracking-widest px-2.5 py-0.5 rounded border border-brand-yellow/30"
                                : "bg-emerald-950/40 text-emerald-400 font-mono text-[9px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded border border-emerald-900/20"
                              : isDrink
                              ? "bg-sky-950/40 text-sky-400 font-mono text-[9px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded border border-sky-900/20"
                              : "bg-slate-950 text-brand-yellow font-mono text-[9px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded border border-slate-850"
                          }
                        >
                          {tag}
                        </span>
                      );
                    })}
                  </div>

                  {/* Title */}
                  <h3 className={`font-display font-black text-xl text-white uppercase tracking-tight transition-colors ${
                    item.id === 'fries' 
                      ? 'group-hover:text-brand-yellow text-2xl tracking-tight' 
                      : item.id.startsWith('salad_')
                      ? 'group-hover:text-emerald-400'
                      : item.category === 'drinks'
                      ? 'group-hover:text-sky-400'
                      : 'group-hover:text-brand-red'
                  }`}>
                    {item.name}
                  </h3>

                  {/* Description */}
                  <p className="text-slate-400 text-xs leading-relaxed flex-grow line-clamp-3">
                    {item.description}
                  </p>

                  {/* Card Action footer */}
                  <div className="pt-4 border-t border-slate-850 flex items-center justify-between">
                    <span className={`text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold transition-colors ${
                      item.category === 'drinks' 
                        ? 'group-hover:text-sky-400' 
                        : item.id.startsWith('salad_') 
                        ? 'group-hover:text-emerald-400' 
                        : 'group-hover:text-brand-red'
                    }`}>
                      Customize & View
                    </span>
                    <motion.button
                      id={`add-to-cart-${item.id}`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={(e) => handleAddToCartWithWrap(item, e)}
                      className={`py-2 px-4 rounded-xl font-display text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-colors ${
                        addedItemIds[item.id]
                          ? 'bg-green-600 text-white'
                          : item.id.startsWith('salad_')
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          : item.category === 'drinks'
                          ? 'bg-sky-600 hover:bg-sky-500 text-white'
                          : 'bg-brand-red hover:bg-brand-red-hover text-white'
                      }`}
                    >
                      {addedItemIds[item.id] ? (
                        <>
                          <Check className="w-4.5 h-4.5" />
                          Added!
                        </>
                      ) : (
                        <>
                          <Plus className="w-4.5 h-4.5" />
                          Add to Cart
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredItems.length === 0 && (
            <div className="col-span-full text-center py-12 bg-slate-900 rounded-2xl border border-dashed border-slate-800 space-y-3">
              <Filter className="w-10 h-10 mx-auto text-slate-650" />
              <h4 className="font-display font-black text-white uppercase text-lg">No Items Match Filter</h4>
              <p className="text-slate-400 text-xs">Try clearing your search query or choosing another menu tab!</p>
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSearchQuery('');
                }}
                className="text-xs bg-brand-red text-white py-2 px-4 rounded-xl uppercase font-black tracking-widest font-display"
              >
                Show All Items
              </button>
            </div>
          )}
        </div>

        {/* Detailed Menu Item Customization Modal */}
        <AnimatePresence>
          {detailedItem && (
            <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDetailedItem(null)}
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
              />

              {/* Modal Box */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden max-w-xl w-full relative z-10 flex flex-col"
              >
                {/* Header Image */}
                <div className="aspect-video w-full relative bg-slate-950">
                  <img
                    src={detailedItem.image}
                    alt={detailedItem.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <button
                    id="close-detailed-modal"
                    onClick={() => setDetailedItem(null)}
                    className="absolute top-4 right-4 bg-slate-950/80 text-white hover:bg-brand-red p-2 rounded-full backdrop-blur-sm transition-colors border border-slate-800"
                    aria-label="Close modal"
                  >
                    ✕
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="font-display font-extrabold text-2xl uppercase tracking-tight text-white">
                        {isWrapSelected && detailedItem.id.startsWith('salad_') 
                          ? detailedItem.name.replace(" Salad", " Wrap") 
                          : detailedItem.name}
                      </h3>
                      {detailedItem.tags && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {detailedItem.tags.map((tag) => (
                            <span
                              key={tag}
                              className={
                                detailedItem.category === 'drinks'
                                  ? "bg-slate-950 text-sky-400 font-mono text-[9px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded border border-slate-850/80"
                                  : detailedItem.id.startsWith('salad_')
                                  ? "bg-slate-950 text-emerald-400 font-mono text-[9px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded border border-slate-850/80"
                                  : "bg-slate-950 text-brand-yellow font-mono text-[9px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded border border-slate-850"
                              }
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className={`font-mono font-black text-2xl shrink-0 ${
                      detailedItem.category === 'drinks' 
                        ? 'text-sky-400' 
                        : detailedItem.id.startsWith('salad_') 
                        ? 'text-emerald-400' 
                        : 'text-brand-red'
                    }`}>
                      ${(isWrapSelected && detailedItem.id.startsWith('salad_') ? detailedItem.price + 1.00 : detailedItem.price).toFixed(2)}
                    </span>
                  </div>

                  <p className="text-slate-300 text-sm leading-relaxed">
                    {isWrapSelected && detailedItem.id.startsWith('salad_')
                      ? `Warm, toasted flour tortilla wrap stuffed with ${detailedItem.description.toLowerCase().replace("salad", "wrap")}`
                      : detailedItem.description}
                  </p>

                  {/* Interactive Salad to Wrap Upcharge Section */}
                  {detailedItem.id.startsWith('salad_') && (
                    <div className="bg-slate-950 p-4 rounded-xl border border-emerald-900/30 space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="font-display font-black text-xs uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                          🌯 Make it a Kentucky Wrap!
                        </h4>
                        <span className="text-xs bg-amber-500/10 text-brand-yellow px-2 py-0.5 rounded font-mono font-bold border border-brand-yellow/20">
                          +$1.00 Upcharge
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-normal">
                        Stuffed in a warm, toasted flour tortilla with extra Colby Jack cheese and crunchy greens for the ultimate lake-friendly handheld.
                      </p>
                      <div className="flex items-center gap-3 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsWrapSelected(false)}
                          className={`flex-1 py-2 px-3 rounded-lg text-xs font-mono uppercase tracking-widest border transition-all ${
                            !isWrapSelected
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 font-black'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                          }`}
                        >
                          🥗 Fresh Salad Bowl
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsWrapSelected(true)}
                          className={`flex-1 py-2 px-3 rounded-lg text-xs font-mono uppercase tracking-widest border transition-all ${
                            isWrapSelected
                              ? 'bg-amber-500/20 text-brand-yellow border-brand-yellow/50 font-black'
                              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                          }`}
                        >
                          🌯 Warm Flour Wrap
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Chef Specifications */}
                  <div className="bg-slate-950 p-4 rounded-xl space-y-2.5 border border-slate-800">
                    <h4 className="font-display font-black text-xs uppercase tracking-widest text-brand-yellow">
                      🔥 Chef's Prep Specifications
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-xs font-mono text-slate-300">
                      <div>
                        <span className="text-slate-500">SPICE INTENSITY:</span>
                        <div className="flex gap-0.5 mt-0.5 text-brand-red">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Flame
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < (detailedItem.chaosLevel || 0)
                                  ? 'fill-brand-red text-brand-red'
                                  : 'text-slate-800'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500">PREP METHOD:</span>
                        <p className="font-bold text-white mt-0.5 uppercase">
                          {detailedItem.category === 'drinks' 
                            ? 'Brewed Cold / Chilled Cans' 
                            : detailedItem.id.startsWith('salad_') && !isWrapSelected 
                            ? 'Chilled & Fresh' 
                            : 'Hand-Tossed & Grilled'}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">ALLERGEN INFO:</span>
                        <p className="text-slate-300 mt-0.5">Gluten-Free Option Available</p>
                      </div>
                      <div>
                        <span className="text-slate-500">LOCAL TRUST:</span>
                        <p className="text-slate-300 mt-0.5">100% Kentucky Sourced</p>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Add button */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setDetailedItem(null)}
                      className="flex-1 bg-slate-950 text-slate-400 border border-slate-850 rounded-xl py-3 text-sm font-display font-black uppercase tracking-widest transition-colors hover:bg-slate-900 hover:text-white"
                    >
                      Close Details
                    </button>
                    <button
                      id={`modal-add-${detailedItem.id}`}
                      onClick={() => {
                        handleAddToCartWithWrap(detailedItem);
                        setDetailedItem(null);
                      }}
                      className={`flex-1 text-white rounded-xl py-3 text-sm font-display font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg transition-colors ${
                        detailedItem.id.startsWith('salad_')
                          ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/20'
                          : detailedItem.category === 'drinks'
                          ? 'bg-sky-600 hover:bg-sky-500 shadow-sky-950/20'
                          : 'bg-brand-red hover:bg-brand-red-hover shadow-brand-red/10'
                      }`}
                    >
                      <Plus className="w-4 h-4" /> Add to Order
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
}
