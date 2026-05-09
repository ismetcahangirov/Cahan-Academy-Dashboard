import User from '../models/userModel.js';
import Course from '../models/Course.js';
import Group from '../models/Group.js';
import Notification from '../models/Notification.js';
import Attendance from '../models/Attendance.js';

// Son 7 ay üçün tarix aralığı və ay etiketlərini hazırlayır
const getLast7Months = () => {
  const months = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      year: d.getFullYear(),
      month: d.getMonth() + 1, // 1-indexed
      label: d.toLocaleString('en-US', { month: 'short' }).toLowerCase(),
      start: new Date(d.getFullYear(), d.getMonth(), 1),
      end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999),
    });
  }
  return months;
};

// Verilmiş modeli aya görə aggregate edir
const countByMonth = async (Model, dateField, months, extraMatch = {}) => {
  const start = months[0].start;
  const end = months[months.length - 1].end;

  const result = await Model.aggregate([
    {
      $match: {
        [dateField]: { $gte: start, $lte: end },
        ...extraMatch,
      },
    },
    {
      $group: {
        _id: {
          year: { $year: `$${dateField}` },
          month: { $month: `$${dateField}` },
        },
        count: { $sum: 1 },
      },
    },
  ]);

  // Nəticəni ay-il açarına görə map et
  const map = {};
  result.forEach(({ _id, count }) => {
    map[`${_id.year}-${_id.month}`] = count;
  });
  return map;
};

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
export const getStats = async (req, res) => {
  try {
    // ── Ümumi statistika ──────────────────────────────────────────────────────
    const totalUsers    = await User.countDocuments();
    const activeUsers   = await User.countDocuments({ status: 'active' });
    const admins        = await User.countDocuments({ role: 'admin' });
    const teachers      = await User.countDocuments({ role: 'teacher' });
    const students      = await User.countDocuments({ role: 'student' });
    const totalCourses  = await Course.countDocuments();
    const totalGroups   = await Group.countDocuments();
    const learningHours = totalGroups * 48;

    // ── Son 7 ayın real aktivliyi ─────────────────────────────────────────────
    const months = getLast7Months();

    const [userMap, groupMap, attendanceMap] = await Promise.all([
      countByMonth(User,       'createdAt',  months),
      countByMonth(Group,      'createdAt',  months),
      countByMonth(Attendance, 'createdAt',  months),
    ]);

    const monthlyActivity = months.map(({ year, month, label }) => {
      const key = `${year}-${month}`;
      const newUsers      = userMap[key]       || 0;
      const newGroups     = groupMap[key]      || 0;
      const attendances   = attendanceMap[key] || 0;
      // Ağırlıqlı aktivlik: istifadəçi*3 + qrup*5 + davamiyyət*1
      const value = newUsers * 3 + newGroups * 5 + attendances;
      return { month: label, value };
    });

    res.status(200).json({
      success: true,
      data: {
        users: { total: totalUsers, active: activeUsers, admins, teachers, students },
        courses:      { total: totalCourses,  trend: 8  },
        groups:       { total: totalGroups,   trend: 15 },
        learningHours:{ total: learningHours, trend: 5  },
        monthlyActivity,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get recent activities
// @route   GET /api/dashboard/activities
// @access  Private
export const getRecentActivities = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(5);

    const activities = notifications.map(notif => ({
      id: notif._id,
      type: notif.type,
      message: notif.title + (notif.message ? ` - ${notif.message}` : ''),
      time: notif.createdAt,
    }));

    res.status(200).json({ success: true, data: activities });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
