import { useState, useEffect } from 'react';
import { Menu, X, ShoppingCart, Flame, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  cartCount: number;
  onCartToggle: () => void;
  activeSection: string;
}

export default function Navbar({ cartCount, onCartToggle, activeSection }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Menu', href: '#menu' },
    { name: 'Our Story', href: '#about' },
    { name: 'Gallery', href: '#gallery' },
    { name: 'Reviews', href: '#testimonials' },
    { name: 'Find Us', href: '#find-us' },
  ];

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Top Banner Alert */}
      <div id="top-banner" className="bg-slate-950 text-slate-300 py-2 px-4 text-xs font-mono flex items-center justify-center gap-2 border-b border-red-900/30 relative z-50">
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        <MapPin className="w-3.5 h-3.5 text-brand-yellow shrink-0" />
        <span className="tracking-wide">
          TRUCK UPDATE: We're live at <span className="text-brand-yellow font-bold">Lake Cumberland State Resort Park</span> today until 8 PM!
        </span>
      </div>

      <header
        id="navbar-header"
        className={`sticky top-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-slate-950/95 backdrop-blur-md shadow-xl py-3 border-b border-red-900/30'
            : 'bg-slate-950 py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          
          {/* Logo Brand */}
          <a id="logo-link" href="#" className="flex items-center gap-2 group">
            <div className="bg-brand-red p-1.5 rounded-xl shadow-lg border border-brand-yellow/30 group-hover:scale-110 transition-transform duration-300">
              <Flame className="w-6 h-6 text-brand-yellow fill-brand-yellow animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="font-display font-extrabold text-2xl tracking-tighter text-white uppercase leading-none flex items-center gap-1">
                Cluckin' <span className="text-brand-yellow">Chaos</span>
              </span>
              <span className="text-[9px] font-mono tracking-widest text-slate-400 uppercase leading-none mt-1">
                Kentucky Fried Mayhem
              </span>
            </div>
          </a>

          {/* Desktop Nav Links */}
          <nav id="desktop-nav" className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className={`font-display text-sm font-medium uppercase tracking-widest relative py-1 transition-colors duration-300 ${
                  activeSection === link.href.slice(1)
                    ? 'text-brand-yellow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {link.name}
                {activeSection === link.href.slice(1) && (
                  <motion.span
                    layoutId="activeDot"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-yellow rounded-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </a>
            ))}
          </nav>

          {/* Navbar Actions (Cart & Hamburger) */}
          <div id="nav-actions" className="flex items-center gap-3">
            {/* Simple Floating Cart Trigger */}
            <motion.button
              id="cart-trigger-button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onCartToggle}
              className="bg-slate-900 hover:bg-brand-red text-white p-2.5 rounded-full relative flex items-center justify-center border border-slate-800 shadow-md transition-colors"
              aria-label="View Cart"
            >
              <ShoppingCart className="w-5 h-5 text-brand-yellow" />
              <AnimatePresence>
                {cartCount > 0 && (
                  <motion.span
                    key="cart-badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1 bg-brand-yellow text-brand-dark text-xs font-mono font-black w-5.5 h-5.5 rounded-full flex items-center justify-center shadow-md border-2 border-brand-dark"
                  >
                    {cartCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Mobile Menu Button */}
            <button
              id="mobile-menu-hamburger"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-slate-300 p-2 hover:text-brand-yellow transition-colors"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            id="mobile-drawer-overlay"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-[101px] bg-slate-950 border-b border-red-900/30 z-35 md:hidden shadow-2xl"
          >
            <div className="px-4 py-6 space-y-4 max-w-lg mx-auto">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  onClick={handleLinkClick}
                  className="block font-display text-lg font-bold text-slate-300 hover:text-white transition-colors duration-200 border-b border-slate-900 pb-2 uppercase tracking-wide"
                >
                  {link.name}
                </a>
              ))}
              <div className="pt-2">
                <button
                  id="mobile-cart-button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onCartToggle();
                  }}
                  className="w-full bg-brand-yellow hover:bg-yellow-500 text-brand-dark py-3 px-4 rounded-xl font-display font-black uppercase text-sm tracking-widest flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="w-4 h-4" />
                  View Cart ({cartCount})
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
