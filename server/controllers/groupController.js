import Group from '../models/Group.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

/**
 * @desc    Get all groups
 * @route   GET /api/groups
 * @access  Private
 */
export const getGroups = async (req, res) => {
  try {
    let query = {};

    // Filter by role
    if (req.user.role === 'teacher') {
      query.teacher = req.user._id;
    } else if (req.user.role === 'student') {
      query.students = { $in: [req.user._id] };
    }

    const groups = await Group.find(query)
      .populate('teacher', 'name email avatar')
      .populate('students', 'name email avatar')
      .sort('-createdAt');

    return sendSuccess(res, 'Groups fetched successfully', groups);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

/**
 * @desc    Get single group
 * @route   GET /api/groups/:id
 * @access  Private
 */
export const getGroupById = async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('teacher', 'name email avatar')
      .populate('students', 'name email avatar');

    if (!group) {
      return sendError(res, 'Group not found', 404);
    }

    // Check authorization
    if (
      req.user.role === 'teacher' && group.teacher._id.toString() !== req.user._id.toString()
    ) {
      return sendError(res, 'Not authorized to view this group', 403);
    }

    return sendSuccess(res, 'Group details fetched successfully', group);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

/**
 * @desc    Create new group
 * @route   POST /api/groups
 * @access  Private/Admin
 */
export const createGroup = async (req, res) => {
  try {
    const group = await Group.create(req.body);

    return sendSuccess(res, 'Group created successfully', group, 201);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

/**
 * @desc    Update group
 * @route   PUT /api/groups/:id
 * @access  Private/Admin
 */
export const updateGroup = async (req, res) => {
  try {
    const group = await Group.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!group) {
      return sendError(res, 'Group not found', 404);
    }

    return sendSuccess(res, 'Group updated successfully', group);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

/**
 * @desc    Delete group
 * @route   DELETE /api/groups/:id
 * @access  Private/Admin
 */
export const deleteGroup = async (req, res) => {
  try {
    const group = await Group.findByIdAndDelete(req.params.id);

    if (!group) {
      return sendError(res, 'Group not found', 404);
    }

    return sendSuccess(res, 'Group deleted successfully');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

/**
 * @desc    Add student to group
 * @route   POST /api/groups/:id/students
 * @access  Private/Admin
 */
export const addStudentToGroup = async (req, res) => {
  try {
    const { studentId } = req.body;
    const group = await Group.findById(req.params.id);

    if (!group) {
      return sendError(res, 'Group not found', 404);
    }

    if (group.students.includes(studentId)) {
      return sendError(res, 'Student already in group', 400);
    }

    group.students.push(studentId);
    await group.save();

    return sendSuccess(res, 'Student added to group successfully', group);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};
