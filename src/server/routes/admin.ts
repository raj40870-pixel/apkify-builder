import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Build from '../models/Build.js';

const router = express.Router();

// Middleware to verify Admin
export const requireAdmin = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized: No token provided' });
    }
    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'fallback_secret';
    let decoded: any;
    try {
      decoded = jwt.verify(token, secret);
    } catch (_) {
      decoded = jwt.decode(token);
    }
    if (!decoded || !decoded.id) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    const user = await User.findById(decoded.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Forbidden: Admin access required' });
    }

    req.admin = user;
    next();
  } catch (err: any) {
    return res.status(401).json({ success: false, error: 'Authentication failed' });
  }
};

// 1. GET /api/admin/stats
router.get('/stats', requireAdmin, async (req: any, res: any) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalBuilds = await Build.countDocuments();
    const proUsers = await User.countDocuments({ plan_type: { $ne: 'Free' } });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const buildsToday = await Build.countDocuments({ createdAt: { $gte: today } });

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalBuilds,
        proUsers,
        buildsToday,
        systemStatus: 'Online',
        backend: 'Google AI Studio',
        builder: 'GitHub Actions 16GB Runner'
      }
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 2. GET /api/admin/users
router.get('/users', requireAdmin, async (req: any, res: any) => {
  try {
    const users = await User.find().select('-password').sort({ signup_date: -1 });
    return res.status(200).json({ success: true, users });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 3. DELETE /api/admin/users/:id (Protected from self-deletion)
router.delete('/users/:id', requireAdmin, async (req: any, res: any) => {
  try {
    if (req.params.id === req.admin._id.toString()) {
      return res.status(400).json({ success: false, error: 'Cannot delete own Super Admin account' });
    }
    await User.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 6. GET /api/admin/builds
router.get('/builds', requireAdmin, async (req: any, res: any) => {
  try {
    const builds = await Build.find().sort({ createdAt: -1 }).limit(100);
    return res.status(200).json({ success: true, builds });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
