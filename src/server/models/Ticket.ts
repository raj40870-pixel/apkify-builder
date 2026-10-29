import mongoose, { Schema, Document } from 'mongoose';

export interface ITicket extends Document {
  user_id?: mongoose.Types.ObjectId;
  user_email: string;
  user_name?: string;
  category: string;
  subject: string;
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  admin_reply?: string;
  admin_replied_at?: Date;
  admin_name?: string;
  created_at: Date;
  updated_at: Date;
}

const TicketSchema: Schema = new Schema({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  user_email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },
  user_name: {
    type: String,
    trim: true,
    default: 'Valued User'
  },
  category: {
    type: String,
    required: true,
    trim: true,
    default: 'General Problem Solving'
  },
  subject: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['Open', 'In Progress', 'Resolved'],
    default: 'Open',
    index: true
  },
  admin_reply: {
    type: String,
    trim: true
  },
  admin_replied_at: {
    type: Date
  },
  admin_name: {
    type: String,
    default: 'Kamaljit (Lead Developer)'
  },
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

// Auto-update updated_at on save
TicketSchema.pre('save', function (next) {
  this.updated_at = new Date();
  next();
});

export default mongoose.models.Ticket || mongoose.model<ITicket>('Ticket', TicketSchema);
