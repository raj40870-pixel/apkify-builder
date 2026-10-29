import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, HelpCircle, Wrench, Download, CreditCard, UserCheck, 
  Sparkles, Send, Clock, CheckCircle2, AlertCircle, MessageSquare, RefreshCw 
} from 'lucide-react';
import api from '../lib/api';
import { Button } from './ui/button';

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: string;
}

const CATEGORIES = [
  { id: 'APK Build Issue / Stuck', label: 'APK Build Issue / Stuck', icon: Wrench },
  { id: 'Download Link Expired / Broken', label: 'Download Link Expired / Broken', icon: Download },
  { id: 'Credits & 14-Day Auto-Refill', label: 'Credits & 14-Day Auto-Refill', icon: CreditCard },
  { id: 'Account, Login & 2FA', label: 'Account, Login & 2FA', icon: UserCheck },
  { id: 'Feature Request & Ideas', label: 'Feature Request & Ideas', icon: Sparkles },
  { id: 'General Problem Solving', label: 'General Problem Solving', icon: HelpCircle }
];

export default function SupportModal({ isOpen, onClose, defaultCategory = 'APK Build Issue / Stuck' }: SupportModalProps) {
  const [activeTab, setActiveTab] = useState<'submit' | 'history'>('submit');
  const [category, setCategory] = useState(defaultCategory);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [myTickets, setMyTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  })();

  useEffect(() => {
    if (defaultCategory) setCategory(defaultCategory);
    if (currentUser?.email) setEmail(currentUser.email);
    if (isOpen) loadTickets();
  }, [isOpen, defaultCategory]);

  const loadTickets = async () => {
    setLoadingTickets(true);
    try {
      const emailQuery = currentUser?.email ? `?email=${encodeURIComponent(currentUser.email)}` : '';
      const res = await api.get(`/support/my-tickets${emailQuery}`);
      if (res.data?.success) {
        setMyTickets(res.data.tickets || []);
      }
    } catch (_) {}
    finally {
      setLoadingTickets(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const ticketEmail = currentUser?.email || email;
    if (!ticketEmail) {
      setErrorMsg('Please enter your email so we can reply to you');
      return;
    }
    if (!subject.trim() || !description.trim()) {
      setErrorMsg('Subject and description are required');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/support/tickets', {
        category,
        subject: subject.trim(),
        description: description.trim(),
        email: ticketEmail.trim(),
        name: currentUser?.fullName || 'User'
      });

      if (res.data?.success) {
        setSuccessMsg('Issue submitted! Developer Kamaljit will reply shortly.');
        setSubject('');
        setDescription('');
        loadTickets();
        setTimeout(() => {
          setSuccessMsg('');
          setActiveTab('history');
        }, 1800);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-[#0e1320] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Help & Problem Solving Center</h2>
              <p className="text-[11px] text-white/50">Submit your issue and receive direct developer replies</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-white/5 px-6 pt-3 bg-white/[0.01]">
          <button
            onClick={() => setActiveTab('submit')}
            className={`pb-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-colors ${
              activeTab === 'submit' ? 'border-blue-500 text-blue-400' : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            Submit Issue
          </button>
          <button
            onClick={() => {
              setActiveTab('history');
              loadTickets();
            }}
            className={`pb-3 px-4 font-bold text-xs sm:text-sm border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'history' ? 'border-blue-500 text-blue-400' : 'border-transparent text-white/50 hover:text-white'
            }`}
          >
            My Tickets & Replies
            {myTickets.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-mono">
                {myTickets.length}
              </span>
            )}
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeTab === 'submit' ? (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-white/70 mb-2">Category</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CATEGORIES.map(cat => (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setCategory(cat.id)}
                      className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                        category === cat.id
                          ? 'bg-blue-600/20 border-blue-500 text-white font-bold'
                          : 'bg-white/[0.02] border-white/5 text-white/60 hover:bg-white/5'
                      }`}
                    >
                      <cat.icon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="truncate">{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {!currentUser?.email && (
                <div>
                  <label className="block font-bold text-white/70 mb-1">Your Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Enter email to receive developer reply"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-white/70 mb-1">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  placeholder="Summary of the issue"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-white/70 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Explain what happened, error message, steps taken..."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-blue-500 leading-relaxed"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center gap-2"
                >
                  {submitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Submit Issue
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              {loadingTickets ? (
                <div className="py-8 text-center text-white/40 text-xs">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-400 mb-2" />
                  Loading your tickets...
                </div>
              ) : myTickets.length === 0 ? (
                <div className="py-8 text-center text-white/40 text-xs">
                  No tickets submitted yet.
                </div>
              ) : (
                myTickets.map(t => (
                  <div key={t._id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-blue-400">{t.category}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.status === 'Resolved' ? 'bg-emerald-500/20 text-emerald-400' :
                        t.status === 'In Progress' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-amber-500/20 text-amber-400'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                    <h4 className="font-bold text-white text-xs">{t.subject}</h4>
                    <p className="text-[11px] text-white/60">{t.description}</p>
                    
                    {t.admin_reply ? (
                      <div className="mt-2 p-3 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs">
                        <div className="text-[10px] font-bold text-[#00f2fe] mb-1">
                          👑 Developer Reply ({t.admin_name || 'Kamaljit'}):
                        </div>
                        <p className="text-white/90 text-[11px] leading-relaxed whitespace-pre-wrap">{t.admin_reply}</p>
                      </div>
                    ) : (
                      <div className="text-[10px] text-amber-400/80 italic mt-1">
                        Pending developer review...
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
