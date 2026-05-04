import express from 'express';
import {
  getGroups,
  getGroupById,
  createGroup,
  updateGroup,
  deleteGroup,
  addStudentToGroup,
} from '../controllers/groupController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getGroups)
  .post(authorize('admin'), createGroup);

router.route('/:id')
  .get(getGroupById)
  .put(authorize('admin'), updateGroup)
  .delete(authorize('admin'), deleteGroup);

router.post('/:id/students', authorize('admin'), addStudentToGroup);

export default router;
