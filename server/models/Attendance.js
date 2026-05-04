import mongoose from 'mongoose';

const attendanceSchema = mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: [true, 'Qrup mütləqdir'],
    },
    date: {
      type: Date,
      required: [true, 'Tarix mütləqdir'],
    },
    records: [
      {
        student: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        status: {
          type: String,
          enum: ['present', 'absent', 'late', 'excused'],
          default: 'present',
        },
        note: {
          type: String,
          trim: true,
        },
      },
    ],
    topic: {
      type: String,
      trim: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate attendance for the same group and date
attendanceSchema.index({ group: 1, date: 1 }, { unique: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);

export default Attendance;
