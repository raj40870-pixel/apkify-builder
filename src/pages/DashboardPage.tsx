import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Camera, Box, LogOut, Shield, User as UserIcon, Clock, Trash2, Download } from 'lucide-react';
import { User as UserType } from '../types';
import { logout, getStoredUser, fetchMe } from '../lib/auth';
import { fetchBuildHistory, deleteBuildsAPI } from '../lib/freeCreditSystem';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../lib/api';

interface DashboardPageProps {
  user: UserType;
  builds?: any[]; // Unused now
  onLogout: () => void;
}

export default function DashboardPage({ user, onLogout: parentOnLogout }: DashboardPageProps) {
  const navigate = useNavigate();
  const [profileImage, setProfileImage] = useState<string | null>(user?.photoURL || null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creditState, setCreditState] = useState({ 
    creditsRemaining: getStoredUser()?.credits_remaining ?? 3, 
    creditsLimit: getStoredUser()?.plan === 'Agency' ? 1000 : getStoredUser()?.plan === 'Pro' ? 200 : getStoredUser()?.plan === 'Basic' ? 50 : 3, 
    historyLimit: getStoredUser()?.history_limit ?? 10 
  });
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Fetch live user state on load
    fetchMe().then((u) => {
      if (u) {
        setCreditState(prev => ({ 
          ...prev, 
          creditsRemaining: u.credits_remaining ?? 3,
          creditsLimit: u.plan === 'Agency' ? 1000 : u.plan === 'Pro' ? 200 : u.plan === 'Basic' ? 50 : 3,
          historyLimit: u.history_limit ?? 10
        }));
      }
    });
    if (!user) return;
    
    fetchBuildHistory().then((builds) => {
      const normalized = builds.map((h: any) => ({
        id: h._id,
        app_name: h.apk_name || 'Untitled App',
        app_version: '1.0.0',
        created_at: h.created_at || new Date().toISOString(),
        status: h.status === 'Success' ? 'Completed' : (h.status || 'Completed'),
        progress: 100,
        downloadUrl: h.downloadUrl,
      }));
      setHistory(normalized);
      setLoading(false);
    }).catch(e => {
      console.error('Failed to load build history:', e);
      setHistory([]);
      setLoading(false);
    });
  }, [user]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    parentOnLogout();
    navigate('/');
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleClearHistoryClick = () => {
    setIsSelectionMode(true);
    setSelectedIds([]);
  };

  const cancelSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedIds([]);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (window.confirm('Are you sure you want to permanently delete the selected APK history?')) {
      const success = await deleteBuildsAPI(selectedIds);
      if (success) {
        setHistory(prev => prev.filter(b => !selectedIds.includes(b.id)));
        cancelSelectionMode();
      } else {
        alert('Failed to delete history');
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
        storedUser.photoURL = reader.result;
        localStorage.setItem('user', JSON.stringify(storedUser));
        window.dispatchEvent(new Event('auth:updated'));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="container px-4 py-8 md:py-12 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-white mb-1">Dashboard</h1>
          <p className="text-white/40 text-sm">Manage your account and recent builds.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 md:gap-8">
        
        {/* Left Column: Profile */}
        <div className="space-y-6 lg:col-span-1">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass border border-white/10 rounded-3xl p-6 text-center shadow-xl shadow-black/20 relative overflow-hidden"
          >
            {/* Background accent */}
            <div className="absolute -top-10 -left-10 w-32 h-32 bg-blue-500/20 rounded-full blur-3xl" />
            
            <div className="relative inline-block group mb-5">
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-24 h-24 md:w-28 md:h-28 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center bg-white/5 overflow-hidden cursor-pointer group-hover:border-blue-500/50 transition-colors shadow-lg"
              >
                {profileImage ? (
                  <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center">
                    <UserIcon className="w-8 h-8 text-white/20 mb-1" />
                  </div>
                )}
                
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                className="hidden" 
              />
            </div>

            <h2 className="text-xl font-bold font-display truncate mb-1 text-white/90">{user.fullName}</h2>
            <p className="text-white/40 text-sm truncate mb-6">{user.email}</p>

            
            <button 
              onClick={handleLogout}
              className="flex items-center justify-center w-full gap-2 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 text-sm font-bold transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass border border-white/10 rounded-3xl p-6 relative overflow-hidden bg-gradient-to-br from-white/[0.03] to-white/[0.01]"
          >
            <div className="absolute -bottom-6 -right-6 p-4 opacity-10">
              <Shield className="w-24 h-24 text-blue-400" />
            </div>
            <p className="text-white/40 text-xs uppercase tracking-widest font-bold mb-3">Subscription</p>
            <h3 className="text-2xl font-bold text-white mb-2">
              {user.plan || 'Free'} Plan
            </h3>
            
            <div className="space-y-3 mt-4">
               <div className="flex justify-between items-center text-sm">
                 <span className="text-white/60">APK Build Credits:</span>
                 <span className="font-bold text-white">{creditState.creditsRemaining} / {creditState.creditsLimit}</span>
               </div>
               <div className="flex justify-between items-center text-sm">
                 <span className="text-white/60">History Usage:</span>
                 <span className="font-bold text-white">{history.length} / {creditState.historyLimit}</span>
               </div>
               {(!user.plan || user.plan === 'Free' || user.plan.toLowerCase() === 'free') ? (
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-white/60">Renewal:</span>
                   <span className="font-bold text-white">Every 14 Days</span>
                 </div>
               ) : user.plan_expiry_date ? (
                 <div className="flex justify-between items-center text-sm">
                   <span className="text-white/60">Plan Expires:</span>
                   <span className="font-bold text-white">
                     {new Date(user.plan_expiry_date).toLocaleDateString()}
                   </span>
                 </div>
               ) : null}
            </div>
            
            {(!user.plan || user.plan === 'Free') && (
              <div className="mt-5 pt-5 border-t border-white/5 text-center">
                <button 
                  onClick={() => { 
                    navigate('/'); 
                    setTimeout(() => { 
                      const el = document.getElementById('pricing'); 
                      if (el) el.scrollIntoView({ behavior: 'smooth' }); 
                    }, 100); 
                  }}
                  className="text-xs font-medium px-4 py-1.5 bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30 rounded-full inline-block w-full shadow-lg shadow-amber-900/20 hover:bg-amber-500/10 transition-colors"
                >
                  Upgrade to Premium Plan
                </button>
              </div>
            )}
          </motion.div>

        </div>

        {/* Right Column: Build History */}
        <div className="lg:col-span-3">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass border border-white/10 rounded-3xl p-6 md:p-8 min-h-[450px] flex flex-col shadow-xl shadow-black/20"
          >
            <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600/20 to-purple-600/20 flex items-center justify-center border border-white/5">
                  <Box className="w-6 h-6 text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold font-display">Your Apps</h2>
              </div>
              <div className="flex items-center gap-2">
                {isSelectionMode ? (
                  <>
                    <button
                      onClick={handleDeleteSelected}
                      disabled={selectedIds.length === 0}
                      className="text-sm font-bold text-white bg-red-600 px-4 py-2 rounded-lg hover:bg-red-500 transition-colors disabled:opacity-50"
                    >
                      Delete Selected
                    </button>
                    <button
                      onClick={cancelSelectionMode}
                      className="text-sm font-bold text-white/70 bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 transition-colors"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    {history.length > 0 && (
                      <button
                        onClick={handleClearHistoryClick}
                        className="text-sm font-bold text-red-400/70 hover:text-red-400 transition-colors flex items-center gap-1 bg-red-500/10 px-3 py-2 rounded-lg hover:bg-red-500/20"
                        title="Delete History"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    )}
                    <button onClick={() => navigate('/build')} className="text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 bg-blue-500/10 px-4 py-2 rounded-lg hover:bg-blue-500/20">
                      + New Build
                    </button>
                  </>
                )}
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center flex-1 text-center opacity-80">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-white/40">Loading build history...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 text-center space-y-4 opacity-80">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center border border-dashed border-white/20 mb-2 shadow-inner">
                  <Box className="w-8 h-8 text-white/20" />
                </div>
                <h3 className="text-xl font-bold text-white/80">No apps built yet</h3>
                <p className="text-white/40 text-sm max-w-sm">You haven't converted any projects to APK yet. Start your first build to see it here.</p>
                <button 
                  onClick={() => navigate('/build')}
                  className="mt-4 px-6 py-3 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl font-medium transition-colors"
                >
                  Create your first app
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((build: any) => (
                  <div 
                    key={build.id} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-blue-500/30 hover:bg-white/[0.05] transition-all group gap-4 shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      {isSelectionMode && (
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(build.id)}
                          onChange={() => toggleSelection(build.id)}
                          className="w-5 h-5 rounded border-white/20 bg-white/5 checked:bg-blue-500 focus:ring-blue-500 focus:ring-offset-0 focus:ring-2 focus:outline-none transition-all cursor-pointer"
                        />
                      )}
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600/20 to-purple-600/20 flex items-center justify-center border border-white/5 group-hover:scale-105 transition-transform">
                        <Box className="w-6 h-6 text-blue-400" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-lg group-hover:text-blue-400 transition-colors tracking-tight">{build.app_name}</h4>
                        <p className="text-xs text-white/40 mt-1">
                          {new Date(build.created_at).toLocaleDateString()} • v{build.app_version || '1.0.0'}
                        </p>
                      </div>
                    </div>
                    <div className="flex sm:justify-end items-center gap-3">
                       {build.status === 'Completed' && (
                         <a 
                           href={build.downloadUrl ? (build.downloadUrl.startsWith('http') ? build.downloadUrl : `${API_BASE_URL}${build.downloadUrl}`) : '#'}
                           onClick={(e) => { if (!build.downloadUrl) { e.preventDefault(); alert('Download link is unavailable for this older build.'); } }}
                           download
                           className="text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1.5 transition-colors shadow-lg shadow-blue-900/20"
                         >
                           <Download className="w-3 h-3" /> Download APK
                         </a>
                       )}
                       <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                         build.status === 'Completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                         build.status === 'Building' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                         'bg-red-500/10 text-red-400 border-red-500/20'
                       }`}>
                         {build.status} {build.status === 'Building' ? `(${build.progress || 0}%)` : ''}
                       </span>
                       <span className="text-xs text-white/20 flex items-center gap-1">
                         <Clock className="w-3 h-3" />
                         {new Date(build.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                       </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
