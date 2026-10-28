import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LogIn, Key, Mail, AlertCircle, Eye, EyeOff, ShieldCheck, KeyRound, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import api from '../lib/api';
import { useNavigate, useLocation, Link } from 'react-router-dom';

const MyCard = ({ children, className }: any) => (
  <div className={`glass border-white/5 rounded-3xl overflow-hidden ${className}`}>{children}</div>
);
const MyCardHeader = ({ children, className }: any) => (
  <div className={`p-6 bg-white/5 border-b border-white/5 ${className}`}>{children}</div>
);
const MyCardContent = ({ children, className }: any) => (
  <div className={`p-8 ${className}`}>{children}</div>
);

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [toast, setToast] = useState('');

  // 2FA Admin States
  const [is2FA, setIs2FA] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [twoFaMessage, setTwoFaMessage] = useState('');

  const from = (location.state as any)?.from?.pathname || '/builder';
  const redirectMessage = (location.state as any)?.message;

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailError('');
    setPasswordError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    
    try {
      const response = await api.post('/auth/login', { email, password });
      
      // Admin requires mandatory 2FA OTP
      if (response.data.requires2FA) {
        setIs2FA(true);
        setTwoFaMessage(response.data.message || 'Super Admin 2FA Security PIN sent to your email.');
        return;
      }

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('isLoggedIn', 'true');
        window.dispatchEvent(new Event('auth:updated'));
        window.dispatchEvent(new Event('storage'));
        
        if (response.data.user?.role === 'admin') {
          navigate('/admin');
        } else {
          navigate(from, { replace: true });
        }
      }
    } catch (err: any) {
      const msg = err.response?.data?.error || err.message || '';
      
      if (msg.toLowerCase().includes('invalid')) {
        setEmailError('Account not found or Invalid credentials');
      } else {
        setError(msg || 'Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (adminPin.length !== 6) {
      setError('Please enter the 6-digit security PIN');
      return;
    }
    setLoading(true);

    try {
      const response = await api.post('/auth/verify-admin-2fa', {
        email,
        otp: adminPin.trim()
      });

      if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('authToken', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('isLoggedIn', 'true');
        window.dispatchEvent(new Event('auth:updated'));
        window.dispatchEvent(new Event('storage'));
        navigate('/admin');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid or expired 2FA PIN');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleClick = () => {
    setToast('Google login will be enabled soon');
    setTimeout(() => setToast(''), 3000);
  };

  return (
    <div className="container px-4 py-12 md:py-20 flex items-center justify-center min-h-[80vh]">
      {toast && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-8 right-8 z-50 bg-[#00f2fe] text-black px-6 py-3 rounded-2xl font-bold shadow-2xl flex items-center gap-3"
        >
          {toast}
        </motion.div>
      )}

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <MyCard className="shadow-2xl border-white/10">
          <MyCardHeader className="text-center">
            {is2FA ? (
              <div className="inline-flex p-3 rounded-full bg-rose-500/10 border border-rose-500/30 mb-2">
                <ShieldCheck className="w-8 h-8 text-rose-400" />
              </div>
            ) : null}
            <h1 className="text-2xl font-black text-white">
              {is2FA ? 'Super Admin 2FA Security' : 'Welcome Back'}
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              {is2FA 
                ? 'Enter the 6-digit single-use PIN sent to your email' 
                : 'Sign in to manage your apps and APK builds'}
            </p>
          </MyCardHeader>
          <MyCardContent>
            {redirectMessage && !is2FA && (
              <div className="mb-6 p-4 rounded-2xl bg-[#00f2fe]/10 border border-[#00f2fe]/20 text-[#00f2fe] text-xs font-semibold text-center">
                {redirectMessage}
              </div>
            )}

            {twoFaMessage && is2FA && (
              <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-semibold text-center">
                {twoFaMessage}
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {is2FA ? (
              /* ADMIN 2FA FORM */
              <form onSubmit={handleVerify2FA} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-xs uppercase font-bold text-gray-400 tracking-wider text-center block">
                    6-Digit Security PIN
                  </Label>
                  <Input 
                    type="text"
                    maxLength={6}
                    autoFocus
                    placeholder="000000"
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value.replace(/[^0-9]/g, ''))}
                    className="text-center tracking-[12px] font-mono text-2xl h-14 bg-white/5 border-white/10 rounded-2xl text-white outline-none focus:border-rose-500/50"
                    required
                  />
                </div>

                <Button 
                  type="submit" 
                  disabled={loading || adminPin.length !== 6}
                  className="w-full h-14 rounded-2xl font-black bg-gradient-to-r from-rose-500 to-purple-600 hover:opacity-90 text-white shadow-lg shadow-rose-500/20 text-base"
                >
                  {loading ? 'Verifying PIN...' : 'Authorize Admin Access'}
                </Button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => { setIs2FA(false); setAdminPin(''); setError(''); }}
                    className="text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    &larr; Cancel and return to normal login
                  </button>
                </div>
              </form>
            ) : (
              /* REGULAR LOGIN FORM */
              <>
                <form onSubmit={handleEmailLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase font-bold text-gray-400 tracking-wider">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input 
                        type="email" 
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setEmailError(''); }}
                        className={`pl-12 h-12 bg-white/5 border-white/10 rounded-2xl text-white outline-none focus:border-[#00f2fe]/50 ${emailError ? 'border-red-500/50' : ''}`}
                        required
                      />
                    </div>
                    {emailError && <p className="text-[11px] text-red-400 mt-1 font-medium">{emailError}</p>}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-xs uppercase font-bold text-gray-400 tracking-wider">Password</Label>
                      <Link to="/forgot-password" className="text-xs text-[#00f2fe] hover:underline font-medium">Forgot password?</Link>
                    </div>
                    <div className="relative">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input 
                        type={showPassword ? "text" : "password"} 
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setPasswordError(''); }}
                        className={`pl-12 pr-12 h-12 bg-white/5 border-white/10 rounded-2xl text-white outline-none focus:border-[#00f2fe]/50 ${passwordError ? 'border-red-500/50' : ''}`}
                        required
                      />
                      <button 
                        type="button" 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {passwordError && <p className="text-[11px] text-red-400 mt-1 font-medium">{passwordError}</p>}
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading}
                    className="w-full h-12 rounded-2xl font-black bg-gradient-to-r from-[#00f2fe] to-[#4facfe] hover:opacity-90 text-black shadow-lg shadow-[#00f2fe]/20 text-sm mt-2"
                  >
                    {loading ? 'Authenticating...' : 'Sign In'}
                    {!loading && <ArrowRight className="ml-2 w-4 h-4" />}
                  </Button>
                </form>

                <div className="mt-8 text-center text-xs text-gray-400 font-medium">
                  Don't have an account?{' '}
                  <Link to="/signup" className="text-[#00f2fe] hover:underline font-bold">
                    Create free account
                  </Link>
                </div>
              </>
            )}
          </MyCardContent>
        </MyCard>
      </motion.div>
    </div>
  );
}
