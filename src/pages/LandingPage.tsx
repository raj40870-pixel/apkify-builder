import React from 'react';
import { motion } from 'motion/react';
import Pricing from '../components/Pricing';
import { ArrowRight, Globe, Code2, Box, Zap, Shield, Lock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';
import { getStoredUser } from '../lib/auth';

export default function LandingPage() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const handleStart = () => {
    if (user) {
      navigate('/build');
    } else {
      navigate('/signup');
    }
  };

  const handleSelectPlan = (plan: string) => {
    if (user) {
      if (plan === 'Free') {
        navigate('/build');
      } else {
        navigate('/payment', { state: { plan } });
      }
    } else {
      navigate('/login', { 
        state: { 
          from: { pathname: plan === 'Free' ? '/build' : '/payment' },
          message: `Login required to purchase ${plan} plan` 
        } 
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="relative pt-16 pb-20 md:pt-40 md:pb-52 overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full -z-10 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full -z-10" />

        <div className="container px-4 text-center mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-display font-extrabold leading-tight md:leading-tight mb-6 tracking-tighter max-w-5xl mx-auto px-4">
              <span className="rainbow-text">
                Convert Website URL, ZIP & HTML Code to Android APK in 1 Click
              </span>
            </h1>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 px-4"
          >
            <Button 
              onClick={handleStart}
              className="glow-button w-full sm:w-auto px-8 md:px-10 py-5 md:py-6 text-lg font-bold bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl group relative overflow-hidden active:scale-95 shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)]"
            >
              <span className="flex items-center gap-3 relative z-10">
                {!user && <Lock className="w-4 h-4 md:w-5 md:h-5 text-white" />}
                <span className="drop-shadow-sm">Start Now</span>
                <ArrowRight className="w-5 h-5 md:w-6 md:h-6 group-hover:translate-x-1 transition-transform" />
              </span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </Button>
            
            <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 px-6 py-4 glass rounded-2xl text-white/40 text-xs sm:text-sm">
              <span className="flex items-center gap-1"><Box className="w-3 h-3 md:w-4 md:h-4" /> ZIP</span>
              <span className="hidden sm:inline w-1 h-1 rounded-full bg-white/20" />
              <span className="flex items-center gap-1"><Globe className="w-3 h-3 md:w-4 md:h-4" /> Web</span>
              <span className="hidden sm:inline w-1 h-1 rounded-full bg-white/20" />
              <span className="flex items-center gap-1"><Code2 className="w-3 h-3 md:w-4 md:h-4" /> HTML</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature Grid - Minimal */}
      <section className="py-20 bg-white/[0.02]">
        <div className="container px-4 grid grid-cols-1 md:grid-cols-3 gap-8 mx-auto">
          {[
            { title: 'Lightning Fast', desc: 'Our cloud servers compile your code in seconds, not minutes.', icon: Zap },
            { title: 'Any Platform', desc: 'Full support for Website URL, ZIP packages, and HTML code.', icon: Globe },
            { title: 'Secure & Private', desc: 'Your source code is encrypted and deleted immediately after build.', icon: Shield }
          ].map((f, i) => (
            <div key={i} className="glass p-8 rounded-3xl border-white/5 hover:border-blue-500/20 transition-all cursor-default group">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <f.icon className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-xl font-bold mb-2 font-display">{f.title}</h3>
              <p className="text-white/40 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <Pricing onSelect={handleSelectPlan} />
    </div>
  );
}
