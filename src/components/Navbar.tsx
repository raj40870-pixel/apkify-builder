import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, LogIn, UserCircle, LogOut, ChevronDown, Wrench, ShieldCheck } from 'lucide-react';
import { Button } from './ui/button';
import { Link, useNavigate } from 'react-router-dom';

interface NavbarProps {
  user: any;
  onLogout: () => void;
}

export default function Navbar({ user, onLogout }: NavbarProps) {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleLogout = () => {
    onLogout();
    setShowDropdown(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 w-full glass">
      <div className="container flex h-16 items-center justify-between px-4 md:px-8">
        <Link 
          to="/"
          className="flex items-center gap-2 group"
        >
          <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-purple-600 group-hover:scale-110 transition-transform">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <span className="font-display font-bold text-xl hidden sm:inline-block">APKify</span>
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="relative">
              <div 
                className="flex items-center gap-2 cursor-pointer p-1 pr-3 rounded-full hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <div className="w-8 h-8 border border-white/10 rounded-full bg-blue-600 flex items-center justify-center text-[10px]">
                  {user.fullName?.charAt(0) || user.displayName?.charAt(0) || 'U'}
                </div>
                <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </div>

              <AnimatePresence>
                {showDropdown && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-56 glass border border-white/10 rounded-2xl p-2 shadow-2xl z-50 overflow-hidden"
                  >
                    <div className="p-3 mb-1 border-b border-white/5">
                      <p className="text-sm font-bold truncate">{user.displayName}</p>
                      {user.role === 'admin' && (
                        <span className="inline-block mt-0.5 text-[9px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono font-bold tracking-wider">
                          SUPER ADMIN
                        </span>
                      )}
                      <p className="text-[10px] text-white/40 truncate">{user.email}</p>
                    </div>

{user.role === 'admin' && (
                      <Link 
                        to="/admin" 
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-3 p-3 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 text-sm font-semibold transition-colors group mb-1 border border-purple-500/20"
                      >
                        <ShieldCheck className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                        Admin Panel
                      </Link>
                    )}

                    <Link 
                      to="/accounts/dashboard" 
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-sm transition-colors group"
                    >
                      <UserCircle className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                      Account
                    </Link>

                    <Link 
                      to="/build" 
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 text-sm transition-colors group"
                    >
                      <Wrench className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                      Build
                    </Link>
                    
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-500/10 text-sm text-red-400 transition-colors group text-left"
                    >
                      <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
              
              {/* Overlay to close dropdown */}
              {showDropdown && (
                <div 
                  className="fixed inset-0 z-40 bg-transparent" 
                  onClick={() => setShowDropdown(false)}
                />
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link to="/login">
                <Button 
                  variant="ghost"
                  className="text-white hover:bg-white/10 font-bold px-2 sm:px-4 text-xs sm:text-sm"
                >
                  Login
                </Button>
              </Link>
              <Link to="/signup">
                <Button 
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl px-3 sm:px-4 text-xs sm:text-sm"
                >
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
