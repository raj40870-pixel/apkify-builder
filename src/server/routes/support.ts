import express from 'express';
import jwt from 'jsonwebtoken';
import Ticket from '../models/Ticket.js';
import User from '../models/User.js';

const router = express.Router();

// Helper to extract user from token if available
const extractUser = async (req: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'fallback_secret';
    let decoded: any;
    try {
      decoded = jwt.verify(token, secret);
    } catch (_) {
      decoded = jwt.decode(token);
    }
    if (!decoded || !decoded.id) return null;
    return await User.findById(decoded.id);
  } catch (_) {
    return null;
  }
};

const CATEGORY_MAP: Record<string, string> = {
  'build_issue': 'APK Build Issue / Stuck',
  'download_expired': 'Download Link Expired / Broken',
  'billing_credits': 'Credits & 14-Day Auto-Refill',
  'account_auth': 'Account, Login & 2FA',
  'feature_request': 'Feature Request & Ideas',
  'other_problem': 'General Problem Solving'
};

// 1. GET /api/support/categories - List available issue categories
router.get('/categories', (req, res) => {
  res.json({
    success: true,
    categories: [
      { id: 'APK Build Issue / Stuck', label: 'APK Build Issue / Stuck', icon: 'Wrench', description: 'Gradle compile error, build failed or infinite loading' },
      { id: 'Download Link Expired / Broken', label: 'Download Link Expired / Broken', icon: 'Download', description: 'Unable to download APK, 404 error or corrupted package' },
      { id: 'Credits & 14-Day Auto-Refill', label: 'Credits & 14-Day Auto-Refill', icon: 'CreditCard', description: 'Credit balance issues, plan refill or payment inquiries' },
      { id: 'Account, Login & 2FA', label: 'Account, Login & 2FA', icon: 'UserCheck', description: 'Password reset, email OTP, 2FA or suspension appeals' },
      { id: 'Feature Request & Ideas', label: 'Feature Request & Ideas', icon: 'Sparkles', description: 'Suggest new features, SDK upgrades or UI improvements' },
      { id: 'General Problem Solving', label: 'General Problem Solving', icon: 'HelpCircle', description: 'Any other issue, bug report or technical question' }
    ]
  });
});

// 2. POST /api/support/tickets - Submit a new issue / complaint
router.post('/tickets', async (req: any, res: any) => {
  try {
    const user = await extractUser(req);
    const { category, subject, description, email, name } = req.body;

    if (!subject || !subject.trim()) {
      return res.status(400).json({ success: false, error: 'Subject is required' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, error: 'Description is required' });
    }

    const ticketEmail = user ? user.email : email;
    if (!ticketEmail || !ticketEmail.trim()) {
      return res.status(400).json({ success: false, error: 'Email is required to submit a ticket' });
    }

    const ticketName = user ? (user.fullName || user.displayName || 'User') : (name || 'Guest User');
    const normalizedCategory = CATEGORY_MAP[category] || category || 'General Problem Solving';

    const newTicket = new Ticket({
      user_id: user ? user._id : undefined,
      user_email: ticketEmail.toLowerCase().trim(),
      user_name: ticketName,
      category: normalizedCategory,
      subject: subject.trim(),
      description: description.trim(),
      status: 'Open'
    });

    await newTicket.save();

    return res.status(201).json({
      success: true,
      message: 'Support ticket submitted successfully! The developer team will review it and reply soon.',
      ticket: newTicket
    });
  } catch (err: any) {
    console.error('[Support Ticket Error]:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to submit ticket' });
  }
});

// 3. GET /api/support/my-tickets - Fetch issues submitted by current user
router.get('/my-tickets', async (req: any, res: any) => {
  try {
    const user = await extractUser(req);
    const queryEmail = req.query.email ? String(req.query.email).toLowerCase().trim() : null;

    let filter: any = {};
    if (user) {
      const emails = [user.email.toLowerCase().trim()];
      if (queryEmail && !emails.includes(queryEmail)) emails.push(queryEmail);
      filter = {
        $or: [
          { user_id: user._id },
          { user_email: { $in: emails } }
        ]
      };
    } else if (queryEmail) {
      filter = { user_email: queryEmail };
    } else {
      return res.status(200).json({ success: true, tickets: [] });
    }

    const tickets = await Ticket.find(filter).sort({ created_at: -1 });

    return res.status(200).json({
      success: true,
      tickets
    });
  } catch (err: any) {
    console.error('[Get My Tickets Error]:', err);
    return res.status(500).json({ success: false, error: err.message || 'Failed to fetch tickets' });
  }
});

// 4. GET /api/support/tickets/:id - Get single ticket by ID
router.get('/tickets/:id', async (req: any, res: any) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }
    return res.status(200).json({ success: true, ticket });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
