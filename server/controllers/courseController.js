import Course from '../models/Course.js';
import Lesson from '../models/Lesson.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

/**
 * @desc    Get all courses
 * @route   GET /api/courses
 * @access  Private
 */
export const getCourses = async (req, res) => {
  try {
    const courses = await Course.find()
      .populate('instructor', 'name avatar')
      .populate('lessons', 'title duration')
      .sort('-createdAt');

    return sendSuccess(res, 'Courses fetched successfully', courses);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

/**
 * @desc    Get single course
 * @route   GET /api/courses/:id
 * @access  Private
 */
export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name avatar')
      .populate('lessons');

    if (!course) {
      return sendError(res, 'Course not found', 404);
    }

    return sendSuccess(res, 'Course details fetched successfully', course);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

/**
 * @desc    Create new course
 * @route   POST /api/courses
 * @access  Private/Admin
 */
export const createCourse = async (req, res) => {
  try {
    const course = await Course.create(req.body);

    return sendSuccess(res, 'Course created successfully', course, 201);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

/**
 * @desc    Update course
 * @route   PUT /api/courses/:id
 * @access  Private/Admin
 */
export const updateCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!course) {
      return sendError(res, 'Course not found', 404);
    }

    return sendSuccess(res, 'Course updated successfully', course);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

/**
 * @desc    Delete course
 * @route   DELETE /api/courses/:id
 * @access  Private/Admin
 */
export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);

    if (!course) {
      return sendError(res, 'Course not found', 404);
    }

    // Delete associated lessons
    await Lesson.deleteMany({ course: req.params.id });

    return sendSuccess(res, 'Course and associated lessons deleted successfully');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

/**
 * @desc    Add lesson to course
 * @route   POST /api/courses/:id/lessons
 * @access  Private/Admin
 */
export const addLesson = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return sendError(res, 'Course not found', 404);
    }

    const lesson = await Lesson.create({
      ...req.body,
      course: req.params.id,
    });

    course.lessons.push(lesson._id);
    await course.save();

    return sendSuccess(res, 'Lesson added successfully', lesson, 201);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};
