import User from '../models/userModel.js';
import Course from '../models/Course.js';
import Group from '../models/Group.js';
import Notification from '../models/Notification.js';

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
export const getStats = async (req, res) => {
  try {
    // Real data from User model
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ status: 'active' });
    const admins = await User.countDocuments({ role: 'admin' });
    const teachers = await User.countDocuments({ role: 'teacher' });
    const students = await User.countDocuments({ role: 'student' });

    // Real data from Course and Group models
    const totalCourses = await Course.countDocuments(); 
    const totalGroups = await Group.countDocuments();
    
    // As learning hours are not tracked directly yet, keeping a placeholder or simple calculation
    const learningHours = totalGroups * 48; // e.g. 48 hours per group

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          admins,
          teachers,
          students
        },
        courses: {
          total: totalCourses,
          trend: 8
        },
        groups: {
          total: totalGroups,
          trend: 15
        },
        learningHours: {
          total: learningHours,
          trend: 5
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get recent activities
// @route   GET /api/dashboard/activities
// @access  Private
export const getRecentActivities = async (req, res) => {
  try {
    // Query recent notifications to act as activities
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(5);

    const activities = notifications.map(notif => ({
      id: notif._id,
      type: notif.type,
      message: notif.title + (notif.message ? ` - ${notif.message}` : ''),
      time: notif.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: activities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
