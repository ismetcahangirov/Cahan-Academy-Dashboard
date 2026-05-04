import mongoose from 'mongoose';

const courseSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Kurs adı mütləqdir'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Kurs təsviri mütləqdir'],
    },
    category: {
      type: String,
      required: [true, 'Kateqoriya mütləqdir'],
    },
    thumbnail: {
      type: String,
      default: 'https://via.placeholder.com/300x200',
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    lessons: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson',
      },
    ],
    level: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner',
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
  },
  {
    timestamps: true,
  }
);

const Course = mongoose.model('Course', courseSchema);

export default Course;
