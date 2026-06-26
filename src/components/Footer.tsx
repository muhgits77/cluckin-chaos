import { Flame, Landmark } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="footer" className="bg-slate-950 text-white border-t border-slate-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Content Grid */}
        <div className="grid md:grid-cols-12 gap-8 items-center pb-8 border-b border-slate-900">
          {/* Logo Brand */}
          <div className="md:col-span-6 space-y-3">
            <div className="flex items-center gap-2">
              <div className="bg-brand-red p-1.5 rounded-lg border border-brand-yellow/15">
                <Flame className="w-5 h-5 text-brand-yellow fill-brand-yellow" />
              </div>
              <span className="font-display font-extrabold text-xl uppercase tracking-tighter text-white">
                Cluckin' <span className="text-brand-yellow">Chaos</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed font-sans">
              Kentucky's premium hand-breaded crispy fried chicken tenders, hot honey nuggets, and slow-sauced BBQ sandbox rig. Catch us slinging comfort food all around Lake Cumberland.
            </p>
          </div>

          {/* Links / Portfolio attribution */}
          <div className="md:col-span-6 md:text-right space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-brand-yellow font-mono text-[10px] uppercase font-bold tracking-widest shadow-inner">
              <Landmark className="w-3.5 h-3.5 text-brand-yellow shrink-0" />
              Portfolio Showcase Demo
            </div>
            <p className="text-xs text-slate-300">
              Designed & Built by{' '}
              <a
                id="bluegrass-portfolio-link"
                href="https://bluegrassdigitalforge.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-yellow hover:text-brand-yellow hover:underline font-bold transition-all"
              >
                Bluegrass Digital Forge
              </a>
            </p>
          </div>
        </div>

        {/* Lower Copy block */}
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-slate-500 font-mono uppercase tracking-wider">
          <p>© {currentYear} Cluckin' Chaos Food Truck. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="text-slate-500 hover:text-brand-yellow cursor-pointer">Sitemap</span>
            <span>•</span>
            <span className="text-slate-500 hover:text-brand-yellow cursor-pointer">Terms of Service</span>
            <span>•</span>
            <span className="text-slate-500 hover:text-brand-yellow cursor-pointer">Privacy Policy</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
