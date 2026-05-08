import express from 'express';
import {
  getStudents,
  getStudentById,
  updateStudent,
  deleteStudent,
  inviteStudent,
  getStudentAttendanceStats,
} from '../controllers/studentController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(authorize('admin', 'teacher'), getStudents);

router.post('/invite', authorize('admin'), inviteStudent);

router.get('/:id/attendance-stats', authorize('admin', 'teacher'), getStudentAttendanceStats);

router.route('/:id')
  .get(authorize('admin', 'teacher'), getStudentById)
  .put(authorize('admin'), updateStudent)
  .delete(authorize('admin'), deleteStudent);

export default router;

