import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, Smartphone, ShieldCheck, Zap, HardDrive, 
  Search, Plus, Trash2, ArrowUpRight, Download, RefreshCw, 
  AlertCircle, CheckCircle2, Crown, Activity, Key
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

export default function AdminPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [builds, setBuilds] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'builds' | 'system'>('users');
  const [actionMsg, setActionMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Current logged in user check
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  })();

  // Verify Admin Access
  useEffect(() => {
    if (currentUser?.role !== 'admin') {
      navigate('/build', { replace: true });
      return;
    }
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [statsRes, usersRes, buildsRes] = await Promise.all([
        api.get('/admin/stats').catch(() => ({ data: { stats: null } })),
        api.get('/admin/users').catch(() => ({ data: { users: [] } })),
        api.get('/admin/builds').catch(() => ({ data: { builds: [] } }))
      ]);

      if (statsRes.data?.stats) setStats(statsRes.data.stats);
      if (usersRes.data?.users) setUsers(usersRes.data.users);
      if (buildsRes.data?.builds) setBuilds(buildsRes.data.builds);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to fetch admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspendUser = async (userId: string, email: string) => {
    const reason = window.prompt(`Enter 24-Hour Suspension reason for ${email}:`, '24-hour temporary timeout for policy violation');
    if (reason === null) return;
    try {
      const res = await api.put(`/admin/users/${userId}/suspend-24h`, { reason });
      if (res.data.success) {
        setUsers(users.map(u => u._id === userId ? { 
          ...u, 
          status: 'suspended', 
          suspended_until: res.data.user?.suspended_until || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          violation_reason: reason 
        } : u));
        showActionToast(`User ${email} suspended for 24 hours`);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to suspend user');
    }
  };

  const handleBanUser = async (userId: string, email: string) => {
    const reason = window.prompt(`Enter Permanent Ban reason for ${email}:`, 'Violation of platform Terms of Service');
    if (reason === null) return;
    try {
      const res = await api.put(`/admin/users/${userId}/ban`, { reason });
      if (res.data.success) {
        setUsers(users.map(u => u._id === userId ? { 
          ...u, 
          status: 'banned', 
          suspended_until: null,
          violation_reason: reason 
        } : u));
        showActionToast(`User ${email} has been permanently banned`);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to ban user');
    }
  };

  const handleUnbanUser = async (userId: string, email: string) => {
    if (!window.confirm(`Restore and reactivate user ${email}?`)) return;
    try {
      const res = await api.put(`/admin/users/${userId}/unban`);
      if (res.data.success) {
        setUsers(users.map(u => u._id === userId ? { 
          ...u, 
          status: 'active', 
          suspended_until: null,
          violation_reason: '' 
        } : u));
        showActionToast(`User ${email} restored to Active`);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to unban user');
    }
  };

  const handleClearFlags = async (userId: string, email: string) => {
    try {
      const res = await api.put(`/admin/users/${userId}/clear-flags`);
      if (res.data.success) {
        setUsers(users.map(u => u._id === userId ? { ...u, violation_flags: [] } : u));
        showActionToast(`Safety flags cleared for ${email}`);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to clear flags');
    }
  };

  const handleDeleteBuild = async (buildId: string, apkName: string) => {
    if (!window.confirm(`Delete build record for: "${apkName}"?`)) return;
    try {
      const res = await api.delete(`/admin/builds/${buildId}`);
      if (res.data.success) {
        setBuilds(builds.filter(b => (b._id || b.id) !== buildId));
        showActionToast(`Build "${apkName}" deleted`);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to delete build');
    }
  };

  const handleCleanupBuilds = async () => {
    if (!window.confirm('Run Smart Cleanup to remove all expired, failed, and broken build records?')) return;
    try {
      const res = await api.post('/admin/builds/cleanup');
      if (res.data.success) {
        showActionToast(res.data.message || 'Smart cleanup complete');
        loadAdminData();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to clean builds');
    }
  };

  const handleClearAllBuilds = async () => {
    if (!window.confirm('CAUTION: Are you sure you want to WIPE all APK build records from the database? This cannot be undone.')) return;
    try {
      const res = await api.post('/admin/builds/clear-all');
      if (res.data.success) {
        setBuilds([]);
        showActionToast('All build records cleared successfully');
        loadAdminData();
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to clear database');
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete user: ${email}?`)) return;
    try {
      const res = await api.delete(`/admin/users/${userId}`);
      if (res.data.success) {
        setUsers(users.filter(u => u._id !== userId));
        showActionToast(`User ${email} deleted successfully`);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to delete user');
    }
  };

  const showActionToast = (msg: string) => {
    setActionMsg(msg);
    setTimeout(() => setActionMsg(''), 3000);
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.fullName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen pt-24 pb-16 px-4 sm:px-6 lg:px-8 text-white max-w-7xl mx-auto">
      {/* HEADER BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-white/10 gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold mb-2">
            <ShieldCheck className="w-4 h-4" /> Super Admin Portal
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
            APKify Control Center
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Logged in as <span className="text-white font-semibold">{currentUser?.email}</span> (Unlimited Access)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={loadAdminData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
          </button>
          <button 
            onClick={() => navigate('/build')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00f2fe] to-[#4facfe] text-black font-bold text-xs shadow-lg shadow-[#00f2fe]/20 hover:opacity-95 transition-all"
          >
            <Smartphone className="w-4 h-4" /> Open APK Builder
          </button>
        </div>
      </div>

      {/* TOASTS */}
      {actionMsg && (
        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" /> {actionMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}
        </div>
      )}

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <div className="glass p-6 rounded-3xl border-white/5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-gray-400">Total Users</p>
              <h3 className="text-3xl font-black mt-2">{stats?.totalUsers ?? users.length}</h3>
            </div>
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-blue-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-4 flex items-center gap-1">
            <span className="text-green-400 font-bold">{stats?.proUsers ?? 0} Pro</span> users
          </p>
        </div>

        <div className="glass p-6 rounded-3xl border-white/5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-gray-400">Total APKs Built</p>
              <h3 className="text-3xl font-black mt-2">{stats?.totalBuilds ?? builds.length}</h3>
            </div>
            <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-2xl text-purple-400">
              <Smartphone className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-4 flex items-center gap-1">
            <span className="text-[#00f2fe] font-bold">+{stats?.buildsToday ?? 0}</span> built today
          </p>
        </div>

        <div className="glass p-6 rounded-3xl border-white/5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-gray-400">Cloud Runner</p>
              <h3 className="text-2xl font-black mt-2 text-green-400">16GB Active</h3>
            </div>
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-2xl text-green-400">
              <Zap className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-4">GitHub Actions 24/7 Engine</p>
        </div>

        <div className="glass p-6 rounded-3xl border-white/5 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-gray-400">Backend API</p>
              <h3 className="text-2xl font-black mt-2 text-[#00f2fe]">Online (200)</h3>
            </div>
            <div className="p-3 bg-[#00f2fe]/10 border border-[#00f2fe]/20 rounded-2xl text-[#00f2fe]">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <p className="text-[11px] text-gray-400 mt-4">Google AI Studio</p>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 border-b border-white/10 mt-10">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 ${
            activeTab === 'users' 
              ? 'border-[#00f2fe] text-[#00f2fe]' 
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          User Accounts ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('builds')}
          className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 ${
            activeTab === 'builds' 
              ? 'border-[#00f2fe] text-[#00f2fe]' 
              : 'border-transparent text-gray-400 hover:text-white'
          }`}
        >
          All APK Builds ({builds.length})
        </button>
      </div>

      {/* TAB 1: USERS MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="mt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search user by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs outline-none focus:border-[#00f2fe]"
              />
            </div>
          </div>

          <div className="glass border-white/5 rounded-3xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 border-b border-white/10 text-gray-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-4 px-6">User</th>
                    <th className="py-4 px-6">Status / Flags</th>
                    <th className="py-4 px-6">Plan</th>
                    <th className="py-4 px-6">Credits Remaining</th>
                    <th className="py-4 px-6">Auto-Refill Cycle</th>
                    <th className="py-4 px-6">Joined Date</th>
                    <th className="py-4 px-6 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium">
                  {filteredUsers.map((u) => (
                    <tr key={u._id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-bold text-white text-sm">{u.fullName || 'No Name'}</div>
                        <div className="text-gray-400 text-xs font-mono">{u.email}</div>
                        {u.violation_flags && u.violation_flags.length > 0 && (
                          <div className="mt-1 flex flex-wrap items-center gap-1">
                            {u.violation_flags.map((flag: string, idx: number) => (
                              <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 font-medium border border-red-500/30">
                                {flag}
                              </span>
                            ))}
                            <button
                              onClick={() => handleClearFlags(u._id, u.email)}
                              className="text-[9px] text-gray-400 hover:text-white underline ml-1"
                              title="Dismiss safety flags"
                            >
                              Clear
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        {u.role === 'admin' ? (
                          <span className="px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 font-bold text-[10px]">
                            Super Admin
                          </span>
                        ) : u.status === 'banned' ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 font-bold text-[10px]">
                              🔴 Banned
                            </span>
                            {u.violation_reason && (
                              <div className="text-[9px] text-red-300/80 mt-1 max-w-[140px] truncate" title={u.violation_reason}>
                                {u.violation_reason}
                              </div>
                            )}
                          </div>
                        ) : u.status === 'suspended' && u.suspended_until && new Date(u.suspended_until) > new Date() ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold text-[10px]">
                              🟡 Suspended (24h)
                            </span>
                            <div className="text-[9px] text-amber-300/80 mt-1">
                              Until: {new Date(u.suspended_until).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold text-[10px]">
                            🟢 Active
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          u.plan_type === 'Enterprise Admin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30' :
                          u.plan_type === 'Pro' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30' :
                          'bg-white/5 text-gray-300 border border-white/10'
                        }`}>
                          {u.plan_type || 'Free'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-mono text-sm font-bold text-[#00f2fe]">
                          {u.role === 'admin' ? '∞ Unlimited' : `${u.credits_remaining} / ${u.plan_type === 'Free' ? 3 : 50}`}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {u.role === 'admin' ? (
                          <span className="text-gray-400 text-[11px]">N/A</span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            14-Day Auto Refill
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-gray-400">
                        {u.signup_date ? new Date(u.signup_date).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-4 px-6 text-right">
                        {u.role !== 'admin' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            {u.status === 'banned' ? (
                              <button
                                onClick={() => handleUnbanUser(u._id, u.email)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold transition-all"
                                title="Reactivate user"
                              >
                                Unban
                              </button>
                            ) : (
                              <>
                                <button
                                  onClick={() => handleSuspendUser(u._id, u.email)}
                                  className="px-2 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-semibold transition-all"
                                  title="Suspend account for 24 hours"
                                >
                                  24h Timeout
                                </button>
                                <button
                                  onClick={() => handleBanUser(u._id, u.email)}
                                  className="px-2 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-[10px] font-bold transition-all"
                                  title="Permanently ban user"
                                >
                                  Ban
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleDeleteUser(u._id, u.email)}
                              className="p-1 rounded-lg bg-white/5 hover:bg-red-500/10 text-gray-400 hover:text-red-400 border border-white/10 transition-colors ml-1"
                              title="Delete Account"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-gray-500 font-mono">Super Admin</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400 text-xs">
                        No user accounts match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BUILDS HISTORY */}
      {activeTab === 'builds' && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/[0.02] border border-white/10 p-4 rounded-2xl">
            <div>
              <h3 className="font-bold text-sm text-white">APK Cloud Builds Registry</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Total builds recorded: <span className="text-[#00f2fe] font-bold">{builds.length}</span> (auto-cleaned every 12h)
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCleanupBuilds}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-all"
                title="Automatically purge expired/failed builds"
              >
                <RefreshCw className="w-3 h-3" /> Smart Cleanup
              </button>
              <button
                onClick={handleClearAllBuilds}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-semibold transition-all"
                title="Wipe all APK build records from database"
              >
                <Trash2 className="w-3 h-3" /> Clear All History
              </button>
            </div>
          </div>

          <div className="glass border-white/5 rounded-3xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 border-b border-white/10 text-gray-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-4 px-6">App Name</th>
                    <th className="py-4 px-6">Built By (User)</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6">Created Date</th>
                    <th className="py-4 px-6 text-right">Download APK</th>
                    <th className="py-4 px-6 text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-medium">
                  {builds.map((b) => {
                    const buildId = b._id || b.id;
                    const userEmail = b.user_email || (typeof b.user_id === 'object' && b.user_id?.email ? b.user_id.email : 'Unknown User');
                    const userName = b.user_name || (typeof b.user_id === 'object' && b.user_id?.fullName ? b.user_id.fullName : '');

                    return (
                      <tr key={buildId} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-6 font-bold text-white">
                          <div className="text-sm font-semibold">{b.apk_name || 'Android App'}</div>
                          <div className="text-[10px] text-gray-500 font-mono">ID: {String(buildId).slice(-8)}</div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-mono text-xs font-semibold text-[#00f2fe]">{userEmail}</div>
                          {userName && <div className="text-[10px] text-gray-400">{userName}</div>}
                        </td>
                        <td className="py-4 px-6">
                          {b.status === 'Completed' ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-[10px]">
                              Completed
                            </span>
                          ) : b.status === 'Failed' ? (
                            <span className="px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 font-bold text-[10px]">
                              Failed
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold text-[10px]">
                              {b.status || 'Building'}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-gray-400">
                          {b.created_at || b.createdAt ? new Date(b.created_at || b.createdAt).toLocaleString() : 'Recent'}
                        </td>
                        <td className="py-4 px-6 text-right">
                          {b.downloadUrl && b.downloadUrl !== '#' ? (
                            <a
                              href={b.downloadUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00f2fe]/10 hover:bg-[#00f2fe]/20 text-[#00f2fe] border border-[#00f2fe]/30 font-bold text-xs transition-all"
                            >
                              <Download className="w-3.5 h-3.5" /> Download
                            </a>
                          ) : (
                            <span className="text-gray-500 text-[11px] italic">No Link</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleDeleteBuild(buildId, b.apk_name || 'App')}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition-colors"
                            title="Delete this build record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {builds.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-gray-400 text-xs">
                        No APK builds recorded in database yet. Build an app to see it here!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
