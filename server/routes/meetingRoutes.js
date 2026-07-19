import express from 'express';
import { joinOrCreateMeeting, startMeeting, leaveMeeting } from '../controllers/meetingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.post('/join-or-create/:scheduleId', joinOrCreateMeeting);
router.post('/:id/start', startMeeting);
router.post('/:id/leave', leaveMeeting);

export default router;
