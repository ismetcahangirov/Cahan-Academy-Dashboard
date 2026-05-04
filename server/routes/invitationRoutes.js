import express from 'express';
import {
  getInvitations,
  sendInvitation,
  verifyInvitation,
  deleteInvitation,
} from '../controllers/invitationController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Public route for verification
router.get('/verify/:token', verifyInvitation);

// Protected routes (Admin only)
router.use(protect);
router.use(authorize('admin'));

router.route('/')
  .get(getInvitations)
  .post(sendInvitation);

router.delete('/:id', deleteInvitation);

export default router;
