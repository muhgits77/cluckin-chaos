import { Flame, Anchor, Heart, Award } from 'lucide-react';
import { motion } from 'motion/react';
import truckImg from '../assets/images/chaos_food_truck_1782485499263.jpg';

export default function About() {
  return (
    <section id="about" className="py-20 bg-slate-900 text-white relative overflow-hidden border-b border-slate-950">
      {/* Subtle fire glow asset in background */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-brand-amber/10 rounded-full blur-[120px] -translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-brand-red/10 rounded-full blur-[120px] translate-y-1/3 translate-x-1/3 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Layout Grid */}
        <div className="grid lg:grid-cols-12 gap-16 items-center">
          
          {/* Left Side: Story text contents */}
          <div className="lg:col-span-7 space-y-6">
            <span className="text-brand-yellow font-mono text-xs uppercase tracking-widest font-black flex items-center gap-1.5">
              <Flame className="w-4 h-4 fill-brand-yellow text-brand-yellow" /> Behind the Crispy Batter
            </span>
            <h2 className="font-display font-black text-3xl sm:text-4xl uppercase tracking-tight">
              The Legend of <span className="text-brand-red">Cluckin' Chaos</span>
            </h2>
            <div className="h-1.5 w-20 bg-gradient-to-r from-brand-yellow to-brand-amber rounded-full"></div>

            <div className="space-y-4 text-slate-300 text-sm sm:text-base leading-relaxed">
              <p>
                Cluckin' Chaos didn't start in a fancy boardroom—it was born on the shores of <strong className="text-brand-yellow">Lake Cumberland</strong> under a starry Kentucky sky in the summer of 2021.
              </p>
              <p>
                Founders and lifelong Bluegrass residents Jesse and Clay spent their childhood summers fishing around Burnside and Jamestown. The only problem? After a long day hauling striped bass out of the deep waters, there was never any heavy-duty comfort food that satisfied a lake-sized hunger.
              </p>
              <p>
                Equipped with a rusted-out 1988 Chevy step-van, Jesse's grandma's secret 12-spice recipe, and a commercial high-capacity pressure fryer, they launched <strong>Cluckin' Chaos</strong>. Today, we bring the crispy, golden chicken mayhem straight to marinas, state parks, and town squares.
              </p>
            </div>

            {/* Core Values / Icon Stats */}
            <div className="grid sm:grid-cols-3 gap-6 pt-6">
              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-1">
                <Anchor className="w-5 h-5 text-brand-yellow" />
                <h4 className="font-display font-black text-xs uppercase tracking-wide text-white">Lake Bred</h4>
                <p className="text-[11px] text-slate-400 leading-tight">Born in Burnside and Jamestown marina communities.</p>
              </div>
              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-1">
                <Heart className="w-5 h-5 text-brand-red" />
                <h4 className="font-display font-black text-xs uppercase tracking-wide text-white">Grandma's secret</h4>
                <p className="text-[11px] text-slate-400 leading-tight">Hand-ground spices with a tiny sweet bourbon kick.</p>
              </div>
              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-1">
                <Award className="w-5 h-5 text-brand-amber" />
                <h4 className="font-display font-black text-xs uppercase tracking-wide text-white">Fresh Frying</h4>
                <p className="text-[11px] text-slate-400 leading-tight">Cooked under high-pressure for absolute juiciness.</p>
              </div>
            </div>
          </div>

          {/* Right Side: Showcase Image collage or big single graphic with aesthetic framing */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            
            {/* Visual Frame wrapper */}
            <div className="relative group max-w-sm w-full">
              {/* Back glowing cards decorative */}
              <div className="absolute -inset-1.5 bg-gradient-to-r from-brand-yellow to-brand-red rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
              
              <div className="relative bg-slate-950 border border-slate-800 p-2.5 rounded-2xl shadow-2xl overflow-hidden">
                <img
                  src={truckImg}
                  alt="Cluckin Chaos Food Truck founders at Lake Cumberland"
                  referrerPolicy="no-referrer"
                  className="w-full aspect-[4/5] object-cover rounded-xl"
                />
                
                {/* Floating caption overlay */}
                <div className="absolute inset-x-4 bottom-4 bg-slate-950/95 backdrop-blur-md p-4 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-brand-red animate-ping"></span>
                    <p className="text-[10px] font-mono tracking-widest text-brand-yellow font-black uppercase">
                      LAKE CUMBERLAND ORIGINALS
                    </p>
                  </div>
                  <h4 className="font-display font-black text-sm text-white uppercase">
                    Jesse & Clay's Truck Rig
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-tight">
                    "We feed folks like they're family, then we fry up enough heat to keep things interesting!"
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
