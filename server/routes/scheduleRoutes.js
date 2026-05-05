import express from 'express';
import {
  getSchedule,
  getScheduleById,
  createScheduleEntry,
  updateScheduleEntry,
  deleteScheduleEntry,
} from '../controllers/scheduleController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.route('/').get(getSchedule).post(authorize('admin', 'teacher'), createScheduleEntry);
router
  .route('/:id')
  .get(getScheduleById)
  .put(authorize('admin', 'teacher'), updateScheduleEntry)
  .delete(authorize('admin'), deleteScheduleEntry);

export default router;
