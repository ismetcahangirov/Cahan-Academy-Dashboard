import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'submitted', 'late', 'graded'],
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

const homeworkSchema = new mongoose.Schema(
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
      required: [true, 'Zəhmət olmasa son tarix daxil edin'],
    },
    files: [
      {
        type: String, // Fayl adları və ya URL-lər
      },
    ],
    submissions: [submissionSchema],
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
homeworkSchema.index({ group: 1 });
homeworkSchema.index({ teacher: 1 });
homeworkSchema.index({ dueDate: 1 });

const Homework = mongoose.model('Homework', homeworkSchema);

export default Homework;
