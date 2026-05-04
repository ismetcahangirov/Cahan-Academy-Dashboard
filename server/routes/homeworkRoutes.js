import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getHomeworks,
  getHomeworkById,
  createHomework,
  updateHomework,
  deleteHomework,
  submitHomework,
  gradeHomework
} from '../controllers/homeworkController.js';

const router = express.Router();

// Bütün istifadəçilər homeworks-u görə bilər (qrupa/özünə aid olanı)
router.route('/')
  .get(protect, getHomeworks)
  .post(protect, authorize('admin', 'teacher'), createHomework);

router.route('/:id')
  .get(protect, getHomeworkById)
  .put(protect, authorize('admin', 'teacher'), updateHomework)
  .delete(protect, authorize('admin', 'teacher'), deleteHomework);

// Tələbə tapşırıq təhvil verir
router.route('/:id/submit')
  .post(protect, authorize('student'), submitHomework);

// Müəllim tapşırığı qiymətləndirir
router.route('/:id/grade')
  .put(protect, authorize('admin', 'teacher'), gradeHomework);

export default router;
