import mongoose from 'mongoose';
import crypto from 'crypto';

const invitationSchema = mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Please add an email'],
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ['teacher', 'student'],
      required: true,
    },
    token: {
      type: String,
      unique: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'cancelled', 'expired'],
      default: 'pending',
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Generate unique token before saving
invitationSchema.pre('save', function (next) {
  if (!this.token) {
    this.token = crypto.randomBytes(32).toString('hex');
  }
  next();
});

const Invitation = mongoose.model('Invitation', invitationSchema);

export default Invitation;
