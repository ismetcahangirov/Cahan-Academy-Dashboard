import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema(
  {
    schedule: { type: mongoose.Schema.Types.ObjectId, ref: 'Schedule', required: true, index: true },
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group' },
    teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    subject: { type: String },
    occurrenceDate: { type: String, required: true }, // "YYYY-MM-DD" (Asia/Baku)
    roomName: { type: String, required: true, unique: true }, // "cahanacademy-<uuid>"
    startTime: { type: String },
    endTime: { type: String },
    status: { type: String, enum: ['active', 'ended'], default: 'active' },
    participants: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        joinedAt: { type: Date, default: Date.now },
        leftAt: { type: Date },
      },
    ],
  },
  { timestamps: true }
);

// One meeting room per (schedule occurrence).
meetingSchema.index({ schedule: 1, occurrenceDate: 1 }, { unique: true });

const Meeting = mongoose.model('Meeting', meetingSchema);

export default Meeting;
