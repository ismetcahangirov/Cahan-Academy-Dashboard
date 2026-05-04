import User from '../models/userModel.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

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
    const search = req.query.search || '';
    const groupId = req.query.groupId;
    const sortField = req.query.sort || 'createdAt';
    const sortOrder = req.query.order === 'asc' ? 1 : -1;

    // Build query
    const query = {
      role: 'student',
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ],
    };

    // If groupId is provided (will be implemented fully when Groups model is ready)
    if (groupId) {
      query.groupId = groupId;
    }

    // Teachers can only see students (logic to be refined when Groups model is ready)
    // For now, if role is teacher, we could potentially filter by their groups

    const total = await User.countDocuments(query);
    const students = await User.find(query)
      .sort({ [sortField]: sortOrder })
      .skip(skip)
      .limit(limit);

    // Note: group info will be added when Groups model is ready
    const studentsWithGroup = students.map(student => ({
      ...student.toObject(),
      group: null, // Placeholder
    }));

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

    // Note: group info will be added when Groups model is ready
    const studentData = {
      ...student.toObject(),
      group: null,
    };

    return sendSuccess(res, 'Student details fetched successfully', studentData);
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
    const { name, isActive, status, groupId } = req.body;

    const student = await User.findOneAndUpdate(
      { _id: req.params.id, role: 'student' },
      { name, isActive, status, groupId },
      { new: true, runValidators: true }
    );

    if (!student) {
      return sendError(res, 'Student not found', 404);
    }

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
    const { email, groupId } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return sendError(res, 'User already exists', 400);
    }

    return sendSuccess(res, 'Invitation sent successfully', {
      email,
      groupId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};
