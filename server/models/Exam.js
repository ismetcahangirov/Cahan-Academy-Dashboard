import mongoose from 'mongoose';

const examResultSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    feedback: {
      type: String,
    },
    // Online exams: raw points behind the 0-100 score
    earnedPoints: Number,
    totalPoints: Number,
    // Filled when the student takes the exam online
    answers: [
      {
        questionId: mongoose.Schema.Types.ObjectId,
        selectedOption: String,
        isCorrect: Boolean,
        // Auto-graded: fixed at submit time; open-ended: set by the teacher (null = not graded yet)
        awardedPoints: Number,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const examSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Zəhmət olmasa imtahan başlığını daxil edin'],
      trim: true,
    },
    description: {
      type: String,
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
    date: {
      type: Date,
      required: [true, 'Zəhmət olmasa imtahan tarixini daxil edin'],
    },
    duration: {
      type: Number, // in minutes
      required: [true, 'Zəhmət olmasa imtahan müddətini daxil edin'],
    },
    type: {
      type: String,
      enum: ['midterm', 'final', 'practice'],
      default: 'practice',
    },
    questions: [
      {
        text: { type: String, required: true },
        type: {
          type: String,
          enum: ['multiple-choice', 'true-false', 'open-ended'],
          required: true
        },
        options: [String], // for multiple-choice
        correctAnswer: String, // option index ('0', '1', ...) or 'true' / 'false'
        points: { type: Number, default: 1 }
      }
    ],
    results: [examResultSchema],
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
examSchema.index({ group: 1 });
examSchema.index({ teacher: 1 });
examSchema.index({ date: 1 });

const Exam = mongoose.model('Exam', examSchema);

export default Exam;
