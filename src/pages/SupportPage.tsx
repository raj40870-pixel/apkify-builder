import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  HelpCircle, Wrench, Download, CreditCard, UserCheck, Sparkles, 
  Send, Clock, CheckCircle2, AlertCircle, MessageSquare, RefreshCw, 
  ArrowLeft, ShieldCheck, ChevronRight
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../lib/api';
import { Button } from '../components/ui/button';

interface Ticket {
  _id: string;
  user_email: string;
  user_name?: string;
  category: string;
  subject: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  admin_reply?: string;
  admin_replied_at?: string;
  admin_name?: string;
  created_at: string;
}

const CATEGORIES = [
  { id: 'APK Build Issue / Stuck', label: 'APK Build Issue / Stuck', icon: Wrench, desc: 'Gradle compile error, stuck at 99%, or build failed' },
  { id: 'Download Link Expired / Broken', label: 'Download Link Expired / Broken', icon: Download, desc: 'Unable to download APK, 404 error or broken link' },
  { id: 'Credits & 14-Day Auto-Refill', label: 'Credits & 14-Day Auto-Refill', icon: CreditCard, desc: 'Credit refill delay, billing or plan inquiries' },
  { id: 'Account, Login & 2FA', label: 'Account, Login & 2FA', icon: UserCheck, desc: 'OTP verification, password reset, or account suspension' },
  { id: 'Feature Request & Ideas', label: 'Feature Request & Ideas', icon: Sparkles, desc: 'Suggest new plugins, Cordova/Capacitor tools or features' },
  { id: 'General Problem Solving', label: 'General Problem Solving', icon: HelpCircle, desc: 'Any other issue, bug report or technical question' }
];

export default function SupportPage() {
  const navigate = useNavigate();
  const location = useLocation();

  // Check query param for default tab or category
  const queryParams = new URLSearchParams(location.search);
  const defaultTab = queryParams.get('tab') === 'tickets' ? 'tickets' : 'submit';
  const initialCategory = queryParams.get('category') || 'APK Build Issue / Stuck';

  const [activeTab, setActiveTab] = useState<'submit' | 'tickets'>(defaultTab);
  const [category, setCategory] = useState(initialCategory);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [ticketSearch, setTicketSearch] = useState('');

  // Get current logged-in user if available
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  })();

  useEffect(() => {
    if (currentUser?.email) {
      setEmail(currentUser.email);
      setName(currentUser.fullName || currentUser.displayName || '');
    }
    loadMyTickets();
  }, []);

  const loadMyTickets = async () => {
    setLoadingTickets(true);
    try {
      const emailQuery = currentUser?.email ? `?email=${encodeURIComponent(currentUser.email)}` : '';
      const res = await api.get(`/support/my-tickets${emailQuery}`);
      if (res.data?.success) {
        setTickets(res.data.tickets || []);
      }
    } catch (err: any) {
      console.warn('Failed to load tickets:', err);
    } finally {
      setLoadingTickets(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!subject.trim()) {
      setSubmitError('Please enter an issue subject/title');
      return;
    }
    if (!description.trim()) {
      setSubmitError('Please describe the problem you are experiencing');
      return;
    }
    const ticketEmail = currentUser?.email || email;
    if (!ticketEmail.trim()) {
      setSubmitError('Please enter your email address so we can reply to you');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/support/tickets', {
        category,
        subject: subject.trim(),
        description: description.trim(),
        email: ticketEmail.trim(),
        name: currentUser?.fullName || name.trim() || 'User'
      });

      if (res.data?.success) {
        setSubmitSuccess(true);
        setSubject('');
        setDescription('');
        loadMyTickets();
        setTimeout(() => {
          setSubmitSuccess(false);
          setActiveTab('tickets');
        }, 2500);
      }
    } catch (err: any) {
      setSubmitError(err.response?.data?.error || 'Failed to submit support ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredTickets = tickets.filter(t => 
    t.subject.toLowerCase().includes(ticketSearch.toLowerCase()) ||
    t.category.toLowerCase().includes(ticketSearch.toLowerCase()) ||
    t.description.toLowerCase().includes(ticketSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 text-white max-w-5xl mx-auto">
      {/* Back button */}
      <div className="mb-6">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-xs font-semibold text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
      </div>

      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-4">
          <HelpCircle className="w-3.5 h-3.5" /> 24/7 Community & Problem Solving Desk
        </div>
        <h1 className="text-3xl sm:text-5xl font-black font-display tracking-tight leading-tight">
          Help & Problem Solving Center
        </h1>
        <p className="mt-3 text-sm sm:text-base text-white/50 leading-relaxed">
          Facing an issue with your APK build, download link, or credits? Submit your issue below.
          Our lead developer reviews and replies directly to your ticket with status updates.
        </p>
      </div>

      {/* Tabs navigation */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex p-1.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl">
          <button
            onClick={() => setActiveTab('submit')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all ${
              activeTab === 'submit'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <Send className="w-4 h-4" /> Submit New Issue
          </button>
          <button
            onClick={() => {
              setActiveTab('tickets');
              loadMyTickets();
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all relative ${
              activeTab === 'tickets'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> 
            My Issues & Developer Replies
            {tickets.length > 0 && (
              <span className="ml-1.5 px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-mono">
                {tickets.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* TAB 1: SUBMIT NEW ISSUE */}
      {activeTab === 'submit' && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass p-6 sm:p-10 rounded-3xl border-white/10 shadow-2xl relative overflow-hidden"
        >
          {submitSuccess && (
            <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center gap-3 text-sm">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <div>
                <p className="font-bold">Support Ticket Submitted Successfully!</p>
                <p className="text-xs text-emerald-300/80 mt-0.5">
                  Redirecting to your tickets tracker. Developer Kamaljit will review your issue and post a reply.
                </p>
              </div>
            </div>
          )}

          {submitError && (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 flex items-center gap-3 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Select Category */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-3">
                1. Select Problem Category
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = category === cat.id;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 text-left ${
                        isSelected
                          ? 'bg-blue-600/15 border-blue-500 text-white shadow-lg shadow-blue-500/10'
                          : 'bg-white/[0.02] border-white/5 text-white/70 hover:bg-white/[0.05] hover:border-white/15'
                      }`}
                    >
                      <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/50'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold leading-tight">{cat.label}</p>
                        <p className="text-[10px] text-white/40 mt-1 leading-snug">{cat.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: User Contact (if not logged in) */}
            {!currentUser?.email && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-white/70 mb-1.5">
                    Your Email Address *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-xs sm:text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/70 mb-1.5">
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Kamaljit"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-xs sm:text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Issue Subject */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/70 mb-2">
                2. Issue Subject / Title *
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Build #4 stuck at 99% or APK failed to download"
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-xs sm:text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Step 4: Issue Description */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-white/70">
                  3. Detailed Problem Description *
                </label>
                <span className="text-[11px] text-white/40">Be as descriptive as possible</span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                placeholder="Describe what happened: what were you trying to build (Website URL, ZIP, or HTML)? What error appeared on screen? Did you see any specific error message?"
                required
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-xs sm:text-sm text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition-colors leading-relaxed"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-[11px] text-white/40 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                <span>Protected by 24/7 Developer SLA &bull; Verified Replies Only</span>
              </div>
              <Button
                type="submit"
                disabled={submitting}
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 text-xs sm:text-sm transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Submitting Issue...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> Submit Problem Ticket
                  </>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      )}

      {/* TAB 2: MY TICKETS & DEVELOPER REPLIES */}
      {activeTab === 'tickets' && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header & Refresh */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
            <div>
              <h2 className="text-base font-bold text-white">Your Submitted Complaints & Tickets</h2>
              <p className="text-xs text-white/40 mt-0.5">
                Check developer responses, resolution notes, and live ticket statuses.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={ticketSearch}
                onChange={(e) => setTicketSearch(e.target.value)}
                placeholder="Search ticket..."
                className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={loadMyTickets}
                disabled={loadingTickets}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors"
                title="Refresh tickets"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingTickets ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Tickets List */}
          {loadingTickets ? (
            <div className="glass p-12 rounded-3xl text-center border-white/5">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-400 mb-3" />
              <p className="text-xs text-white/40">Loading your support tickets...</p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="glass p-12 rounded-3xl text-center border-white/5">
              <MessageSquare className="w-10 h-10 mx-auto text-white/20 mb-3" />
              <h3 className="text-base font-bold text-white">No Tickets Found</h3>
              <p className="text-xs text-white/40 mt-1 max-w-sm mx-auto">
                You haven't submitted any complaints or problem tickets yet.
              </p>
              <button
                onClick={() => setActiveTab('submit')}
                className="mt-4 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors inline-flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Submit Your First Issue
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTickets.map((t) => (
                <div 
                  key={t._id}
                  className="glass p-6 rounded-3xl border-white/5 hover:border-white/10 transition-all space-y-4 shadow-xl"
                >
                  {/* Top Bar: Category, Date, Status */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold">
                        {t.category}
                      </span>
                      <span className="text-[11px] text-white/40 font-mono">
                        {new Date(t.created_at).toLocaleDateString()} at {new Date(t.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div>
                      {t.status === 'Resolved' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                        </span>
                      ) : t.status === 'In Progress' ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-400 text-xs font-bold">
                          <Clock className="w-3.5 h-3.5 animate-spin" /> In Progress
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold">
                          <Clock className="w-3.5 h-3.5" /> Open (Awaiting Developer)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Issue Subject & User's Description */}
                  <div>
                    <h3 className="text-base font-bold text-white mb-1.5">{t.subject}</h3>
                    <p className="text-xs text-white/60 leading-relaxed bg-white/[0.02] p-3.5 rounded-xl border border-white/5">
                      {t.description}
                    </p>
                  </div>

                  {/* DEVELOPER / ADMIN REPLY SECTION */}
                  {t.admin_reply ? (
                    <div className="mt-3 p-4 rounded-2xl bg-gradient-to-br from-blue-950/40 via-purple-950/30 to-[#0a0a0f] border border-blue-500/30 relative">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 flex items-center justify-center text-[10px] font-bold">
                            👨‍💻
                          </div>
                          <span className="text-xs font-bold text-[#00f2fe]">
                            Developer Reply ({t.admin_name || 'Kamaljit - Super Admin'})
                          </span>
                        </div>
                        {t.admin_replied_at && (
                          <span className="text-[10px] text-white/40 font-mono">
                            {new Date(t.admin_replied_at).toLocaleDateString()} at {new Date(t.admin_replied_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-200 leading-relaxed pl-8 whitespace-pre-wrap font-sans">
                        {t.admin_reply}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/15 flex items-center gap-2.5 text-xs text-amber-300/80">
                      <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>
                        Ticket is pending developer review. Developer Kamaljit will inspect your build logs and reply here soon.
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
