import mongoose from 'mongoose';
import Attendance from '../models/Attendance.js';
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

    // Normalize date to start of day
    const queryDate = new Date(date);
    queryDate.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      group,
      date: queryDate,
    }).populate('records.student', 'name avatar');

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
    const stats = await Attendance.aggregate([
      { $match: { group: new mongoose.Types.ObjectId(req.params.groupId) } },
      { $unwind: '$records' },
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
