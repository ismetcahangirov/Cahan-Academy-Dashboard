import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    repetitionType: {
      type: String,
      enum: ['weekly', 'once'],
      default: 'weekly',
    },
    dayOfWeek: {
      type: Number,
      min: 0, // 0 = Bazar ertəsi
      max: 6, // 6 = Bazar
    },
    specificDate: {
      type: Date,
    },
    startTime: {
      type: String, // "09:00"
      required: true,
    },
    endTime: {
      type: String, // "10:30"
      required: true,
    },
    room: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['online', 'offline'],
      default: 'offline',
    },
    note: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

const Schedule = mongoose.model('Schedule', scheduleSchema);

export default Schedule;
