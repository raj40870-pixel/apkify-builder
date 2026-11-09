import React from 'react';
import { motion } from 'motion/react';
import { Check, Zap, Sparkles, Cpu } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardFooter } from './ui/card';

interface PlanProps {
  onSelect: (plan: string) => void;
}

export default function Pricing({ onSelect }: PlanProps) {
  const features = [
    { text: '3 Free APK Builds Every 7 Days (Automated 7-Day Auto-Refill)', highlight: true },
    { text: '100% No Watermark (Clean App)', highlight: true },
    { text: 'Zero In-App Ads (No ads injected into your APK binary)', highlight: true },
    { text: 'Direct APK Download & Instant QR Code Scanner', highlight: false },
    { text: '10 Cloud History Slots for Fast Re-Downloads', highlight: false },
    { text: 'Custom App Name & Unique Package ID (com.domain.app)', highlight: false },
    { text: 'Custom App Icon & Splash Screen Support', highlight: false },
    { text: 'Fast Cloud Build Pipeline (~2 to 3 Minutes)', highlight: false }
  ];

  return (
    <section id="pricing" className="py-24 container px-4 mx-auto">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5" /> Free Plan
        </div>
        <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">
          Free Plan
        </h2>
        <p className="text-white/60 text-base md:text-lg max-w-2xl mx-auto">
          Build high-quality native Android APKs directly in the cloud.
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <Card className="glass border border-blue-500/30 overflow-hidden relative shadow-[0_0_50px_rgba(59,130,246,0.15)] rounded-3xl p-6 md:p-10 bg-gradient-to-b from-blue-950/20 via-black/40 to-black/60">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-8 border-b border-white/10">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold font-display text-white">Free Plan</h3>
                    <p className="text-xs text-white/50">Full Native APK Cloud Pipeline</p>
                  </div>
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-extrabold text-white font-display">$0</span>
                <span className="text-emerald-400 font-semibold text-sm">/ Free Plan</span>
              </div>
            </div>

            <CardContent className="pt-8 px-0">
              <h4 className="text-xs uppercase tracking-wider text-white/50 font-bold mb-6">
                What's Included:
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {features.map((feature, i) => (
                  <div 
                    key={i} 
                    className={`flex items-start gap-3 p-3 rounded-xl border ${
                      feature.highlight 
                        ? 'bg-blue-500/5 border-blue-500/20 text-white' 
                        : 'bg-white/[0.02] border-white/5 text-white/80'
                    }`}
                  >
                    <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <span className="text-sm leading-snug">
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>

            <CardFooter className="pt-8 px-0">
              <Button 
                onClick={() => onSelect('Free')}
                className="w-full py-6 rounded-2xl font-display font-bold text-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-95 shadow-xl shadow-blue-600/30 text-white transition-all transform active:scale-[0.99]"
              >
                <Cpu className="w-5 h-5 mr-2" /> Start Building APK
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
