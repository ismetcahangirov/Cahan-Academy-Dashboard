import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['multiple-choice', 'true-false', 'open-ended'],
    default: 'multiple-choice',
  },
  options: [
    {
      type: String,
    },
  ],
  // option index ('0', '1', ...) or 'true' / 'false'; open-ended questions have none
  correctAnswer: {
    type: String,
    required: function requiredForAutoGraded() {
      return this.type !== 'open-ended';
    },
  },
  points: {
    type: Number,
    default: 1,
  },
});

const quizAttemptSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    answers: [
      {
        questionId: mongoose.Schema.Types.ObjectId,
        selectedOption: String,
        isCorrect: Boolean,
        // Auto-graded: fixed at submit time; open-ended: set by the teacher (null = not graded yet)
        awardedPoints: Number,
      },
    ],
    score: {
      type: Number,
      required: true,
    },
    totalPoints: {
      type: Number,
      required: true,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const quizSchema = new mongoose.Schema(
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
    questions: [questionSchema],
    timeLimit: {
      type: Number, // in minutes
      default: 30,
    },
    attempts: [quizAttemptSchema],
    // When each student opened the quiz; the time limit runs from here
    starts: [
      {
        _id: false,
        student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        startedAt: { type: Date, required: true },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

quizSchema.index({ group: 1 });
quizSchema.index({ teacher: 1 });

const Quiz = mongoose.model('Quiz', quizSchema);

export default Quiz;
