import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, Lock, HelpCircle, Wrench, MessageSquare, 
  ExternalLink, Sparkles, CheckCircle2, ChevronRight 
} from 'lucide-react';
import SupportModal from './SupportModal';

export default function Footer() {
  const navigate = useNavigate();
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [modalCategory, setModalCategory] = useState('APK Build Issue / Stuck');

  const openSupportWithCategory = (cat: string) => {
    setModalCategory(cat);
    setSupportModalOpen(true);
  };

  return (
    <footer className="w-full bg-[#080b13] pt-14 pb-10 border-t border-white/10 text-white">
      <div className="container px-4 md:px-8 mx-auto">
        {/* Main 4-Column Categories Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 pb-12 border-b border-white/5">
          
          {/* Column 1: Brand & Overview */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 shadow-lg shadow-blue-500/20">
                <span className="text-white font-black text-sm tracking-wider">APK</span>
              </div>
              <div>
                <span className="font-display font-extrabold text-xl tracking-tight">APKify Builder</span>
                <p className="text-[11px] text-blue-400 font-semibold">Native Cloud Compilation Engine</p>
              </div>
            </div>
            <p className="text-xs text-white/50 leading-relaxed">
              Convert Website URLs, ZIP packages, and HTML code into signed Android APK binaries with zero local setup.
            </p>
            <div className="pt-2">
              <p className="text-xs text-white/40 italic flex items-center gap-1.5">
                <span>Built with ❤️ by</span>
                <span className="text-white font-medium">Kamaljit (LPU Student)</span>
              </p>
            </div>
          </div>

          {/* Column 2: Build Engines & Categories */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/80 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              Build Categories
            </h4>
            <ul className="space-y-2.5 text-xs text-white/50">
              <li>
                <Link to="/build" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-blue-500/50" /> Web URL to Android APK
                </Link>
              </li>
              <li>
                <Link to="/build" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-blue-500/50" /> ZIP Package Compiler
                </Link>
              </li>
              <li>
                <Link to="/build" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-blue-500/50" /> HTML5 & Canvas Apps
                </Link>
              </li>
              <li>
                <Link to="/#pricing" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-blue-500/50" /> Cloud Plans & Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Help, Support & Problem Solving (USER REQUESTED CATEGORY) */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00f2fe] animate-pulse"></span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white/90">
                Help & Problem Solving
              </h4>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                New
              </span>
            </div>
            <ul className="space-y-2.5 text-xs text-white/50">
              <li>
                <Link 
                  to="/support" 
                  className="hover:text-[#00f2fe] transition-colors flex items-center gap-1.5 font-semibold text-white/70"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-[#00f2fe]" /> Help & Support Center
                </Link>
              </li>
              <li>
                <button 
                  onClick={() => openSupportWithCategory('APK Build Issue / Stuck')}
                  className="hover:text-[#00f2fe] transition-colors flex items-center gap-1.5 text-left"
                >
                  <Wrench className="w-3.5 h-3.5 text-blue-400" /> Report Build Issue
                </button>
              </li>
              <li>
                <Link 
                  to="/support?tab=tickets" 
                  className="hover:text-[#00f2fe] transition-colors flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-purple-400" /> Track Developer Replies
                </Link>
              </li>
              <li>
                <button 
                  onClick={() => openSupportWithCategory('Feature Request & Ideas')}
                  className="hover:text-[#00f2fe] transition-colors flex items-center gap-1.5 text-left"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Feature Request & Ideas
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Security, Policies & Safety */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/80 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
              Safety & Governance
            </h4>
            <ul className="space-y-2.5 text-xs text-white/50">
              <li>
                <Link to="/terms-and-condition" className="hover:text-purple-400 transition-colors flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> Terms & Safety Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-and-condition#refill" className="hover:text-purple-400 transition-colors flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> 14-Day Auto-Refill Guarantee
                </Link>
              </li>
              <li>
                <Link to="/terms-and-condition#vault" className="hover:text-purple-400 transition-colors flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-blue-400" /> 7-Day Safety Vault
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-purple-400 transition-colors flex items-center gap-1.5">
                  <ChevronRight className="w-3 h-3 text-purple-500/50" /> About Developer & Project
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Safety & Compliance Badge Bottom Banner */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-white/40 gap-4">
          <div className="flex flex-wrap items-center gap-3 text-[11px]">
            <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              100% Operational
            </span>
            <span>&bull;</span>
            <span>24/7 Automated Cloud Infrastructure</span>
            <span>&bull;</span>
            <span>Developer SLA Support Active</span>
          </div>
          <div className="text-[11px] text-white/30">
            &copy; {new Date().getFullYear()} APKify Builder. All rights reserved.
          </div>
        </div>
      </div>

      {/* Support Pop-up Modal */}
      <SupportModal 
        isOpen={supportModalOpen}
        onClose={() => setSupportModalOpen(false)}
        defaultCategory={modalCategory}
      />
    </footer>
  );
}
