import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, KeyRound, RefreshCw, CheckCircle2 } from 'lucide-react';
import api from '../lib/api';

export default function SignupPage() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const navigate = useNavigate();

  // Cooldown timer for resending OTP
  useEffect(() => {
    let timer: any;
    if (step === 'otp' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      setCanResend(true);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters');
    }
    
    if (!agreedToTerms) {
      return setError('You must agree to the Terms & Conditions');
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/signup', formData);
      if (response.data.requiresOtp || response.data.success) {
        setStep('otp');
        setCountdown(60);
        setCanResend(false);
        setSuccessMsg(`We sent a 6-digit verification code to ${formData.email}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (otp.length !== 6) {
      return setError('Please enter a valid 6-digit code');
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/verify-signup-otp', {
        email: formData.email,
        otp: otp.trim()
      });

      if (response.data.success) {
        if (response.data.token) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('authToken', response.data.token);
        }
        if (response.data.user) {
          localStorage.setItem('user', JSON.stringify(response.data.user));
        }
        navigate('/builder', { state: { message: 'Welcome to APKify Builder! Your account is verified.' } });
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid or expired verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || resending) return;
    setError('');
    setSuccessMsg('');
    setResending(true);

    try {
      const response = await api.post('/auth/resend-otp', {
        email: formData.email,
        type: 'signup'
      });
      if (response.data.success) {
        setSuccessMsg('A new verification code has been sent!');
        setCountdown(60);
        setCanResend(false);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-12 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-[#151520] p-8 rounded-2xl border border-white/10 shadow-2xl">
        {step === 'form' ? (
          <>
            <div>
              <h2 className="text-center text-3xl font-extrabold text-white">Create an account</h2>
              <p className="mt-2 text-center text-sm text-gray-400">Join APKify Builder today</p>
            </div>
            
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form className="mt-8 space-y-6" onSubmit={handleSubmitForm}>
              <div className="space-y-4">
                <div>
                  <label className="sr-only">Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      required
                      className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-lg bg-[#0a0a0f] text-white focus:ring-2 focus:ring-[#00f2fe] focus:border-transparent transition-all outline-none"
                      placeholder="Full Name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="sr-only">Email address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      required
                      className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-lg bg-[#0a0a0f] text-white focus:ring-2 focus:ring-[#00f2fe] focus:border-transparent transition-all outline-none"
                      placeholder="Email address"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="sr-only">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      className="block w-full pl-10 pr-12 py-3 border border-white/10 rounded-lg bg-[#0a0a0f] text-white focus:ring-2 focus:ring-[#00f2fe] focus:border-transparent transition-all outline-none"
                      placeholder="Password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="sr-only">Confirm Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      className="block w-full pl-10 pr-12 py-3 border border-white/10 rounded-lg bg-[#0a0a0f] text-white focus:ring-2 focus:ring-[#00f2fe] focus:border-transparent transition-all outline-none"
                      placeholder="Confirm Password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  required
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="h-4 w-4 text-[#00f2fe] focus:ring-[#00f2fe] border-gray-600 rounded bg-[#0a0a0f]"
                />
                <label htmlFor="terms" className="ml-2 block text-sm text-gray-400">
                  I agree to the{' '}
                  <Link to="/terms" className="text-[#00f2fe] hover:underline">
                    Terms & Conditions
                  </Link>
                </label>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-[#00f2fe] to-[#4facfe] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00f2fe] disabled:opacity-50 transition-all font-semibold shadow-lg shadow-[#00f2fe]/20"
                >
                  {loading ? 'Sending Verification Code...' : 'Create Account'}
                  {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                </button>
              </div>

              <div className="text-center text-sm">
                <span className="text-gray-400">Already have an account? </span>
                <Link to="/login" className="font-medium text-[#00f2fe] hover:underline">
                  Sign in
                </Link>
              </div>
            </form>
          </>
        ) : (
          /* STEP 2: OTP VERIFICATION SCREEN */
          <>
            <div className="text-center">
              <div className="inline-flex p-3 rounded-full bg-[#00f2fe]/10 border border-[#00f2fe]/30 mb-4">
                <KeyRound className="h-8 w-8 text-[#00f2fe]" />
              </div>
              <h2 className="text-2xl font-extrabold text-white">Enter Verification Code</h2>
              <p className="mt-2 text-sm text-gray-400">
                We sent a 6-digit OTP code to:
              </p>
              <p className="font-semibold text-white mt-1 text-sm bg-white/5 py-1 px-3 rounded-md inline-block">
                {formData.email}
              </p>
            </div>

            {successMsg && (
              <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-3 rounded-lg text-sm text-center flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            <form className="mt-6 space-y-6" onSubmit={handleVerifyOtp}>
              <div>
                <label className="block text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2 text-center">
                  6-Digit OTP Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  autoFocus
                  placeholder="000000"
                  className="block w-full text-center tracking-[12px] text-2xl font-mono py-3 border border-white/20 rounded-xl bg-[#0a0a0f] text-white focus:ring-2 focus:ring-[#00f2fe] focus:border-transparent transition-all outline-none"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-[#00f2fe] to-[#4facfe] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00f2fe] disabled:opacity-50 transition-all font-semibold shadow-lg shadow-[#00f2fe]/20"
                >
                  {loading ? 'Verifying Code...' : 'Verify & Complete Signup'}
                </button>
              </div>

              <div className="flex items-center justify-between text-sm pt-2">
                <button
                  type="button"
                  onClick={() => setStep('form')}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  &larr; Change Details
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={!canResend || resending}
                  className="text-[#00f2fe] hover:underline disabled:opacity-50 disabled:no-underline flex items-center gap-1"
                >
                  {resending && <RefreshCw className="h-3 w-3 animate-spin" />}
                  {canResend ? 'Resend Code' : `Resend in ${countdown}s`}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
