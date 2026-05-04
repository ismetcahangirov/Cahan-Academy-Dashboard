import mongoose from 'mongoose';

const lessonSchema = mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Dərs adı mütləqdir'],
      trim: true,
    },
    content: {
      type: String,
    },
    videoUrl: {
      type: String,
    },
    duration: {
      type: Number, // in minutes
      default: 0,
    },
    order: {
      type: Number,
      default: 0,
    },
    resources: [
      {
        name: String,
        url: String,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Lesson = mongoose.model('Lesson', lessonSchema);

export default Lesson;
