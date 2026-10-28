import mongoose from 'mongoose';

const otpRequestSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  otp: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['signup', 'forgot_password'],
    default: 'signup'
  },
  attempts: {
    type: Number,
    default: 0
  },
  expiresAt: {
    type: Date,
    required: true
  },
  tempData: {
    password: { type: String },
    fullName: { type: String }
  }
}, { timestamps: true });

// TTL index to automatically remove expired OTP documents
otpRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OtpRequest = mongoose.models.OtpRequest || mongoose.model('OtpRequest', otpRequestSchema);
export default OtpRequest;
