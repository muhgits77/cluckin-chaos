import { Star, MessageSquare, Quote } from 'lucide-react';
import { TESTIMONIALS } from '../data';

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-20 bg-slate-900 text-white relative overflow-hidden border-b border-slate-950">
      {/* Background decoration elements */}
      <div className="absolute top-0 right-10 w-80 h-80 bg-brand-red/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-brand-yellow font-mono text-xs uppercase tracking-widest font-black flex items-center justify-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-brand-yellow" /> Southern Hospitality
          </span>
          <h2 className="font-display font-black text-3xl sm:text-4xl uppercase tracking-tight">
            Lake Cumberland <span className="text-brand-red">Approved</span>
          </h2>
          <div className="h-1.5 w-24 bg-gradient-to-r from-brand-yellow to-brand-amber mx-auto rounded-full"></div>
          <p className="text-slate-300 text-sm sm:text-base">
            Don't just take Jesse and Clay's word for it—here is what our local Kentuckian family, boaters, park campers, and Somerset regulars have to say!
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.id}
              className="bg-slate-950/60 border border-slate-800 p-8 rounded-2xl relative shadow-lg flex flex-col justify-between group hover:border-brand-yellow/30 transition-all duration-300"
            >
              {/* Quote Mark Icon in card top corner */}
              <div className="absolute top-6 right-8 text-brand-yellow/10 group-hover:text-brand-yellow/20 transition-colors pointer-events-none">
                <Quote className="w-12 h-12 fill-current" />
              </div>

              {/* Quote Text */}
              <div className="space-y-4">
                {/* Stars */}
                <div className="flex gap-1 text-brand-yellow">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4.5 h-4.5 fill-current" />
                  ))}
                </div>
                <p className="text-slate-300 text-sm italic leading-relaxed relative z-10">
                  "{t.text}"
                </p>
              </div>

              {/* User Bio Footer */}
              <div className="pt-6 border-t border-slate-800 mt-6 flex items-center gap-3">
                <div className="text-3xl bg-slate-900 w-11 h-11 rounded-full flex items-center justify-center border border-slate-800 shrink-0">
                  {t.avatar}
                </div>
                <div>
                  <h4 className="font-display font-black text-xs uppercase tracking-wider text-white">
                    {t.name}
                  </h4>
                  <p className="text-[10px] font-mono text-brand-yellow uppercase mt-0.5">
                    {t.location}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
