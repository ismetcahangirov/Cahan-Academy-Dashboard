import User from '../models/userModel.js';
import Course from '../models/Course.js';
import Group from '../models/Group.js';
import Notification from '../models/Notification.js';
import Attendance from '../models/Attendance.js';
import { getAcademyNow } from '../utils/academyTime.js';

const MONTH_LABELS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

// Son 7 ay (akademiya vaxtı ilə cari ay daxil). Dərs tarixləri "YYYY-MM-DD" kimi UTC gecə yarısında saxlanılır,
// ona görə ay açarı UTC il-ay ilə uyğunlaşır.
const getLast7Months = (now = new Date()) => {
  const [year, month] = getAcademyNow(now).dateStr.split('-').map(Number);
  const months = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.UTC(year, month - 1 - i, 1));
    months.push({
      key: `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`,
      label: MONTH_LABELS[d.getUTCMonth()],
    });
  }
  return months;
};

// "HH:mm" → gün başlanğıcından dəqiqə; yanlış dəyər üçün null
const parseTime = (value) => {
  const match = /^([01]?\d|2[0-3]):([0-5]\d)$/.exec(String(value ?? '').trim());
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
};

// Qrup cədvəlinə görə bir dərsin müddəti (dəqiqə). Bitmə başlanğıcdan tezdirsə dərs gecə yarısını keçir.
// Vaxt yoxdursa və ya yanlışdırsa null: belə dərslər saata daxil edilmir.
export const lessonDurationMinutes = (schedule) => {
  const start = parseTime(schedule?.startTime);
  const end = parseTime(schedule?.endTime);
  if (start === null || end === null || start === end) return null;
  return end > start ? end - start : end + 24 * 60 - start;
};

const toHours = (minutes) => Math.round(minutes / 6) / 10;

const percentChange = (current, previous) =>
  previous === 0 ? null : Math.round(((current - previous) / previous) * 100);

// Keçirilmiş dərslər əsasında öyrənmə saatı və aylıq dərs sayı.
// Hər Attendance sənədi (qrup + tarix) bir keçirilmiş dərsdir; müddəti qrupun schedule.startTime/endTime-dan gəlir.
// studentId verilərsə yalnız həmin tələbənin iştirak etdiyi (present/late) dərslər sayılır.
export const getLearningStats = async (match, { studentId, now } = {}) => {
  const months = getLast7Months(now);
  const lessonMatch = studentId
    ? { ...match, records: { $elemMatch: { student: studentId, status: { $in: ['present', 'late'] } } } }
    : match;

  const rows = await Attendance.aggregate([
    { $match: lessonMatch },
    {
      $group: {
        _id: { group: '$group', year: { $year: '$date' }, month: { $month: '$date' } },
        lessons: { $sum: 1 },
      },
    },
  ]);

  const groupIds = [...new Set(rows.map(({ _id }) => String(_id.group)))];
  const groups = await Group.find({ _id: { $in: groupIds } }, 'schedule.startTime schedule.endTime').lean();
  const durations = new Map(groups.map((g) => [String(g._id), lessonDurationMinutes(g.schedule)]));

  let totalMinutes = 0;
  const minutesByMonth = {};
  const lessonsByMonth = {};
  rows.forEach(({ _id, lessons }) => {
    const key = `${_id.year}-${_id.month}`;
    lessonsByMonth[key] = (lessonsByMonth[key] || 0) + lessons;
    const duration = durations.get(String(_id.group));
    if (!duration) return;
    totalMinutes += duration * lessons;
    minutesByMonth[key] = (minutesByMonth[key] || 0) + duration * lessons;
  });

  const current = minutesByMonth[months[months.length - 1].key] || 0;
  const previous = minutesByMonth[months[months.length - 2].key] || 0;

  return {
    learningHours: { total: toHours(totalMinutes), trend: percentChange(current, previous) },
    monthlyActivity: months.map(({ key, label }) => ({ month: label, value: lessonsByMonth[key] || 0 })),
  };
};

// Yeni yaradılan sənədlərin sayı: bu ay vs keçən ay (%). Keçən ay heç nə yoxdursa null (trend göstərilmir).
const monthOverMonth = async (Model, extraMatch = {}) => {
  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  const [current, previous] = await Promise.all([
    Model.countDocuments({ ...extraMatch, createdAt: { $gte: thisMonthStart } }),
    Model.countDocuments({ ...extraMatch, createdAt: { $gte: lastMonthStart, $lt: thisMonthStart } }),
  ]);

  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
};

// @desc    Get dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
export const getStats = async (req, res) => {
  try {
    const role = req.user.role;
    const userId = req.user._id;

    let dashboardData = {};

    if (role === 'admin') {
      const totalUsers    = await User.countDocuments();
      const activeUsers   = await User.countDocuments({ status: 'active' });
      const admins        = await User.countDocuments({ role: 'admin' });
      const teachers      = await User.countDocuments({ role: 'teacher' });
      const students      = await User.countDocuments({ role: 'student' });
      const totalCourses  = await Course.countDocuments();
      const totalGroups   = await Group.countDocuments();

      const [{ learningHours, monthlyActivity }, usersTrend, coursesTrend, groupsTrend] = await Promise.all([
        getLearningStats({}),
        monthOverMonth(User),
        monthOverMonth(Course),
        monthOverMonth(Group),
      ]);

      dashboardData = {
        users: { total: totalUsers, active: activeUsers, admins, teachers, students, trend: usersTrend },
        courses:      { total: totalCourses,  trend: coursesTrend },
        groups:       { total: totalGroups,   trend: groupsTrend },
        learningHours,
        monthlyActivity,
      };

    } else if (role === 'teacher') {
      const totalGroups = await Group.countDocuments({ teacher: userId });
      
      const teacherGroups = await Group.find({ teacher: userId }, 'students');
      const uniqueStudents = new Set();
      teacherGroups.forEach(g => {
        g.students.forEach(sId => uniqueStudents.add(sId.toString()));
      });
      const totalStudents = uniqueStudents.size;

      // Calculate avg attendance for teacher's groups
      const attendances = await Attendance.find({ teacher: userId });
      let totalRecords = 0;
      let presentRecords = 0;
      attendances.forEach(att => {
        att.records.forEach(rec => {
          totalRecords++;
          if (rec.status === 'present' || rec.status === 'late') {
            presentRecords++;
          }
        });
      });
      const avgAttendance = totalRecords === 0 ? 0 : Math.round((presentRecords / totalRecords) * 100);

      const { learningHours, monthlyActivity } = await getLearningStats({
        group: { $in: teacherGroups.map((g) => g._id) },
      });

      dashboardData = {
        groups: { total: totalGroups, trend: null },
        students: { total: totalStudents, trend: null },
        avgAttendance: { total: avgAttendance, trend: null },
        learningHours,
        monthlyActivity,
      };

    } else if (role === 'student') {
      const enrolledGroups = await Group.countDocuments({ students: userId });
      
      // Calculate student's personal attendance
      const studentAttendances = await Attendance.find({ 'records.student': userId });
      let totalRecords = 0;
      let presentRecords = 0;
      studentAttendances.forEach(att => {
        const myRecord = att.records.find(r => r.student.toString() === userId.toString());
        if (myRecord) {
          totalRecords++;
          if (myRecord.status === 'present' || myRecord.status === 'late') {
            presentRecords++;
          }
        }
      });
      const attendanceRate = totalRecords === 0 ? 0 : Math.round((presentRecords / totalRecords) * 100);

      const { learningHours, monthlyActivity } = await getLearningStats({}, { studentId: userId });

      dashboardData = {
        enrolledGroups: { total: enrolledGroups, trend: null },
        myAttendance: { total: attendanceRate, trend: null },
        learningHours,
        monthlyActivity,
      };
    }

    res.status(200).json({
      success: true,
      data: dashboardData,
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
    const notifications = await Notification.find({ recipient: req.user._id })
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
