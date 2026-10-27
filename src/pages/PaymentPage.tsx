import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Lock, ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useNavigate, useLocation } from 'react-router-dom';
import { upgradeToPremium } from '../lib/auth';

export default function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const plan = (location.state as any)?.plan || 'Pro';
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');
  const [amount, setAmount] = useState('');
  
  const expectedAmount = plan === 'Pro' ? 1249 : plan === 'Agency' || plan === 'Unlimited' ? 4099 : plan === 'Starter' || plan === 'Basic' ? 419 : 0;
  const isProd = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isProd) {
      setError('Online payments are currently locked and coming soon on the live server.');
      return;
    }
    
    if (parseInt(amount) !== expectedAmount) {
      setError('Invalid Amount');
      return;
    }
    
    setLoading(true);
    setToast('Processing upgrade...');
    try {
      const upgraded = await upgradeToPremium(plan);
      setToast(`Premium Plan Active — ${upgraded.creditsRemaining} credits available`);
      setTimeout(() => {
        setLoading(false);
        setToast('');
        navigate('/accounts/dashboard');
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Unable to activate the demo upgrade');
      setLoading(false);
      setToast('');
    }
  };

  return (
    <div className="container px-4 py-12 md:py-24 max-w-4xl mx-auto">
      {toast && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-blue-600 text-white rounded-full shadow-lg font-medium"
        >
          {toast}
        </motion.div>
      )}

      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-white/40 hover:text-white mb-8 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Pricing
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Payment Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass border-white/5 rounded-[32px] overflow-hidden"
        >
          <div className="p-8 bg-white/5 border-b border-white/5">
            <h1 className="text-2xl font-display font-bold flex items-center gap-3">
              <KeyRound className="w-6 h-6 text-blue-500" />
              Upgrade to Premium
            </h1>
            <p className="text-white/40 text-sm mt-1">Activate your Premium Plan instantly</p>
          </div>

          <form onSubmit={handlePay} className="p-8 space-y-6">
            <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl text-xs text-blue-500/80">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>
                {isProd 
                  ? 'Paid plans are currently locked. Enjoy 3 free APK builds every month!'
                  : 'Click below to activate Premium instantly and unlock all features.'}
              </span>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}

            <div className="space-y-2">
              <Label htmlFor="amount" className="text-white">Enter Payment Amount (₹{expectedAmount})</Label>
              <Input 
                id="amount"
                type="number"
                placeholder="Enter Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                disabled={isProd}
                className="bg-white/5 border-white/10 text-white h-12 disabled:opacity-50"
              />
            </div>
            
            {isProd ? (
              <div className="w-full p-4 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-xl font-medium text-sm flex items-center justify-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Online Payments Locked • Coming Soon</span>
              </div>
            ) : (
              <Button 
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:scale-[1.01] transition-all text-white rounded-xl font-bold text-lg shadow-lg shadow-blue-600/20 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Upgrade Now'}
              </Button>
            )}

            <div className="flex items-center justify-center gap-6 opacity-30 pt-4">
              <ShieldCheck className="w-12 h-12" />
              <div className="h-8 w-[1px] bg-white/20" />
              <CheckCircle2 className="w-12 h-12" />
            </div>
          </form>
        </motion.div>

        {/* Order Summary */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <div className="glass border-white/5 rounded-[32px] p-8">
            <h2 className="text-xl font-bold mb-6 font-display">Order Summary</h2>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-bold text-lg">{plan} Plan</p>
                  <p className="text-white/40 text-sm">Monthly subscription</p>
                </div>
                <p className="font-bold text-xl">
                  {plan === 'Pro' ? '₹1249' : plan === 'Agency' || plan === 'Unlimited' ? '₹4099' : plan === 'Starter' || plan === 'Basic' ? '₹419' : '₹0'}
                </p>
              </div>
              <div className="border-t border-white/5 pt-4 flex justify-between items-center text-white/60">
                <span>Tax (GST 18%)</span>
                <span>Included</span>
              </div>
            </div>

            <div className="bg-white/5 rounded-2xl p-6 space-y-3">
              <div className="flex items-center gap-3 text-sm text-white/80">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>
                  {plan === 'Pro' ? '200 APK Builds' : 
                   plan === 'Agency' || plan === 'Unlimited' ? '1000 APK Builds' : 
                   plan === 'Starter' || plan === 'Basic' ? '50 APK Builds' : '3 APK Builds'}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white/80">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Priority Cloud Queue</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-white/80">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>Custom App Branding</span>
              </div>
            </div>
          </div>

          <div className="px-4 text-center">
            <p className="text-white/20 text-xs leading-relaxed">
              By completing your purchase, you agree to our Terms of Service. You can cancel your subscription at any time from your account settings.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
