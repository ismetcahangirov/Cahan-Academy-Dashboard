import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getQuizzes,
  getQuizById,
  createQuiz,
  updateQuiz,
  submitQuiz,
  deleteQuiz
} from '../controllers/quizController.js';

const router = express.Router();

router.route('/')
  .get(protect, getQuizzes)
  .post(protect, authorize('admin', 'teacher'), createQuiz);

router.route('/:id')
  .get(protect, getQuizById)
  .put(protect, authorize('admin', 'teacher'), updateQuiz)
  .delete(protect, authorize('admin', 'teacher'), deleteQuiz);

router.route('/:id/submit')
  .post(protect, authorize('student'), submitQuiz);

export default router;
