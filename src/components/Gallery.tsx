import React, { useState } from 'react';
import { ZoomIn, X, ChevronLeft, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GALLERY_ITEMS } from '../data';

export default function Gallery() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeIndex === null) return;
    setActiveIndex((activeIndex + 1) % GALLERY_ITEMS.length);
  };

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeIndex === null) return;
    setActiveIndex((activeIndex - 1 + GALLERY_ITEMS.length) % GALLERY_ITEMS.length);
  };

  return (
    <section id="gallery" className="py-20 bg-slate-950 relative border-b border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-brand-red font-mono text-xs uppercase tracking-widest font-extrabold flex items-center justify-center gap-1">
            <ImageIcon className="w-4 h-4" /> Bluegrass Snapshot
          </span>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl uppercase tracking-tight text-white">
            Our <span className="text-brand-red">Golden Gallery</span>
          </h2>
          <div className="h-1.5 w-24 bg-gradient-to-r from-brand-yellow to-brand-red mx-auto rounded-full"></div>
          <p className="text-slate-300 text-sm sm:text-base">
            Take a gander at our custom food truck, crispy fresh-out-of-the-fryer batter, lake scenery, and the delicious southern treats we dish out daily!
          </p>
        </div>

        {/* Bento Grid Gallery */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
          {GALLERY_ITEMS.map((item, index) => (
            <motion.div
              key={item.id}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.2 }}
              onClick={() => setActiveIndex(index)}
              className={`relative rounded-2xl overflow-hidden cursor-pointer shadow-md group border border-slate-800 bg-slate-900 ${
                index === 0
                  ? 'col-span-2 row-span-1 md:col-span-2 md:row-span-2 aspect-[4/3] md:aspect-auto h-full'
                  : 'aspect-square'
              }`}
            >
              <img
                src={item.url}
                alt={item.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
              />
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                <div className="bg-brand-red p-2 rounded-lg absolute top-4 right-4 text-white scale-75 group-hover:scale-100 transition-transform shadow-md border border-brand-yellow/20">
                  <ZoomIn className="w-4 h-4" />
                </div>
                <h4 className="font-display font-black text-white text-base md:text-lg uppercase tracking-tight">
                  {item.title}
                </h4>
                <p className="text-slate-300 text-[10px] md:text-xs line-clamp-2 mt-1">
                  {item.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Interactive Lightbox Slider Modal */}
        <AnimatePresence>
          {activeIndex !== null && (
            <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setActiveIndex(null)}
                className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm"
              />

              {/* Close Button */}
              <button
                onClick={() => setActiveIndex(null)}
                className="absolute top-6 right-6 bg-slate-900 text-white hover:bg-brand-red p-2.5 rounded-full z-10 transition-colors border border-slate-800 shadow-lg cursor-pointer"
                aria-label="Close Gallery"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Lightbox Content Wrap */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative z-10 max-w-4xl w-full flex flex-col items-center justify-center pointer-events-none"
              >
                {/* Active Image container */}
                <div className="relative pointer-events-auto select-none bg-slate-950 border-4 border-slate-900 rounded-2xl overflow-hidden max-h-[70vh] flex items-center justify-center shadow-2xl">
                  <img
                    src={GALLERY_ITEMS[activeIndex].url}
                    alt={GALLERY_ITEMS[activeIndex].title}
                    referrerPolicy="no-referrer"
                    className="object-contain max-h-[70vh] w-full"
                  />

                  {/* Left Navigation Arrow */}
                  <button
                    onClick={handlePrev}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-slate-950/80 text-white hover:bg-brand-yellow hover:text-slate-950 p-2 rounded-full border border-slate-800 shadow-lg transition-all cursor-pointer"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {/* Right Navigation Arrow */}
                  <button
                    onClick={handleNext}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-slate-950/80 text-white hover:bg-brand-yellow hover:text-slate-950 p-2 rounded-full border border-slate-800 shadow-lg transition-all cursor-pointer"
                    aria-label="Next image"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Subtitle / Caption Info */}
                <div className="pointer-events-auto text-center mt-4 max-w-xl text-white space-y-1">
                  <h4 className="font-display font-extrabold text-lg uppercase tracking-tight text-brand-yellow">
                    {GALLERY_ITEMS[activeIndex].title}
                  </h4>
                  <p className="text-sm text-slate-300">
                    {GALLERY_ITEMS[activeIndex].description}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    IMAGE {activeIndex + 1} OF {GALLERY_ITEMS.length}
                  </p>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
}
