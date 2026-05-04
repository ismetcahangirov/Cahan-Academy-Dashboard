import express from 'express';
import {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  addLesson,
} from '../controllers/courseController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getCourses)
  .post(authorize('admin'), createCourse);

router.route('/:id')
  .get(getCourseById)
  .put(authorize('admin'), updateCourse)
  .delete(authorize('admin'), deleteCourse);

router.post('/:id/lessons', authorize('admin'), addLesson);

export default router;
