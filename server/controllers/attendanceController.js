import mongoose from 'mongoose';
import Attendance from '../models/Attendance.js';
import Group from '../models/Group.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

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
    queryDate.setHours(0, 0, 0, 0);

    let query = { group, date: queryDate };

    // Role-based access control
    if (req.user.role === 'teacher') {
      // Check if teacher belongs to this group
      const targetGroup = await Group.findById(group);
      if (targetGroup.teacher.toString() !== req.user._id.toString()) {
        return sendError(res, 'Siz yalnız öz qruplarınızın davamiyyətini görə bilərsiniz', 403);
      }
    } else if (req.user.role === 'student') {
      // Check if student is in this group
      const targetGroup = await Group.findById(group);
      if (!targetGroup.students.includes(req.user._id)) {
        return sendError(res, 'Siz yalnız daxil olduğunuz qrupların davamiyyətini görə bilərsiniz', 403);
      }
    }

    const attendance = await Attendance.findOne(query).populate('records.student', 'name avatar');

    if (attendance && req.user.role === 'student') {
      // Filter records to only show the student's own record
      attendance.records = attendance.records.filter(
        r => r.student._id.toString() === req.user._id.toString()
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

    if (!group || !date || !records) {
      return sendError(res, 'Missing required fields', 400);
    }

    // Teacher validation
    if (req.user.role === 'teacher') {
      const targetGroup = await Group.findById(group);
      if (targetGroup.teacher.toString() !== req.user._id.toString()) {
        return sendError(res, 'Siz yalnız öz qruplarınıza davamiyyət yaza bilərsiniz', 403);
      }
    }

    const queryDate = new Date(date);
    queryDate.setHours(0, 0, 0, 0);

    let attendance = await Attendance.findOne({ group, date: queryDate });

    if (attendance) {
      // Update
      attendance.records = records;
      attendance.topic = topic;
      attendance.teacher = req.user._id;
      await attendance.save();
    } else {
      // Create
      attendance = await Attendance.create({
        group,
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
    const targetGroup = await Group.findById(req.params.groupId);
    if (!targetGroup) return sendError(res, 'Qrup tapılmadı', 404);

    if (req.user.role === 'teacher' && targetGroup.teacher.toString() !== req.user._id.toString()) {
      return sendError(res, 'Siz yalnız öz qruplarınızın statistikasını görə bilərsiniz', 403);
    }

    let matchQuery = { group: new mongoose.Types.ObjectId(req.params.groupId) };

    if (req.user.role === 'student') {
      if (!targetGroup.students.includes(req.user._id)) {
        return sendError(res, 'Bu qrupun statistikasını görmək icazəniz yoxdur', 403);
      }
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
