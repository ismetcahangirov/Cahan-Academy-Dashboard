import mongoose from 'mongoose';
import Attendance from '../models/Attendance.js';
import Group from '../models/Group.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { canManageGroup, canViewGroup } from '../utils/groupAccess.js';

const findGroup = (id) => (mongoose.isValidObjectId(id) ? Group.findById(id) : null);

const recordStudentId = (record) => (record.student?._id ?? record.student)?.toString();

/**
 * @desc    Get attendance for a group and date
 * @route   GET /api/attendance
 * @access  Private
 */
export const getAttendance = async (req, res) => {
  try {
    const { group, date } = req.query;

    if (!group || !date) {
      return sendError(res, 'Group and date are required', 400);
    }

    const queryDate = new Date(date);
    if (Number.isNaN(queryDate.getTime())) {
      return sendError(res, 'Invalid date', 400);
    }
    queryDate.setHours(0, 0, 0, 0);

    const targetGroup = await findGroup(group);
    if (!targetGroup) return sendError(res, 'Qrup tapılmadı', 404);

    if (!canViewGroup(req.user, targetGroup)) {
      return sendError(
        res,
        req.user.role === 'teacher'
          ? 'Siz yalnız öz qruplarınızın davamiyyətini görə bilərsiniz'
          : 'Siz yalnız daxil olduğunuz qrupların davamiyyətini görə bilərsiniz',
        403
      );
    }

    const attendance = await Attendance.findOne({ group: targetGroup._id, date: queryDate })
      .populate('records.student', 'name avatar')
      .lean();

    if (attendance && req.user.role === 'student') {
      // A student only sees their own record
      attendance.records = attendance.records.filter(
        (r) => recordStudentId(r) === req.user._id.toString()
      );
    }

    return sendSuccess(res, 'Attendance fetched successfully', attendance);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

/**
 * @desc    Create or update attendance
 * @route   POST /api/attendance
 * @access  Private
 */
export const markAttendance = async (req, res) => {
  try {
    const { group, date, records, topic } = req.body;

    if (!group || !date || !Array.isArray(records)) {
      return sendError(res, 'Missing required fields', 400);
    }

    const targetGroup = await findGroup(group);
    if (!targetGroup) return sendError(res, 'Qrup tapılmadı', 404);

    // Only admin or the group's own teacher may write attendance
    if (!canManageGroup(req.user, targetGroup)) {
      return sendError(res, 'Siz yalnız öz qruplarınıza davamiyyət yaza bilərsiniz', 403);
    }

    const queryDate = new Date(date);
    if (Number.isNaN(queryDate.getTime())) {
      return sendError(res, 'Invalid date', 400);
    }
    queryDate.setHours(0, 0, 0, 0);

    let attendance = await Attendance.findOne({ group: targetGroup._id, date: queryDate });

    // Records may only reference the group's students (or students already in this record)
    const allowedStudents = new Set([
      ...targetGroup.students.map((s) => s.toString()),
      ...(attendance?.records || []).map(recordStudentId),
    ]);
    if (records.some((r) => !r || !allowedStudents.has(String(recordStudentId(r))))) {
      return sendError(res, 'Davamiyyət yalnız qrupun tələbələri üçün yazıla bilər', 400);
    }

    if (attendance) {
      // Update
      attendance.records = records;
      attendance.topic = topic;
      attendance.teacher = req.user._id;
      await attendance.save();
    } else {
      // Create
      attendance = await Attendance.create({
        group: targetGroup._id,
        date: queryDate,
        records,
        topic,
        teacher: req.user._id,
      });
    }

    return sendSuccess(res, 'Attendance marked successfully', attendance);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

/**
 * @desc    Get attendance statistics for a group
 * @route   GET /api/attendance/stats/:groupId
 * @access  Private
 */
export const getGroupStats = async (req, res) => {
  try {
    // Access control for stats
    const targetGroup = await findGroup(req.params.groupId);
    if (!targetGroup) return sendError(res, 'Qrup tapılmadı', 404);

    if (!canViewGroup(req.user, targetGroup)) {
      return sendError(
        res,
        req.user.role === 'teacher'
          ? 'Siz yalnız öz qruplarınızın statistikasını görə bilərsiniz'
          : 'Bu qrupun statistikasını görmək icazəniz yoxdur',
        403
      );
    }

    let matchQuery = { group: targetGroup._id };

    if (req.user.role === 'student') {
      matchQuery['records.student'] = new mongoose.Types.ObjectId(req.user._id);
    }

    const stats = await Attendance.aggregate([
      { $match: matchQuery },
      { $unwind: '$records' },
      { 
        $match: req.user.role === 'student' 
          ? { 'records.student': new mongoose.Types.ObjectId(req.user._id) }
          : {}
      },
      {
        $group: {
          _id: '$records.status',
          count: { $sum: 1 },
        },
      },
    ]);

    return sendSuccess(res, 'Attendance stats fetched successfully', stats);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};
