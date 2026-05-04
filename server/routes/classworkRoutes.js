import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getClassworks,
  getClassworkById,
  createClasswork,
  updateClasswork,
  deleteClasswork,
  submitClasswork,
  gradeClasswork
} from '../controllers/classworkController.js';

const router = express.Router();

router.route('/')
  .get(protect, getClassworks)
  .post(protect, authorize('admin', 'teacher'), createClasswork);

router.route('/:id')
  .get(protect, getClassworkById)
  .put(protect, authorize('admin', 'teacher'), updateClasswork)
  .delete(protect, authorize('admin', 'teacher'), deleteClasswork);

router.route('/:id/submit')
  .post(protect, authorize('student'), submitClasswork);

router.route('/:id/grade')
  .put(protect, authorize('admin', 'teacher'), gradeClasswork);

export default router;
