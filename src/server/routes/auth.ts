import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import Build from '../models/Build.js';

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

// A. POST /api/auth/signup
router.post('/signup', async (req: any, res: any) => {
  try {
    const { name, password, confirmPassword } = req.body;
    const email = req.body.email?.toLowerCase().trim();

    if (password !== confirmPassword) {
      return res.status(400).json({ success: false, error: 'Passwords do not match' });
    }

    const allowedDomains = ['gmail.com', 'yahoo.com', 'ymail.com', 'outlook.com', 'hotmail.com'];
    const emailParts = email?.split('@');
    if (!emailParts || emailParts.length !== 2 || !allowedDomains.includes(emailParts[1])) {
      return res.status(400).json({ success: false, error: 'This email are block. Use Gmail, Yahoo, Outlook, or Hotmail only' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName: name,
      email,
      password: hashedPassword,
      credits_remaining: 3,
      history_limit: 10,
      plan_type: 'Free',
      watermark_enabled: true
    });
    await newUser.save();

    return res.status(201).json({ success: true, message: 'Account created successfully' });
  } catch (error: any) {
    console.error('[Auth Signup Error]', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// B. POST /api/auth/login
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

    const secret = process.env.JWT_SECRET || 'fallback_secret';
    const token = jwt.sign({ id: user._id, email: user.email }, secret, { expiresIn: '90d' });

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.fullName,
        email: user.email,
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

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req: any, res: any) => {
  try {
    const { name, email, newPassword, confirmPassword } = req.body;
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, error: 'Passwords do not match' });
    }
    
    const user = await User.findOne({ email: email?.toLowerCase().trim() });
    
    if (!user || user.fullName?.toLowerCase().trim() !== name?.toLowerCase().trim()) {
      return res.status(400).json({ success: false, error: 'Invalid Credentials.' });
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    user.password = hashedPassword;
    await user.save();
    
    return res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error: any) {
    console.error('[Auth Forgot Password Error]', error);
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

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.fullName,
        email: user.email,
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
    try { decoded = jwt.verify(token, secret); } catch (e) { decoded = jwt.decode(token); }
    if (!decoded) return res.status(401).json({ success: false, error: 'Invalid token' });

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    // Block upgrades in production unless explicitly enabled via ENABLE_PAYMENTS=true
    if (process.env.NODE_ENV === 'production' && process.env.ENABLE_PAYMENTS !== 'true') {
      return res.status(403).json({
        success: false,
        error: 'Online payments are currently locked and coming soon. Free tier with 3 APK builds is active.'
      });
    }

    const { plan } = req.body;
    
    user.plan_type = plan || 'Pro';
    user.watermark_enabled = false;
    
    if (user.plan_type === 'Basic') {
      user.credits_remaining = 50;
      user.history_limit = 25;
    } else if (user.plan_type === 'Pro') {
      user.credits_remaining = 200;
      user.history_limit = 100;
    } else if (user.plan_type === 'Agency') {
      user.credits_remaining = 1000;
      user.history_limit = 500;
    } else {
      return res.status(400).json({ success: false, error: 'Invalid plan selected' });
    }

    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);
    user.plan_expiry_date = expiry;
    user.last_credit_refill = new Date();

    await user.save();
    return res.status(200).json({ success: true, creditsRemaining: user.credits_remaining, plan: user.plan_type });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
