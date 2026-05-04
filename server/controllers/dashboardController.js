import User from '../models/userModel.js';
// Digər modellər (Course, Group və s.) yaradıldıqdan sonra bura əlavə ediləcək

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

    // Mock data for models not yet implemented
    // Bunlar gələcək mərhələlərdə real dataya bağlanacaq
    const totalCourses = 42; 
    const totalGroups = 18;
    const learningHours = 2450;

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
    // Bu hissə üçün 'Activity' modeli yaradılana qədər mock data qaytarırıq
    const activities = [
      {
        id: 1,
        type: 'user_registered',
        message: 'Yeni tələbə qeydiyyatdan keçdi: Əli Məmmədov',
        time: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
      },
      {
        id: 2,
        type: 'course_added',
        message: 'Yeni kurs əlavə edildi: Frontend Development',
        time: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      },
      {
        id: 3,
        type: 'exam_completed',
        message: 'Riyaziyyat imtahanı nəticələri açıqlandı',
        time: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
      }
    ];

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
