import mongoose, { Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password?: string;
  fullName: string;
  role: 'user' | 'admin';
  credits_remaining: number;
  history_limit: number;
  plan_type: string;
  signup_date: Date;
  plan_expiry_date?: Date;
  last_credit_refill: Date;
  watermark_enabled: boolean;
  status: 'active' | 'suspended' | 'banned';
  suspended_until?: Date | null;
  violation_reason?: string;
  violation_flags: string[];
  suspension_count: number;
}

const userSchema = new mongoose.Schema<IUser>({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  fullName: {
    type: String,
    default: 'Appify User'
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  credits_remaining: {
    type: Number,
    default: 3
  },
  history_limit: {
    type: Number,
    default: 10
  },
  plan_type: {
    type: String,
    default: 'Free'
  },
  signup_date: {
    type: Date,
    default: Date.now
  },
  plan_expiry_date: {
    type: Date
  },
  last_credit_refill: {
    type: Date,
    default: Date.now
  },
  watermark_enabled: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'banned'],
    default: 'active'
  },
  suspended_until: {
    type: Date,
    default: null
  },
  violation_reason: {
    type: String,
    default: ''
  },
  violation_flags: {
    type: [String],
    default: []
  },
  suspension_count: {
    type: Number,
    default: 0
  }
});

export const User = mongoose.models.User || mongoose.model<IUser>('User', userSchema);
export default User;
