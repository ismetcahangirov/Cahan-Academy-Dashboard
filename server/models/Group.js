import mongoose from 'mongoose';

const groupSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a group name'],
      trim: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Please assign a teacher'],
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    course: {
      type: String, // Will be changed to ObjectId when Course model is ready
      required: [true, 'Please specify a course'],
    },
    schedule: {
      days: [String], // e.g. ["Monday", "Wednesday"]
      time: String,   // e.g. "19:00"
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active',
    },
    startDate: Date,
    endDate: Date,
  },
  {
    timestamps: true,
  }
);

const Group = mongoose.model('Group', groupSchema);

export default Group;
