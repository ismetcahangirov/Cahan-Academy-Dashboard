import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getQuizzes,
  getQuizById,
  createQuiz,
  updateQuiz,
  submitQuiz,
  deleteQuiz,
  startQuiz,
  getQuizAttempt,
  gradeQuizAttempt,
} from '../controllers/quizController.js';

const router = express.Router();

router.route('/')
  .get(protect, getQuizzes)
  .post(protect, authorize('admin', 'teacher'), createQuiz);

router.route('/:id')
  .get(protect, getQuizById)
  .put(protect, authorize('admin', 'teacher'), updateQuiz)
  .delete(protect, authorize('admin', 'teacher'), deleteQuiz);

router.route('/:id/start')
  .post(protect, authorize('student'), startQuiz);

router.route('/:id/submit')
  .post(protect, authorize('student'), submitQuiz);

router.route('/:id/attempts/:studentId')
  .get(protect, getQuizAttempt);

router.route('/:id/attempts/:studentId/grades')
  .put(protect, authorize('admin', 'teacher'), gradeQuizAttempt);

export default router;
