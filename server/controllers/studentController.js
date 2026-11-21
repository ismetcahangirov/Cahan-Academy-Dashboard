import User from '../models/userModel.js';
import Group from '../models/Group.js';
import Attendance from '../models/Attendance.js';
import mongoose from 'mongoose';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { buildGroupFilter } from '../utils/groupAccess.js';

const SORTABLE_FIELDS = ['createdAt', 'name', 'email', 'status'];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Teachers may only open students of the groups they teach
const teacherCanSeeStudent = (user, studentId) =>
  Group.exists({ teacher: user._id, students: studentId });

/**
 * @desc    Get all students
 * @route   GET /api/students
 * @access  Private/Admin/Teacher
 */
export const getStudents = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = typeof req.query.search === 'string' ? escapeRegex(req.query.search) : '';
    const groupId = req.query.groupId;
    const sortField = SORTABLE_FIELDS.includes(req.query.sort) ? req.query.sort : 'createdAt';
    const sortOrder = req.query.order === 'asc' ? 1 : -1;

    // Build query
    const query = {
      role: 'student',
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ],
    };

    // Teachers only see students of the groups they teach; groupId narrows within that
    const groupFilter = await buildGroupFilter(req.user, groupId);
    if (groupFilter) {
      const studentIds = await Group.find({ _id: groupFilter }).distinct('students');
      query._id = { $in: studentIds };
    }

    const total = await User.countDocuments(query);
    const students = await User.find(query)
      .sort({ [sortField]: sortOrder, _id: 1 })
      .skip(skip)
      .limit(limit);

    const groupsQuery = { students: { $in: students.map((s) => s._id) } };
    if (req.user.role === 'teacher') groupsQuery.teacher = req.user._id;
    const groups = await Group.find(groupsQuery)
      .select('name students')
      .sort('name')
      .lean();

    const studentsWithGroup = students.map((student) => {
      const studentGroups = groups
        .filter((g) => g.students.some((id) => id.equals(student._id)))
        .map((g) => ({ _id: g._id, name: g.name }));
      return {
        ...student.toObject(),
        groups: studentGroups,
        group: studentGroups.map((g) => g.name).join(', ') || null,
      };
    });

    return sendSuccess(res, 'Students fetched successfully', studentsWithGroup, {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

/**
 * @desc    Get single student by ID
 * @route   GET /api/students/:id
 * @access  Private/Admin/Teacher
 */
export const getStudentById = async (req, res) => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: 'student' });

    if (!student) {
      return sendError(res, 'Student not found', 404);
    }

    if (req.user.role === 'teacher' && !(await teacherCanSeeStudent(req.user, student._id))) {
      return sendError(res, 'Student not found', 404);
    }

    // Fetch groups where this student is a member
    const groups = await Group.find({ students: student._id })
      .select('name course status teacher schedule startDate endDate')
      .populate('teacher', 'name avatar')
      .sort('-createdAt');

    const studentData = {
      ...student.toObject(),
      groups,
    };

    return sendSuccess(res, 'Student details fetched successfully', studentData);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

/**
 * @desc    Get attendance stats for a specific student across all groups
 * @route   GET /api/students/:id/attendance-stats
 * @access  Private/Admin/Teacher
 */
export const getStudentAttendanceStats = async (req, res) => {
  try {
    const student = await User.findOne({ _id: req.params.id, role: 'student' });
    if (!student) return sendError(res, 'Student not found', 404);

    if (req.user.role === 'teacher' && !(await teacherCanSeeStudent(req.user, student._id))) {
      return sendError(res, 'Student not found', 404);
    }

    const stats = await Attendance.aggregate([
      { $unwind: '$records' },
      { $match: { 'records.student': new mongoose.Types.ObjectId(req.params.id) } },
      {
        $group: {
          _id: '$records.status',
          count: { $sum: 1 },
        },
      },
    ]);

    // Normalize to { present, absent, late }
    const result = { present: 0, absent: 0, late: 0 };
    stats.forEach(({ _id, count }) => {
      if (_id && result.hasOwnProperty(_id)) result[_id] = count;
    });

    return sendSuccess(res, 'Student attendance stats fetched', result);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

/**
 * @desc    Update student
 * @route   PUT /api/students/:id
 * @access  Private/Admin
 */
export const updateStudent = async (req, res) => {
  try {
    const { name, email, status, password, groupId } = req.body;

    const student = await User.findOne({ _id: req.params.id, role: 'student' });

    if (!student) {
      return sendError(res, 'Student not found', 404);
    }

    if (email && email !== student.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return sendError(res, 'Email already in use', 400);
      }
      student.email = email;
    }

    if (name) student.name = name;
    if (status) student.status = status;
    if (groupId) student.groupId = groupId;
    if (password) {
      student.password = password;
    }

    await student.save();

    return sendSuccess(res, 'Student updated successfully', student);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

/**
 * @desc    Delete student
 * @route   DELETE /api/students/:id
 * @access  Private/Admin
 */
export const deleteStudent = async (req, res) => {
  try {
    const student = await User.findOneAndDelete({ _id: req.params.id, role: 'student' });

    if (!student) {
      return sendError(res, 'Student not found', 404);
    }

    return sendSuccess(res, 'Student deleted successfully');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

/**
 * @desc    Invite student (Stub)
 * @route   POST /api/students/invite
 * @access  Private/Admin
 */
export const inviteStudent = async (req, res) => {
  try {
    const { name, email, password, status, groupId } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return sendError(res, 'User already exists', 400);
    }

    const student = await User.create({
      name,
      email,
      password,
      status: status || 'active',
      role: 'student',
      groupId
    });

    return sendSuccess(res, 'Student created successfully', student);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};
