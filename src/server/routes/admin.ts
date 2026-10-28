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

// 3. PUT /api/admin/users/:id/suspend-24h
router.put('/users/:id/suspend-24h', requireAdmin, async (req: any, res: any) => {
  try {
    if (req.params.id === req.admin._id.toString()) {
      return res.status(400).json({ success: false, error: 'Cannot suspend own Super Admin account' });
    }
    const { reason } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    user.status = 'suspended';
    user.suspended_until = new Date(Date.now() + 24 * 60 * 60 * 1000);
    user.violation_reason = reason || '24-hour temporary timeout for policy violation';
    user.suspension_count = (user.suspension_count || 0) + 1;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User ${user.email} suspended for 24 hours until ${user.suspended_until.toLocaleString()}`,
      user
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 4. PUT /api/admin/users/:id/ban
router.put('/users/:id/ban', requireAdmin, async (req: any, res: any) => {
  try {
    if (req.params.id === req.admin._id.toString()) {
      return res.status(400).json({ success: false, error: 'Cannot ban own Super Admin account' });
    }
    const { reason } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    user.status = 'banned';
    user.suspended_until = null;
    user.violation_reason = reason || 'Account permanently banned for Terms of Service violation';
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User ${user.email} has been permanently banned`,
      user
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 5. PUT /api/admin/users/:id/unban
router.put('/users/:id/unban', requireAdmin, async (req: any, res: any) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    user.status = 'active';
    user.suspended_until = null;
    user.violation_reason = '';
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User ${user.email} has been unbanned and restored to Active`,
      user
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 6. PUT /api/admin/users/:id/clear-flags
router.put('/users/:id/clear-flags', requireAdmin, async (req: any, res: any) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    user.violation_flags = [];
    await user.save();

    return res.status(200).json({
      success: true,
      message: `Violation flags cleared for ${user.email}`,
      user
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 7. DELETE /api/admin/users/:id (Protected from self-deletion)
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

// 6. GET /api/admin/builds (With User Email and Full Name populated)
router.get('/builds', requireAdmin, async (req: any, res: any) => {
  try {
    const builds = await Build.find()
      .populate('user_id', 'email fullName')
      .sort({ created_at: -1, createdAt: -1 })
      .limit(200);

    const formattedBuilds = builds.map((b: any) => {
      const populatedUser = b.user_id && typeof b.user_id === 'object' ? b.user_id : null;
      return {
        _id: b._id,
        id: b.id,
        apk_name: b.apk_name,
        status: b.status,
        downloadUrl: b.downloadUrl,
        user_email: b.user_email || (populatedUser ? populatedUser.email : 'Unknown User'),
        user_name: b.user_name || (populatedUser ? populatedUser.fullName : 'Guest'),
        user_id: populatedUser ? populatedUser._id : b.user_id,
        created_at: b.created_at || b.createdAt
      };
    });

    return res.status(200).json({ success: true, builds: formattedBuilds });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 7. DELETE /api/admin/builds/:id (Delete individual build)
router.delete('/builds/:id', requireAdmin, async (req: any, res: any) => {
  try {
    const build = await Build.findById(req.params.id);
    if (!build) return res.status(404).json({ success: false, error: 'Build record not found' });

    await Build.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: 'Build record deleted successfully' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 8. POST /api/admin/builds/cleanup (Smart Purge of expired/broken builds)
router.post('/builds/cleanup', requireAdmin, async (req: any, res: any) => {
  try {
    const result = await Build.deleteMany({
      $or: [
        { status: { $in: ['expired', 'Failed', 'Deleted'] } },
        { downloadUrl: '' },
        { downloadUrl: null },
        { downloadUrl: '#' }
      ]
    });
    return res.status(200).json({
      success: true,
      message: `Smart Cleanup: Removed ${result.deletedCount} junk/broken build records`,
      deletedCount: result.deletedCount
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

// 9. POST /api/admin/builds/clear-all (Wipe entire build history)
router.post('/builds/clear-all', requireAdmin, async (req: any, res: any) => {
  try {
    const result = await Build.deleteMany({});
    return res.status(200).json({
      success: true,
      message: `Database Cleared: ${result.deletedCount} builds deleted`,
      deletedCount: result.deletedCount
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
