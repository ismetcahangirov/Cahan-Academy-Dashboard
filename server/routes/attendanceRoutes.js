import express from 'express';
import {
  getAttendance,
  markAttendance,
  getGroupStats,
} from '../controllers/attendanceController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getAttendance)
  .post(authorize('admin', 'teacher'), markAttendance);

router.get('/stats/:groupId', getGroupStats);

export default router;
