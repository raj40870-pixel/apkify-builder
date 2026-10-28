import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, ArrowRight, Eye, EyeOff, KeyRound, CheckCircle2, RefreshCw } from 'lucide-react';
import api from '../lib/api';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  const handleSendResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email });
      if (response.data.success) {
        setStep('otp');
        setCountdown(60);
        setCanResend(false);
        setSuccess(`A 6-digit password reset code has been sent to ${email}`);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (otp.length !== 6) {
      return setError('Please enter a valid 6-digit code');
    }

    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match');
    }

    if (newPassword.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/reset-password', {
        email,
        otp: otp.trim(),
        newPassword,
        confirmPassword
      });

      if (response.data.success) {
        setSuccess('Password updated successfully! Redirecting to login...');
        setTimeout(() => {
          navigate('/login', { state: { message: 'Password updated successfully! Please login.' } });
        }, 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || resending) return;
    setError('');
    setSuccess('');
    setResending(true);

    try {
      const response = await api.post('/auth/resend-otp', {
        email,
        type: 'forgot_password'
      });
      if (response.data.success) {
        setSuccess('A new reset code has been sent to your email!');
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
        {step === 'email' ? (
          <>
            <div>
              <h2 className="text-center text-3xl font-extrabold text-white">Reset Password</h2>
              <p className="mt-2 text-center text-sm text-gray-400">
                Enter your email and we will send you a verification code
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            <form className="mt-8 space-y-6" onSubmit={handleSendResetOtp}>
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
                    placeholder="Enter your registered email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-[#00f2fe] to-[#4facfe] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00f2fe] disabled:opacity-50 transition-all font-semibold shadow-lg shadow-[#00f2fe]/20"
                >
                  {loading ? 'Sending Code...' : 'Send Reset Code'}
                  {!loading && <ArrowRight className="ml-2 h-4 w-4" />}
                </button>
              </div>

              <div className="text-center text-sm">
                <Link to="/login" className="font-medium text-[#00f2fe] hover:underline">
                  &larr; Back to Sign In
                </Link>
              </div>
            </form>
          </>
        ) : (
          /* STEP 2: VERIFY OTP & ENTER NEW PASSWORD */
          <>
            <div className="text-center">
              <div className="inline-flex p-3 rounded-full bg-[#00f2fe]/10 border border-[#00f2fe]/30 mb-4">
                <KeyRound className="h-8 w-8 text-[#00f2fe]" />
              </div>
              <h2 className="text-2xl font-extrabold text-white">Enter Reset Code</h2>
              <p className="mt-2 text-sm text-gray-400">
                Enter the 6-digit code sent to:
              </p>
              <p className="font-semibold text-white mt-1 text-sm bg-white/5 py-1 px-3 rounded-md inline-block">
                {email}
              </p>
            </div>

            {success && (
              <div className="bg-green-500/10 border border-green-500/50 text-green-400 p-3 rounded-lg text-sm text-center flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                <span>{success}</span>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

            <form className="mt-6 space-y-5" onSubmit={handleResetPassword}>
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
                <label className="block text-xs text-gray-400 mb-1">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className="block w-full pl-10 pr-12 py-3 border border-white/10 rounded-lg bg-[#0a0a0f] text-white focus:ring-2 focus:ring-[#00f2fe] focus:border-transparent transition-all outline-none"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
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
                <label className="block text-xs text-gray-400 mb-1">Confirm New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    className="block w-full pl-10 pr-3 py-3 border border-white/10 rounded-lg bg-[#0a0a0f] text-white focus:ring-2 focus:ring-[#00f2fe] focus:border-transparent transition-all outline-none"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-[#00f2fe] to-[#4facfe] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00f2fe] disabled:opacity-50 transition-all font-semibold shadow-lg shadow-[#00f2fe]/20"
                >
                  {loading ? 'Updating Password...' : 'Reset Password'}
                </button>
              </div>

              <div className="flex items-center justify-between text-sm pt-2">
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  &larr; Change Email
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
