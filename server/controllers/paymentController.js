import asyncHandler from 'express-async-handler';
import Payment from '../models/Payment.js';
import User from '../models/userModel.js';
import apiResponse from '../utils/apiResponse.js';

// @desc    Get payment plan for a specific student (Admin)
// @route   GET /api/payments/student/:id
// @access  Private/Admin
export const getStudentPayments = asyncHandler(async (req, res) => {
  const student = await User.findById(req.params.id).select('name email avatar');
  if (!student) {
    res.status(404);
    throw new Error('Tələbə tapılmadı');
  }

  const payments = await Payment.find({ student: req.params.id })
    .populate('createdBy', 'name')
    .populate('history.approvedBy', 'name')
    .sort('-createdAt');

  return apiResponse.success(res, 'Ödəniş məlumatları uğurla gətirildi', { student, payments });
});

// @desc    Create a payment plan for a student (Admin)
// @route   POST /api/payments/plan
// @access  Private/Admin
export const createPaymentPlan = asyncHandler(async (req, res) => {
  const { studentId, amount, type, startDate, endDate, description } = req.body;

  const student = await User.findById(studentId);
  if (!student) {
    res.status(404);
    throw new Error('Tələbə tapılmadı');
  }

  // Deactivate any existing active plans for this student
  await Payment.updateMany({ student: studentId, isActive: true }, { isActive: false });

  const history = Payment.generateHistory(type, startDate, amount, endDate);

  const payment = await Payment.create({
    student: studentId,
    amount,
    type,
    startDate,
    endDate: endDate || null,
    description: description || '',
    history,
    createdBy: req.user._id,
    isActive: true,
  });

  const populated = await Payment.findById(payment._id)
    .populate('createdBy', 'name')
    .populate('student', 'name email');

  return apiResponse.success(res, 'Ödəniş planı uğurla yaradıldı', populated, 201);
});

// @desc    Update a payment plan (Admin)
// @route   PUT /api/payments/plan/:id
// @access  Private/Admin
export const updatePaymentPlan = asyncHandler(async (req, res) => {
  const { amount, type, startDate, endDate, description } = req.body;

  const payment = await Payment.findById(req.params.id);
  if (!payment) {
    res.status(404);
    throw new Error('Ödəniş planı tapılmadı');
  }

  // Regenerate history if key fields changed
  if (amount || type || startDate || endDate !== undefined) {
    const newAmount = amount ?? payment.amount;
    const newType = type ?? payment.type;
    const newStart = startDate ?? payment.startDate;
    const newEnd = endDate !== undefined ? endDate : payment.endDate;

    payment.amount = newAmount;
    payment.type = newType;
    payment.startDate = newStart;
    payment.endDate = newEnd || null;
    payment.history = Payment.generateHistory(newType, newStart, newAmount, newEnd);
  }

  if (description !== undefined) payment.description = description;

  await payment.save();

  const populated = await Payment.findById(payment._id)
    .populate('createdBy', 'name')
    .populate('student', 'name email');

  return apiResponse.success(res, 'Ödəniş planı uğurla yeniləndi', populated);
});

// @desc    Delete a payment plan (Admin)
// @route   DELETE /api/payments/plan/:id
// @access  Private/Admin
export const deletePaymentPlan = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) {
    res.status(404);
    throw new Error('Ödəniş planı tapılmadı');
  }
  await payment.deleteOne();
  return apiResponse.success(res, 'Ödəniş planı uğurla silindi', null);
});

// @desc    Approve a payment entry (Admin confirms student paid)
// @route   PUT /api/payments/:planId/approve/:historyId
// @access  Private/Admin
export const approvePayment = asyncHandler(async (req, res) => {
  const { planId, historyId } = req.params;
  const { paidDate, note } = req.body;

  const payment = await Payment.findById(planId);
  if (!payment) {
    res.status(404);
    throw new Error('Ödəniş planı tapılmadı');
  }

  const entry = payment.history.id(historyId);
  if (!entry) {
    res.status(404);
    throw new Error('Ödəniş qeydi tapılmadı');
  }

  entry.status = 'paid';
  entry.paidDate = paidDate ? new Date(paidDate) : new Date();
  entry.approvedBy = req.user._id;
  if (note) entry.note = note;

  await payment.save();

  const populated = await Payment.findById(planId)
    .populate('createdBy', 'name')
    .populate('history.approvedBy', 'name')
    .populate('student', 'name email');

  return apiResponse.success(res, 'Ödəniş uğurla təsdiqləndi', populated);
});

// @desc    Undo approval of a payment entry (Admin)
// @route   PUT /api/payments/:planId/unapprove/:historyId
// @access  Private/Admin
export const unapprovePayment = asyncHandler(async (req, res) => {
  const { planId, historyId } = req.params;

  const payment = await Payment.findById(planId);
  if (!payment) {
    res.status(404);
    throw new Error('Ödəniş planı tapılmadı');
  }

  const entry = payment.history.id(historyId);
  if (!entry) {
    res.status(404);
    throw new Error('Ödəniş qeydi tapılmadı');
  }

  entry.status = new Date() > new Date(entry.dueDate) ? 'overdue' : 'pending';
  entry.paidDate = null;
  entry.approvedBy = null;

  await payment.save();

  const populated = await Payment.findById(planId)
    .populate('createdBy', 'name')
    .populate('history.approvedBy', 'name')
    .populate('student', 'name email');

  return apiResponse.success(res, 'Ödəniş təsdiqi geri alındı', populated);
});

// @desc    Get logged-in student's own payments
// @route   GET /api/payments/my
// @access  Private/Student
export const getMyPayments = asyncHandler(async (req, res) => {
  // Auto-update overdue statuses
  const now = new Date();
  const payments = await Payment.find({ student: req.user._id, isActive: true })
    .populate('createdBy', 'name')
    .populate('history.approvedBy', 'name');

  // Mark overdue entries (non-destructively update in DB)
  for (const plan of payments) {
    let dirty = false;
    for (const entry of plan.history) {
      if (entry.status === 'pending' && new Date(entry.dueDate) < now) {
        entry.status = 'overdue';
        dirty = true;
      }
    }
    if (dirty) await plan.save();
  }

  // Re-fetch after potential updates
  const updated = await Payment.find({ student: req.user._id, isActive: true })
    .populate('createdBy', 'name')
    .populate('history.approvedBy', 'name');

  return apiResponse.success(res, 'Ödənişləriniz uğurla gətirildi', updated);
});
