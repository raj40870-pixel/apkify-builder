import React from 'react';
import { motion } from 'motion/react';
import { Check, Zap, ShieldCheck, Cpu, Clock } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter } from './ui/card';

interface PlanProps {
  onSelect: (plan: string) => void;
}

export default function Pricing({ onSelect }: PlanProps) {
  const highlights = [
    { icon: Zap, label: '3 Builds / Day', desc: 'Daily midnight reset' },
    { icon: ShieldCheck, label: '0 Watermark', desc: '100% clean branding' },
    { icon: Clock, label: 'Fast Cloud Pipeline', desc: 'Under 90s build' }
  ];

  const features = [
    { title: '3 Daily APK Builds', desc: 'Refilled every night at 00:00 automatically', highlight: true },
    { title: '100% Watermark-Free', desc: 'Clean binary with pure custom branding', highlight: true },
    { title: 'Zero In-App Ads', desc: 'No injected third-party ads or popups', highlight: true },
    { title: 'Direct APK Download', desc: 'Instant high-speed download & QR scanner', highlight: false },
    { title: '10 Cloud History Slots', desc: 'Secure cloud retention for easy re-download', highlight: false },
    { title: 'Custom Package ID', desc: 'Full custom namespace (com.domain.app)', highlight: false },
    { title: 'Custom Icon & Splash', desc: 'High-res adaptive icons & splash screens', highlight: false },
    { title: 'Fast Native Gradle Build', desc: 'Cloud-compiled native Android package', highlight: false }
  ];

  return (
    <section id="pricing" className="py-24 container px-4 mx-auto relative">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-semibold uppercase tracking-wider mb-4">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> Free Community Plan
        </div>
        <h2 className="text-3xl md:text-5xl font-display font-bold mb-4 tracking-tight">
          Simple, Transparent Free Access
        </h2>
        <p className="text-white/60 text-base md:text-lg max-w-2xl mx-auto">
          No credit card required, no hidden fees. Build high-quality native Android APKs with 3 free builds every single day.
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Card className="glass border border-cyan-500/20 overflow-hidden relative shadow-[0_0_50px_rgba(6,182,212,0.12)] rounded-3xl p-6 md:p-10 bg-gradient-to-b from-cyan-950/20 via-black/40 to-black/60">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-1/4 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-8 border-b border-white/10">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-2xl font-bold font-display text-white">Community Developer</h3>
                    <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 font-semibold border border-cyan-500/20">
                      Free Tier
                    </span>
                  </div>
                  <p className="text-xs text-white/50 mt-0.5">Full Native APK Builder • 3 Daily Builds Included</p>
                </div>
              </div>

              <div className="flex flex-col md:items-end">
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-extrabold text-white font-display tracking-tight">$0</span>
                  <span className="text-cyan-400 font-semibold text-sm">/ Free Plan</span>
                </div>
                <span className="text-[11px] text-white/40 mt-0.5">No Credit Card Required</span>
              </div>
            </div>

            {/* Quick Highlights Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-6 border-b border-white/5">
              {highlights.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0 text-cyan-400">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white leading-tight">{item.label}</p>
                      <p className="text-[11px] text-white/40 leading-tight mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <CardContent className="pt-6 px-0">
              <h4 className="text-xs uppercase tracking-wider text-white/50 font-bold mb-4">
                What's Included:
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {features.map((feature, i) => (
                  <div 
                    key={i} 
                    className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-colors ${
                      feature.highlight 
                        ? 'bg-cyan-500/[0.04] border-cyan-500/20 text-white' 
                        : 'bg-white/[0.02] border-white/5 text-white/80'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div className="text-xs leading-snug">
                      <span className="font-semibold text-white block text-sm mb-0.5">{feature.title}</span>
                      <span className="text-white/50 text-xs">{feature.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>

            <CardFooter className="pt-8 px-0 flex flex-col gap-3">
              <Button 
                onClick={() => onSelect('Free')}
                className="w-full py-6 rounded-2xl font-display font-bold text-lg bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 hover:opacity-95 shadow-xl shadow-cyan-500/20 text-white transition-all transform active:scale-[0.99]"
              >
                <Cpu className="w-5 h-5 mr-2" /> Start Building APK (100% Free)
              </Button>
              <p className="text-center text-xs text-white/40 flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" /> Instant access • No card required • Daily auto-refill
              </p>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
