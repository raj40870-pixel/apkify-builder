import React from 'react';
import { motion } from 'motion/react';
import { Check, Zap, Crown, Shield, Lock } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';

interface PlanProps {
  onSelect: (plan: string) => void;
}

export default function Pricing({ onSelect }: PlanProps) {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      inr: '₹0',
      description: 'Free Forever',
      features: [
        '3 APK Build Credits',
        '10 History Slots',
        'Watermark Enabled',
        '14 Days Renewal'
      ],
      icon: Zap,
      color: 'from-gray-600 to-gray-800',
      glow: 'group-hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]',
      isFree: true
    },
    {
      name: 'Basic',
      price: '$5',
      inr: '₹419',
      description: 'Perfect for testing and simple projects',
      features: [
        '50 APK Build Credits',
        '25 History Slots',
        'Watermark Removed',
        'Priority Speed'
      ],
      icon: Zap,
      color: 'from-gray-600 to-blue-900',
      glow: 'group-hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]'
    },
    {
      name: 'Pro',
      price: '$15',
      inr: '₹1249',
      description: 'Best for active developers and small teams',
      features: [
        '200 APK Build Credits',
        '100 History Slots',
        'Watermark Removed',
        'Fastest Speed'
      ],
      icon: Crown,
      color: 'from-blue-600 to-purple-600',
      popular: true,
      glow: 'shadow-[0_0_30px_rgba(59,130,246,0.3)] group-hover:shadow-[0_0_40px_rgba(59,130,246,0.5)]',
      iconColor: 'text-[#fbbf24]'
    },
    {
      name: 'Agency',
      price: '$49',
      inr: '₹4099',
      description: 'Maximum power for large scale enterprises',
      features: [
        '1000 APK Build Credits',
        '500 History Slots',
        'Watermark Removed',
        'Custom branding'
      ],
      icon: Shield,
      color: 'from-purple-600 to-pink-600',
      glow: 'group-hover:shadow-[0_0_30px_rgba(168,85,247,0.3)]'
    }
  ];

  const currentPlan = localStorage.getItem('userPlan') || 'Free';
  const isProd = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

  return (
    <section id="pricing" className="py-24 container px-4">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-5xl font-display font-bold mb-4">Pricing Plans</h2>
        <p className="text-white/60 text-lg">Choose the right plan for your development needs</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -10 }}
            className={`group flex`}
          >
            <Card className={`glass border-white/5 flex flex-col w-full overflow-hidden relative transition-all duration-300 ${plan.glow} ${plan.popular ? 'border-blue-500/30' : ''}`}>
              {plan.popular && (!isProd || plan.isFree) && (
                <div className="absolute top-0 right-0 p-3">
                  <span className="bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full"> Popular</span>
                </div>
              )}

              {isProd && !plan.isFree && (
                <div className="absolute top-0 right-0 p-3">
                  <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Locked
                  </span>
                </div>
              )}
              
              <CardHeader className="pb-8">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${plan.color} flex items-center justify-center mb-4`}>
                  <plan.icon className={`w-6 h-6 ${plan.iconColor || 'text-white'}`} />
                </div>
                <CardTitle className="text-2xl font-display">{plan.name}</CardTitle>
                <CardDescription className="text-white/40">{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="flex-1 space-y-6">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {!plan.isFree && <span className="text-white/40 text-sm">/ mo</span>}
                  {plan.inr !== '₹0' && <span className="text-[10px] text-white/20 ml-1">≈ {plan.inr}/mo</span>}
                </div>

                <ul className="space-y-4">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm text-white/80">
                      <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                        <Check className="w-3 h-3 text-green-500" />
                      </div>
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="pt-8">
                <Button 
                  onClick={() => onSelect(plan.name)}
                  disabled={currentPlan === plan.name || (isProd && !plan.isFree)}
                  className={`w-full py-4 md:py-5 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
                    currentPlan === plan.name
                    ? 'bg-white/5 text-white/40 cursor-default'
                    : (isProd && !plan.isFree)
                    ? 'bg-white/5 text-white/40 cursor-not-allowed border border-white/10 opacity-70'
                    : plan.popular 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-[1.02] shadow-lg shadow-blue-600/20' 
                    : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
                >
                  {currentPlan === plan.name ? (
                    'Current Plan'
                  ) : (isProd && !plan.isFree) ? (
                    <>
                      <Lock className="w-4 h-4 text-amber-400" />
                      <span>Locked • Coming Soon</span>
                    </>
                  ) : plan.isFree ? (
                    'Get Started'
                  ) : (
                    'Upgrade Now'
                  )}
                </Button>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
