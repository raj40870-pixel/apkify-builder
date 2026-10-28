import mongoose, { Document, Schema } from 'mongoose';

export interface IBuild extends Document {
  id: string;
  user_id: mongoose.Types.ObjectId;
  user_email?: string;
  user_name?: string;
  apk_name: string;
  created_at: Date;
  status: string;
  downloadUrl?: string;
}

const buildSchema = new Schema<IBuild>({
  id: {
    type: String,
    required: true,
    unique: true
  },
  user_id: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  user_email: {
    type: String,
    default: ''
  },
  user_name: {
    type: String,
    default: ''
  },
  apk_name: {
    type: String,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    default: 'Building'
  },
  downloadUrl: {
    type: String,
    default: ''
  }
});

const Build = mongoose.models.Build || mongoose.model<IBuild>('Build', buildSchema);
export default Build;
