import express from 'express';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  getStudentPayments,
  createPaymentPlan,
  updatePaymentPlan,
  deletePaymentPlan,
  approvePayment,
  unapprovePayment,
  getMyPayments,
} from '../controllers/paymentController.js';

const router = express.Router();

// Student: get own payments
router.get('/my', protect, authorize('student'), getMyPayments);

// Admin: get payments for a specific student
router.get('/student/:id', protect, authorize('admin'), getStudentPayments);

// Admin: create payment plan
router.post('/plan', protect, authorize('admin'), createPaymentPlan);

// Admin: update or delete a payment plan
router
  .route('/plan/:id')
  .put(protect, authorize('admin'), updatePaymentPlan)
  .delete(protect, authorize('admin'), deletePaymentPlan);

// Admin: approve / unapprove individual payment entries
router.put('/:planId/approve/:historyId', protect, authorize('admin'), approvePayment);
router.put('/:planId/unapprove/:historyId', protect, authorize('admin'), unapprovePayment);

export default router;
