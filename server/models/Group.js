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
      repetitionType: {
        type: String,
        enum: ['weekly', 'once'],
        default: 'weekly'
      },
      days: [String], // used if repetitionType is 'weekly'
      specificDate: Date, // used if repetitionType is 'once'
      startTime: String, // e.g. "19:00"
      endTime: String,   // e.g. "21:00"
      type: {
        type: String,
        enum: ['online', 'offline'],
        default: 'offline'
      },
      note: String
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
