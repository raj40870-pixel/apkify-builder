import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import OtpRequest from '../models/OtpRequest.js';
import Build from '../models/Build.js';
import { sendOtpEmail } from '../utils/mailer.js';

const router = express.Router();

export const checkExpiry = async (user: any) => {
  let isModified = false;
  const now = new Date();

  // Premium expiry check
  if (user.plan_expiry_date && now > new Date(user.plan_expiry_date)) {
    user.plan_type = 'Free';
    user.credits_remaining = 3; // Give 3 credits back when reverting to Free
    user.history_limit = 10;
    user.watermark_enabled = true;
    user.plan_expiry_date = undefined;
    user.last_credit_refill = now;
    isModified = true;
  }

  // Free plan 14-day renewal check
  if (user.plan_type === 'Free' || user.plan_type === 'free' || !user.plan_type) {
    if (!user.last_credit_refill) {
      user.last_credit_refill = now;
      isModified = true;
    } else {
      const lastRefill = new Date(user.last_credit_refill);
      const nextRefillDate = new Date(lastRefill);
      nextRefillDate.setDate(nextRefillDate.getDate() + 14);
      
      if (now >= nextRefillDate) {
        user.credits_remaining = 3;
        user.last_credit_refill = now;
        isModified = true;
      }
    }
    if (!user.watermark_enabled) {
      user.watermark_enabled = true;
      isModified = true;
    }
  }

  if (!user.history_limit) {
    user.history_limit = 10;
    isModified = true;
  }

  if (isModified) await user.save();
  return user;
};

// ==========================================
// 1. SIGNUP & OTP VERIFICATION
// ==========================================

// A. POST /api/auth/signup - Validate credentials & send 6-digit OTP
router.post('/signup', async (req: any, res: any) => {
  try {
    const { name, password, confirmPassword } = req.body;
    const email = req.body.email?.toLowerCase().trim();

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, error: 'Passwords do not match' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    const allowedDomains = ['gmail.com', 'yahoo.com', 'ymail.com', 'outlook.com', 'hotmail.com'];
    const emailParts = email.split('@');
    if (!emailParts || emailParts.length !== 2 || !allowedDomains.includes(emailParts[1])) {
      return res.status(400).json({ success: false, error: 'Use Gmail, Yahoo, Outlook, or Hotmail only' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email already registered. Please login.' });
    }

    // Generate secure 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Save temporary signup request in OtpRequest collection (expires in 10 minutes)
    await OtpRequest.findOneAndUpdate(
      { email, type: 'signup' },
      {
        email,
        otp,
        type: 'signup',
        attempts: 0,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        tempData: {
          fullName: name,
          password: hashedPassword
        }
      },
      { upsert: true, new: true }
    );

    // Send email via Nodemailer
    await sendOtpEmail(email, otp, 'signup');

    return res.status(200).json({
      success: true,
      requiresOtp: true,
      message: `A 6-digit verification code has been sent to ${email}`,
      email
    });
  } catch (error: any) {
    console.error('[Auth Signup Error]', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

// B. POST /api/auth/verify-signup-otp - Verify OTP and create User
router.post('/verify-signup-otp', async (req: any, res: any) => {
  try {
    const email = req.body.email?.toLowerCase().trim();
    const otp = req.body.otp?.toString().trim();

    if (!email || !otp) {
      return res.status(400).json({ success: false, error: 'Email and OTP are required' });
    }

    const otpRecord = await OtpRequest.findOne({ email, type: 'signup' });
    if (!otpRecord) {
      return res.status(400).json({ success: false, error: 'No active OTP verification found. Please sign up again.' });
    }

    if (new Date() > new Date(otpRecord.expiresAt)) {
      await OtpRequest.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ success: false, error: 'OTP has expired. Please request a new code.' });
    }

    if (otpRecord.otp !== otp) {
      otpRecord.attempts = (otpRecord.attempts || 0) + 1;
      if (otpRecord.attempts >= 5) {
        await OtpRequest.deleteOne({ _id: otpRecord._id });
        return res.status(400).json({ success: false, error: 'Too many incorrect attempts. Please sign up again.' });
      }
      await otpRecord.save();
      return res.status(400).json({ success: false, error: `Invalid OTP code. (${5 - otpRecord.attempts} attempts remaining)` });
    }

    // OTP matched! Create actual User
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      await OtpRequest.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ success: false, error: 'User already exists. Please login.' });
    }

    const newUser = new User({
      fullName: otpRecord.tempData?.fullName || 'APKify User',
      email: otpRecord.email,
      password: otpRecord.tempData?.password,
      credits_remaining: 3,
      history_limit: 10,
      plan_type: 'Free',
      watermark_enabled: true
    });
    await newUser.save();

    // Clean up OTP request
    await OtpRequest.deleteOne({ _id: otpRecord._id });

    // Auto-login with JWT
    const secret = process.env.JWT_SECRET || 'fallback_secret';
    const token = jwt.sign({ id: newUser._id, email: newUser.email }, secret, { expiresIn: '90d' });

    return res.status(201).json({
      success: true,
      message: 'Account verified and created successfully!',
      token,
      user: {
        id: newUser._id,
        name: newUser.fullName,
        email: newUser.email,
        credits_remaining: newUser.credits_remaining,
        history_limit: newUser.history_limit,
        plan: newUser.plan_type,
        watermark_enabled: newUser.watermark_enabled
      }
    });
  } catch (error: any) {
    console.error('[Verify Signup OTP Error]', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

// C. POST /api/auth/resend-otp - Resend 6-digit OTP
router.post('/resend-otp', async (req: any, res: any) => {
  try {
    const email = req.body.email?.toLowerCase().trim();
    const type = req.body.type === 'forgot_password' ? 'forgot_password' : 'signup';

    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const otpRecord = await OtpRequest.findOne({ email, type });
    if (!otpRecord) {
      return res.status(400).json({ success: false, error: 'No active session found. Please start over.' });
    }

    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    otpRecord.otp = newOtp;
    otpRecord.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    otpRecord.attempts = 0;
    await otpRecord.save();

    await sendOtpEmail(email, newOtp, type);

    return res.status(200).json({
      success: true,
      message: `A new 6-digit code has been sent to ${email}`
    });
  } catch (error: any) {
    console.error('[Resend OTP Error]', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

// ==========================================
// 2. FORGOT PASSWORD & RESET WITH OTP
// ==========================================

// A. POST /api/auth/forgot-password - Send Reset OTP
router.post('/forgot-password', async (req: any, res: any) => {
  try {
    const email = req.body.email?.toLowerCase().trim();
    if (!email) {
      return res.status(400).json({ success: false, error: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, error: 'No account registered with this email' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    await OtpRequest.findOneAndUpdate(
      { email, type: 'forgot_password' },
      {
        email,
        otp,
        type: 'forgot_password',
        attempts: 0,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000)
      },
      { upsert: true, new: true }
    );

    await sendOtpEmail(email, otp, 'forgot_password');

    return res.status(200).json({
      success: true,
      requiresOtp: true,
      message: `Password reset verification code sent to ${email}`,
      email
    });
  } catch (error: any) {
    console.error('[Forgot Password Error]', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

// B. POST /api/auth/reset-password - Verify Reset OTP & update password
router.post('/reset-password', async (req: any, res: any) => {
  try {
    const email = req.body.email?.toLowerCase().trim();
    const otp = req.body.otp?.toString().trim();
    const { newPassword, confirmPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, error: 'Passwords do not match' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    const otpRecord = await OtpRequest.findOne({ email, type: 'forgot_password' });
    if (!otpRecord) {
      return res.status(400).json({ success: false, error: 'Reset session expired. Please request a new code.' });
    }

    if (new Date() > new Date(otpRecord.expiresAt)) {
      await OtpRequest.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ success: false, error: 'Reset code expired. Please request a new code.' });
    }

    if (otpRecord.otp !== otp) {
      otpRecord.attempts = (otpRecord.attempts || 0) + 1;
      if (otpRecord.attempts >= 5) {
        await OtpRequest.deleteOne({ _id: otpRecord._id });
        return res.status(400).json({ success: false, error: 'Too many incorrect attempts. Please request a new code.' });
      }
      await otpRecord.save();
      return res.status(400).json({ success: false, error: `Invalid code. (${5 - otpRecord.attempts} attempts remaining)` });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    await OtpRequest.deleteOne({ _id: otpRecord._id });

    return res.status(200).json({
      success: true,
      message: 'Password successfully reset! Please login with your new password.'
    });
  } catch (error: any) {
    console.error('[Reset Password Error]', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal server error' });
  }
});

// ==========================================
// 3. LOGIN & PROFILE
// ==========================================

// POST /api/auth/login
router.post('/login', async (req: any, res: any) => {
  try {
    const { password } = req.body;
    const email = req.body.email?.toLowerCase().trim();

    let user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, error: 'Invalid Email or Password' });
    }

    const isMatch = await bcrypt.compare(password, user.password!);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Invalid Email or Password' });
    }

    user = await checkExpiry(user);

    // Moderation Checks (Ban / 24h Suspension)
    if (user.role !== 'admin') {
      if (user.status === 'banned') {
        return res.status(403).json({
          success: false,
          error: `Account Banned: This account has been permanently suspended due to violation of platform terms. Reason: ${user.violation_reason || 'Terms of Service violation'}.`
        });
      }

      if (user.status === 'suspended' && user.suspended_until) {
        if (new Date() < new Date(user.suspended_until)) {
          const remainingHours = Math.ceil((new Date(user.suspended_until).getTime() - Date.now()) / (1000 * 60 * 60));
          return res.status(403).json({
            success: false,
            error: `Account Temporarily Suspended: Your account is suspended for 24 hours (approx ${remainingHours}h remaining) until ${new Date(user.suspended_until).toLocaleString()}. Reason: ${user.violation_reason || 'Administrative timeout'}.`
          });
        } else {
          // 24 hours elapsed! Auto-lift suspension!
          user.status = 'active';
          user.suspended_until = null;
          user.violation_reason = '';
          await user.save();
        }
      }
    }

    // Mandatory 2FA OTP for Super Admin
    if (user.role === 'admin') {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      await OtpRequest.findOneAndUpdate(
        { email: user.email, type: 'admin_login' },
        {
          email: user.email,
          otp,
          type: 'admin_login',
          attempts: 0,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000)
        },
        { upsert: true, new: true }
      );

      await sendOtpEmail(user.email, otp, 'admin_login');

      return res.status(200).json({
        success: true,
        requires2FA: true,
        email: user.email,
        message: 'Admin 2FA Security PIN sent to your email.'
      });
    }

    const secret = process.env.JWT_SECRET || 'fallback_secret';
    const token = jwt.sign({ id: user._id, email: user.email, role: user.role || 'user' }, secret, { expiresIn: '90d' });

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.fullName,
        email: user.email,
        role: user.role || 'user',
        credits_remaining: user.credits_remaining,
        history_limit: user.history_limit,
        plan: user.plan_type,
        watermark_enabled: user.watermark_enabled,
        plan_expiry_date: user.plan_expiry_date,
        last_credit_refill: user.last_credit_refill
      }
    });
  } catch (error: any) {
    console.error('[Auth Login Error]', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// POST /api/auth/verify-admin-2fa
router.post('/verify-admin-2fa', async (req: any, res: any) => {
  try {
    const email = req.body.email?.toLowerCase().trim();
    const otp = req.body.otp?.toString().trim();

    if (!email || !otp) {
      return res.status(400).json({ success: false, error: 'Email and 2FA PIN are required' });
    }

    const otpRecord = await OtpRequest.findOne({ email, type: 'admin_login' });
    if (!otpRecord) {
      return res.status(400).json({ success: false, error: 'No active Admin 2FA session. Please log in again.' });
    }

    if (new Date() > new Date(otpRecord.expiresAt)) {
      await OtpRequest.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ success: false, error: '2FA PIN has expired. Please log in again.' });
    }

    if (otpRecord.otp !== otp) {
      otpRecord.attempts = (otpRecord.attempts || 0) + 1;
      if (otpRecord.attempts >= 5) {
        await OtpRequest.deleteOne({ _id: otpRecord._id });
        return res.status(400).json({ success: false, error: 'Too many incorrect attempts. Session terminated.' });
      }
      await otpRecord.save();
      return res.status(400).json({ success: false, error: `Invalid 2FA PIN. (${5 - otpRecord.attempts} attempts remaining)` });
    }

    const user = await User.findOne({ email });
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Access denied: Admin role required' });
    }

    await OtpRequest.deleteOne({ _id: otpRecord._id });

    const secret = process.env.JWT_SECRET || 'fallback_secret';
    const token = jwt.sign({ id: user._id, email: user.email, role: 'admin' }, secret, { expiresIn: '30d' });

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.fullName,
        email: user.email,
        role: 'admin',
        credits_remaining: user.credits_remaining,
        history_limit: user.history_limit,
        plan: user.plan_type,
        watermark_enabled: user.watermark_enabled
      }
    });
  } catch (error: any) {
    console.error('[Verify Admin 2FA Error]', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// GET /api/auth/me - Validate token and get live credits
router.get('/me', async (req: any, res: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    
    const secret = process.env.JWT_SECRET || 'fallback_secret';
    let decoded: any;
    try {
      decoded = jwt.verify(token, secret);
    } catch(e) {
      decoded = jwt.decode(token);
      if (!decoded) return res.status(401).json({ success: false, error: 'Invalid token format' });
    }
    let user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    
    user = await checkExpiry(user);

    if (user.role !== 'admin') {
      if (user.status === 'banned') {
        return res.status(403).json({ success: false, error: 'Account Banned' });
      }
      if (user.status === 'suspended' && user.suspended_until) {
        if (new Date() < new Date(user.suspended_until)) {
          return res.status(403).json({ success: false, error: 'Account Temporarily Suspended' });
        } else {
          user.status = 'active';
          user.suspended_until = null;
          user.violation_reason = '';
          await user.save();
        }
      }
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.fullName,
        email: user.email,
        role: user.role || 'user',
        status: user.status || 'active',
        suspended_until: user.suspended_until,
        violation_reason: user.violation_reason,
        violation_flags: user.violation_flags || [],
        credits_remaining: user.credits_remaining,
        history_limit: user.history_limit,
        plan: user.plan_type,
        watermark_enabled: user.watermark_enabled,
        plan_expiry_date: user.plan_expiry_date,
        last_credit_refill: user.last_credit_refill
      }
    });
  } catch (error: any) {
    return res.status(401).json({ success: false, error: 'Invalid or expired token' });
  }
});

// POST /api/auth/upgrade - Upgrade to premium
router.post('/upgrade', async (req: any, res: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'fallback_secret';
    let decoded: any;
    try {
      decoded = jwt.verify(token, secret);
    } catch(e) {
      decoded = jwt.decode(token);
    }
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    user.plan_type = 'Pro';
    user.credits_remaining = 50;
    user.history_limit = 50;
    user.watermark_enabled = false;
    user.plan_expiry_date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    user.last_credit_refill = new Date();
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Plan upgraded successfully',
      user: {
        id: user._id,
        name: user.fullName,
        email: user.email,
        credits_remaining: user.credits_remaining,
        history_limit: user.history_limit,
        plan: user.plan_type,
        watermark_enabled: user.watermark_enabled,
        plan_expiry_date: user.plan_expiry_date
      }
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Upgrade failed' });
  }
});

// GET /api/auth/builds - Fetch User APK Builds History
router.get('/builds', async (req: any, res: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'fallback_secret';
    let decoded: any;
    try {
      decoded = jwt.verify(token, secret);
    } catch(e) {
      decoded = jwt.decode(token);
      if (!decoded) return res.status(401).json({ success: false, error: 'Invalid token format' });
    }
    const builds = await Build.find({ user_id: decoded.id }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, builds });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Failed to fetch builds' });
  }
});

export default router;
