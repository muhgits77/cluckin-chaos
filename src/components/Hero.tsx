import { Flame, ArrowRight, ShieldCheck, MapPin } from 'lucide-react';
import { motion } from 'motion/react';
import truckImg from '../assets/images/chaos_food_truck_1782485499263.jpg';
import tendersImg from '../assets/images/chicken_tenders_crispy_1782485461920.jpg';

export default function Hero() {
  return (
    <section id="hero-section" className="relative bg-slate-950 overflow-hidden min-h-[85vh] flex items-center">
      {/* Visual background image with strong dark vignette */}
      <div className="absolute inset-0 z-0">
        <img
          src={truckImg}
          alt="Cluckin' Chaos Sizzling Flame"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover opacity-20 object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/40 to-transparent"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-16 md:py-24 grid md:grid-cols-12 gap-12 items-center">
        {/* Left Side: Dynamic Text content */}
        <div className="md:col-span-7 space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 bg-brand-red/10 border border-brand-red/30 px-4 py-2 rounded-full text-brand-yellow font-mono text-[11px] uppercase tracking-widest font-bold"
          >
            <Flame className="w-3.5 h-3.5 text-brand-red fill-brand-red animate-pulse" />
            Active Today: Lake Cumberland Region
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="font-display font-extrabold text-4xl sm:text-5xl lg:text-6xl text-white leading-tight uppercase tracking-tight"
          >
            Pure Fried <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-yellow via-brand-amber to-brand-red inline-block drop-shadow-md">
              Chicken Mayhem
            </span> <br />
            On Wheels
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-slate-300 text-base sm:text-lg max-w-xl leading-relaxed"
          >
            Welcome to <strong className="text-brand-yellow font-semibold">Cluckin' Chaos</strong>, Kentucky's wildest food truck. We sling hand-breaded crispy tenders, hot-honey drizzled nuggets, and hickory-smoked shred sandys to lake lovers around Somerset, Jamestown, and Burnside.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 pt-4"
          >
            <a
              id="hero-menu-cta"
              href="#menu"
              className="bg-brand-red hover:bg-brand-red-hover text-white text-xs font-display font-black tracking-widest uppercase px-8 py-4.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-brand-red/20 group hover:translate-x-1"
            >
              Order the Chaos
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </a>
            <a
              id="hero-find-cta"
              href="#find-us"
              className="bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-850 text-xs font-display font-black tracking-widest uppercase px-8 py-4.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 shadow-md"
            >
              <MapPin className="w-4 h-4 text-brand-yellow" />
              Find the Rig
            </a>
          </motion.div>

          {/* Core USP Badges */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="grid grid-cols-3 gap-4 pt-8 border-t border-slate-900"
          >
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-brand-yellow shrink-0" />
              <div>
                <p className="text-white text-xs font-bold leading-none uppercase">100% Hand</p>
                <p className="text-slate-400 text-[10px] uppercase font-mono mt-0.5">Breaded Daily</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Flame className="w-5 h-5 text-brand-red shrink-0" />
              <div>
                <p className="text-white text-xs font-bold leading-none uppercase">Secret Spice</p>
                <p className="text-slate-400 text-[10px] uppercase font-mono mt-0.5">Kentucky Blend</p>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <MapPin className="w-5 h-5 text-brand-amber shrink-0" />
              <div>
                <p className="text-white text-xs font-bold leading-none uppercase">Lake Side</p>
                <p className="text-slate-400 text-[10px] uppercase font-mono mt-0.5">Somerset & Parks</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Side: Showcase Floating Card / Promo graphics */}
        <div className="md:col-span-5 relative hidden md:flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 2 }}
            transition={{ type: 'spring', duration: 0.8, delay: 0.2 }}
            className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl relative w-full max-w-sm overflow-hidden"
          >
            {/* Corner Decorative ribbon */}
            <div className="absolute top-0 right-0 bg-brand-red text-white text-[10px] font-black tracking-widest px-8 py-1.5 rotate-45 translate-x-6 translate-y-3 uppercase shadow-md">
              Best Seller
            </div>

            <div className="aspect-square w-full rounded-xl overflow-hidden mb-4 border border-slate-800">
              <img
                src={tendersImg}
                alt="Classic Chicken Tenders Platter"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <h3 className="font-display font-black text-white text-lg uppercase tracking-tight">
                  Classic Tenders Platter
                </h3>
                <span className="text-brand-yellow font-mono font-black text-lg">$10.99</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed line-clamp-2">
                5 massive hand-kneaded strips pressure-fried in pure lard seasoning. Crispy, golden, succulent.
              </p>
              <div className="flex gap-2 pt-2">
                <span className="bg-slate-950 text-brand-yellow text-[9px] font-mono uppercase px-2 py-0.5 rounded border border-slate-800">
                  ★ Popular
                </span>
                <span className="bg-slate-950 text-brand-red text-[9px] font-mono uppercase px-2 py-0.5 rounded border border-slate-800">
                  🔥 Custom Spice
                </span>
              </div>
            </div>
          </motion.div>

          {/* Floating graphic bubbles to add chaos energy */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="absolute -top-6 -left-6 bg-brand-yellow text-slate-950 font-display font-black uppercase text-xs tracking-widest p-4 rounded-xl border border-slate-900 shadow-lg -rotate-12"
          >
            ⚡ FREE SAUCES!
          </motion.div>

          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
            className="absolute -bottom-6 -right-6 bg-brand-red text-white font-display font-black uppercase text-xs tracking-widest p-4 rounded-xl border border-slate-900 shadow-lg rotate-12"
          >
            🔥 BOTTOMLESS SWEET TEA!
          </motion.div>
        </div>
      </div>
    </section>
  );
}
