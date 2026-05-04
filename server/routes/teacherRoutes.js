import express from 'express';
import {
  getTeachers,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
  inviteTeacher,
} from '../controllers/teacherController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// All routes are protected and admin only
router.use(protect);
router.use(authorize('admin'));

router.route('/')
  .get(getTeachers);

router.post('/invite', inviteTeacher);

router.route('/:id')
  .get(getTeacherById)
  .put(updateTeacher)
  .delete(deleteTeacher);

export default router;
