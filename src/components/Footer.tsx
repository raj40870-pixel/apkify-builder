import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Lock } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="w-full bg-[#0a0a0f] py-12 border-t border-white/5">
      <div className="container px-4 md:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600">
              <span className="text-white font-bold text-xs">APK</span>
            </div>
            <div>
              <span className="font-display font-bold text-lg">APKify Builder</span>
              <p className="text-[11px] text-white/40">Next-Gen Android Cloud Build Engine</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-sm text-white/50">
            <Link to="/about" className="hover:text-white transition-colors">About</Link>
            <Link to="/terms-and-condition" className="hover:text-white transition-colors flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" /> Terms & Safety Policy
            </Link>
            <Link to="/terms-and-condition" className="hover:text-white transition-colors flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-purple-400" /> Account Moderation
            </Link>
          </div>
          
          <p className="text-sm text-white/40 italic">
            Built with ❤️ by LPU Student
          </p>
        </div>

        {/* Safety & Compliance Badge */}
        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between text-xs text-white/30 gap-4">
          <div className="flex items-center gap-2 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>24/7 Automated Infrastructure &bull; 15-Day Auto Refill &bull; Active Anti-Abuse Shield</span>
          </div>
          <div>
            &copy; {new Date().getFullYear()} APKify Builder. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
