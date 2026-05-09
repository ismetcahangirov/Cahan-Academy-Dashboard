import mongoose from 'mongoose';

const classworkSubmissionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'submitted', 'graded'],
      default: 'pending',
    },
    submittedAt: {
      type: Date,
    },
    files: [
      {
        type: String,
      },
    ],
    grade: {
      type: Number,
      min: 0,
      max: 100,
    },
    feedback: {
      type: String,
    },
    note: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const classworkSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Zəhmət olmasa başlıq daxil edin'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Zəhmət olmasa təsvir daxil edin'],
    },
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      required: [true, 'Zəhmət olmasa qrup seçin'],
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    dueDate: {
      type: Date,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    files: [
      {
        type: String,
      },
    ],
    submissions: [classworkSubmissionSchema],
  },
  {
    timestamps: true,
  }
);

classworkSchema.index({ group: 1 });
classworkSchema.index({ teacher: 1 });
classworkSchema.index({ date: 1 });

const Classwork = mongoose.model('Classwork', classworkSchema);

export default Classwork;
