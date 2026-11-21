import User from '../models/userModel.js';
import Group from '../models/Group.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

const SORTABLE_FIELDS = ['createdAt', 'name', 'email', 'status'];

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * @desc    Get all teachers
 * @route   GET /api/teachers
 * @access  Private/Admin
 */
export const getTeachers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = typeof req.query.search === 'string' ? escapeRegex(req.query.search) : '';
    const sortField = SORTABLE_FIELDS.includes(req.query.sort) ? req.query.sort : 'createdAt';
    const sortOrder = req.query.order === 'asc' ? 1 : -1;

    // Build query
    const query = {
      role: 'teacher',
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ],
    };

    const [total, active, groupsTotal] = await Promise.all([
      User.countDocuments(query),
      User.countDocuments({ ...query, status: 'active' }),
      Group.countDocuments(),
    ]);
    const teachers = await User.find(query)
      .sort({ [sortField]: sortOrder, _id: 1 })
      .skip(skip)
      .limit(limit);

    const groups = await Group.find({ teacher: { $in: teachers.map((t) => t._id) } })
      .select('teacher students')
      .lean();

    const teachersWithStats = teachers.map((teacher) => {
      const own = groups.filter((g) => g.teacher.equals(teacher._id));
      const studentIds = new Set(own.flatMap((g) => g.students.map(String)));
      return {
        ...teacher.toObject(),
        groupCount: own.length,
        studentCount: studentIds.size,
      };
    });

    return sendSuccess(res, 'Teachers fetched successfully', teachersWithStats, {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      active,
      groupsTotal,
    });
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

/**
 * @desc    Get single teacher by ID
 * @route   GET /api/teachers/:id
 * @access  Private/Admin
 */
export const getTeacherById = async (req, res) => {
  try {
    const teacher = await User.findOne({ _id: req.params.id, role: 'teacher' });

    if (!teacher) {
      return sendError(res, 'Teacher not found', 404);
    }

    // Fetch groups where this teacher is assigned
    const groups = await Group.find({ teacher: teacher._id })
      .select('name course status students schedule startDate endDate')
      .populate('students', 'name avatar')
      .sort('-createdAt');

    const teacherData = {
      ...teacher.toObject(),
      groups,
      groupCount: groups.length,
    };

    return sendSuccess(res, 'Teacher details fetched successfully', teacherData);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

/**
 * @desc    Update teacher
 * @route   PUT /api/teachers/:id
 * @access  Private/Admin
 */
export const updateTeacher = async (req, res) => {
  try {
    const { name, email, status, password } = req.body;

    const teacher = await User.findOne({ _id: req.params.id, role: 'teacher' });

    if (!teacher) {
      return sendError(res, 'Teacher not found', 404);
    }

    if (email && email !== teacher.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return sendError(res, 'Email already in use', 400);
      }
      teacher.email = email;
    }

    if (name) teacher.name = name;
    if (status) teacher.status = status;
    if (password) {
      teacher.password = password;
    }

    await teacher.save();

    return sendSuccess(res, 'Teacher updated successfully', teacher);
  } catch (error) {
    return sendError(res, error.message, 400);
  }
};

/**
 * @desc    Delete teacher
 * @route   DELETE /api/teachers/:id
 * @access  Private/Admin
 */
export const deleteTeacher = async (req, res) => {
  try {
    const teacher = await User.findOneAndDelete({ _id: req.params.id, role: 'teacher' });

    if (!teacher) {
      return sendError(res, 'Teacher not found', 404);
    }

    return sendSuccess(res, 'Teacher deleted successfully');
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};

/**
 * @desc    Invite teacher (Stub for now)
 * @route   POST /api/teachers/invite
 * @access  Private/Admin
 */
export const inviteTeacher = async (req, res) => {
  try {
    const { name, email, password, status } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return sendError(res, 'User with this email already exists', 400);
    }

    const teacher = await User.create({
      name,
      email,
      password,
      status: status || 'active',
      role: 'teacher'
    });

    return sendSuccess(res, 'Teacher created successfully', teacher);
  } catch (error) {
    return sendError(res, error.message, 500);
  }
};
