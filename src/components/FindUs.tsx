import React, { useState } from 'react';
import { MapPin, Clock, Calendar, Compass, Phone, Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SCHEDULE } from '../data';

export default function FindUs() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    // Simulate API registration
    setTimeout(() => {
      setLoading(false);
      setSubscribed(true);
      setEmail('');
    }, 1200);
  };

  return (
    <section id="find-us" className="py-20 bg-slate-950 relative border-b border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <span className="text-brand-red font-mono text-xs uppercase tracking-widest font-extrabold flex items-center justify-center gap-1.5">
            <Compass className="w-4 h-4 animate-spin-slow" /> Tracking the Mayhem
          </span>
          <h2 className="font-display font-extrabold text-3xl sm:text-4xl uppercase tracking-tight text-white">
            Our Weekly <span className="text-brand-red">Bluegrass Route</span>
          </h2>
          <div className="h-1.5 w-24 bg-gradient-to-r from-brand-yellow to-brand-red mx-auto rounded-full"></div>
          <p className="text-slate-300 text-sm sm:text-base">
            Our combustion engine kitchen moves fast! Keep up with our weekly lunch & dinner locations surrounding Lake Cumberland.
          </p>
        </div>

        {/* Schedule & Contact Dual Column */}
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column: Weekly Route Scheduler list */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="font-display font-black text-lg uppercase tracking-tight text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-red" /> Current Route Schedule
            </h3>

            <div className="space-y-3">
              {SCHEDULE.map((item) => (
                <div
                  key={item.day}
                  className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                    item.status === 'active'
                      ? 'bg-slate-900 border-brand-red shadow-md ring-1 ring-brand-red/20'
                      : 'bg-slate-900 border-slate-800 shadow-sm hover:border-brand-yellow/30'
                  }`}
                >
                  <div className="space-y-1.5">
                    {/* Day & Live Tag */}
                    <div className="flex items-center gap-2.5">
                      <span className="font-display font-extrabold text-sm uppercase tracking-wide text-slate-200">
                        {item.day}
                      </span>
                      {item.status === 'active' ? (
                        <span className="bg-green-900/30 text-green-400 text-[9px] font-mono uppercase font-black px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse border border-green-800/30">
                          <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                          Live Now!
                        </span>
                      ) : (
                        <span className="bg-slate-950 text-slate-400 text-[9px] font-mono uppercase font-semibold px-2 py-0.5 rounded-md border border-slate-850">
                          Scheduled
                        </span>
                      )}
                    </div>
                    {/* Location */}
                    <div className="flex items-center gap-2 text-slate-300 text-sm">
                      <MapPin className="w-4 h-4 text-brand-amber shrink-0" />
                      <span className="font-semibold">{item.location}</span>
                    </div>
                  </div>

                  {/* Hours */}
                  <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-850 self-start sm:self-auto shrink-0">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span className="font-mono text-xs text-slate-300 font-semibold">{item.hours}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Alerts Subscription & Catering Contact */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* GPS Alerts Card */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-yellow/5 rounded-full blur-2xl pointer-events-none"></div>

              <div className="space-y-1.5">
                <h4 className="font-display font-extrabold text-base uppercase tracking-tight text-brand-yellow flex items-center gap-1.5">
                  <Compass className="w-5 h-5 text-brand-yellow animate-pulse" /> Live GPS Location Alerts
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Never miss out on crispy golden mayhem! Register your email address to receive immediate coordinates whenever Jesse fires up the fryer near Somerset.
                </p>
              </div>

              <AnimatePresence mode="wait">
                {subscribed ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-green-950/40 border border-green-500/30 p-4 rounded-xl flex items-start gap-2.5 text-green-300"
                  >
                    <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5 text-xs">
                      <p className="font-bold uppercase tracking-wider text-green-400">Subscription Active!</p>
                      <p className="text-green-300/80">You're locked into our coordinates broadcast list. Fryer alarms are armed!</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.form
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onSubmit={handleSubscribe}
                    className="space-y-3"
                  >
                    <div>
                      <label htmlFor="alerts-email" className="sr-only">Email Address</label>
                      <input
                        id="alerts-email"
                        type="email"
                        required
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-yellow transition-all"
                      />
                    </div>
                    <button
                      id="alerts-submit-btn"
                      type="submit"
                      disabled={loading}
                      className="w-full bg-brand-red hover:bg-brand-red-hover disabled:bg-brand-red/50 text-white py-3 rounded-xl font-display font-black uppercase text-xs tracking-widest transition-colors flex items-center justify-center gap-1.5"
                    >
                      {loading ? (
                        <>
                          <div className="w-4.5 h-4.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          Connecting...
                        </>
                      ) : (
                        'Broadcast Coordinates'
                      )}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>

            {/* Catering & Contact Card */}
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-lg space-y-4">
              <h4 className="font-display font-black text-sm uppercase tracking-wide text-white">
                🚚 Private Lake Catering & Parties
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Want Cluckin' Chaos to anchor at your family reunion, boat dock party, or corporate event in Kentucky? We provide customizable tenders and slider menus tailored specifically for you.
              </p>
              
              <div className="space-y-2.5 pt-2 text-xs font-mono">
                <div className="flex items-center gap-2 text-slate-300">
                  <Phone className="w-4 h-4 text-brand-red shrink-0" />
                  <span className="font-bold">(606) 555-CLUCK</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <Mail className="w-4 h-4 text-brand-red shrink-0" />
                  <span className="font-bold">mayhem@cluckinchaosky.com</span>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
