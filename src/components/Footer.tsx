import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, HelpCircle, Wrench, CreditCard, Info, Github
} from 'lucide-react';
import SupportModal from './SupportModal';

export default function Footer() {
  const [supportModalOpen, setSupportModalOpen] = useState(false);

  return (
    <footer className="w-full bg-[#080b13] pt-12 pb-10 border-t border-white/10 text-white">
      <div className="container px-4 md:px-8 mx-auto">
        {/* Main Clean Categorized Footer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 pb-10 border-b border-white/5">
          
          {/* 1. Brand & Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 shadow-md shadow-blue-500/20">
                <span className="text-white font-black text-xs tracking-wider">APK</span>
              </div>
              <span className="font-display font-extrabold text-lg">APKify Builder</span>
            </div>
            <p className="text-xs text-white/50 leading-relaxed">
              Convert Website URLs, ZIP packages, and HTML code into signed Android APK binaries in 1 click.
            </p>
            <p className="text-xs text-white/40 italic pt-1">
              Built with ❤️ by <span className="text-white font-medium">Kamaljit (BCA Student)</span>
            </p>
          </div>

          {/* 2. Product */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/80 mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              Product
            </h4>
            <ul className="space-y-2 text-xs text-white/60">
              <li>
                <Link to="/build" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-blue-400" /> APK Cloud Builder
                </Link>
              </li>
              <li>
                <Link to="/payment" className="hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-blue-400" /> Plans & Pricing
                </Link>
              </li>
            </ul>
          </div>

          {/* 3. Help & Problem Solving (Single, clear, non-repetitive) */}
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00f2fe] animate-pulse"></span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white/90">
                Support & Help
              </h4>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                New
              </span>
            </div>
            <ul className="space-y-2 text-xs text-white/60">
              <li>
                <Link 
                  to="/support" 
                  className="hover:text-[#00f2fe] transition-colors flex items-center gap-1.5 font-semibold text-white/90"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-[#00f2fe]" /> Help & Support Desk
                </Link>
              </li>
              <li>
                <button
                  onClick={() => setSupportModalOpen(true)}
                  className="hover:text-[#00f2fe] transition-colors text-white/50 text-[11px] text-left"
                >
                  &rarr; Quick Report Issue (Popup)
                </button>
              </li>
            </ul>
          </div>

          {/* 4. Safety & Governance */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-white/80 mb-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
              Safety & Terms
            </h4>
            <ul className="space-y-2 text-xs text-white/60">
              <li>
                <Link to="/terms-and-condition" className="hover:text-purple-400 transition-colors flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400" /> Terms & Safety Policy
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-purple-400 transition-colors flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-purple-400" /> About Developer
                </Link>
              </li>
              <li>
                <a 
                  href="https://github.com/raj40870-pixel" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-purple-400 transition-colors flex items-center gap-1.5"
                >
                  <Github className="w-3.5 h-3.5 text-purple-400" /> GitHub
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-white/40 gap-4">
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              24/7 Automated Infrastructure
            </span>
            <span>&bull;</span>
            <span>14-Day Auto-Refill Guarantee</span>
            <span>&bull;</span>
            <span>Developer Support Active</span>
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
      />
    </footer>
  );
}
