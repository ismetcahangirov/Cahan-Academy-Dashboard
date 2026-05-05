import express from 'express';
import {
  getExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  addExamResults,
} from '../controllers/examController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Bütün istifadəçilər icazəlidir (Tələbə öz qrupunun imtahanlarını görəcək)
router.use(protect);

router.route('/')
  .get(getExams)
  .post(authorize('admin', 'teacher'), createExam);

router.route('/:id')
  .get(getExamById)
  .put(authorize('admin', 'teacher'), updateExam)
  .delete(authorize('admin', 'teacher'), deleteExam);

router.route('/:id/results')
  .post(authorize('admin', 'teacher'), addExamResults);

export default router;
