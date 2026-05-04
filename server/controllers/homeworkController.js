import asyncHandler from 'express-async-handler';
import Homework from '../models/Homework.js';
import Group from '../models/Group.js';
import apiResponse from '../utils/apiResponse.js';

// @desc    Get all homeworks
// @route   GET /api/homeworks
// @access  Private
export const getHomeworks = asyncHandler(async (req, res) => {
  let query = {};

  if (req.user.role === 'teacher') {
    query.teacher = req.user._id;
  } else if (req.user.role === 'student') {
    const groups = await Group.find({ students: req.user._id });
    const groupIds = groups.map(g => g._id);
    query.group = { $in: groupIds };
  }

  if (req.query.groupId) {
    query.group = req.query.groupId;
  }

  const homeworks = await Homework.find(query)
    .populate('group', 'name')
    .populate('teacher', 'name')
    .sort('-createdAt');

  return apiResponse.success(res, 'Ev tapşırıqları uğurla gətirildi', homeworks);
});

// @desc    Get single homework
// @route   GET /api/homeworks/:id
// @access  Private
export const getHomeworkById = asyncHandler(async (req, res) => {
  const homework = await Homework.findById(req.params.id)
    .populate('group', 'name')
    .populate('teacher', 'name avatar')
    .populate('submissions.student', 'name email avatar');

  if (!homework) {
    res.status(404);
    throw new Error('Tapşırıq tapılmadı');
  }

  if (req.user.role === 'student') {
    const studentSubmission = homework.submissions.find(
      sub => sub.student._id.toString() === req.user._id.toString()
    );
    homework.submissions = studentSubmission ? [studentSubmission] : [];
  }

  return apiResponse.success(res, 'Tapşırıq detalları uğurla gətirildi', homework);
});

// @desc    Create new homework
// @route   POST /api/homeworks
// @access  Private/Teacher,Admin
export const createHomework = asyncHandler(async (req, res) => {
  const { title, description, group, dueDate, files } = req.body;

  const groupExists = await Group.findById(group);
  if (!groupExists) {
    res.status(404);
    throw new Error('Qrup tapılmadı');
  }

  const homework = await Homework.create({
    title,
    description,
    group,
    dueDate,
    files: files || [],
    teacher: req.user._id,
  });

  const createdHomework = await Homework.findById(homework._id)
    .populate('group', 'name')
    .populate('teacher', 'name');

  return apiResponse.success(res, 'Ev tapşırığı uğurla yaradıldı', createdHomework, 201);
});

// @desc    Update homework
// @route   PUT /api/homeworks/:id
// @access  Private/Teacher,Admin
export const updateHomework = asyncHandler(async (req, res) => {
  const { title, description, dueDate, files } = req.body;

  let homework = await Homework.findById(req.params.id);

  if (!homework) {
    res.status(404);
    throw new Error('Tapşırıq tapılmadı');
  }

  if (homework.teacher.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Bu tapşırığı yeniləmək hüququnuz yoxdur');
  }

  homework.title = title || homework.title;
  homework.description = description || homework.description;
  homework.dueDate = dueDate || homework.dueDate;
  if (files) homework.files = files;

  const updatedHomework = await homework.save();
  const populated = await Homework.findById(updatedHomework._id)
    .populate('group', 'name')
    .populate('teacher', 'name');

  return apiResponse.success(res, 'Tapşırıq uğurla yeniləndi', populated);
});

// @desc    Delete homework
// @route   DELETE /api/homeworks/:id
// @access  Private/Teacher,Admin
export const deleteHomework = asyncHandler(async (req, res) => {
  const homework = await Homework.findById(req.params.id);

  if (!homework) {
    res.status(404);
    throw new Error('Tapşırıq tapılmadı');
  }

  if (homework.teacher.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Bu tapşırığı silmək hüququnuz yoxdur');
  }

  await homework.deleteOne();
  return apiResponse.success(res, 'Tapşırıq uğurla silindi', null);
});

// @desc    Submit homework (Student)
// @route   POST /api/homeworks/:id/submit
// @access  Private/Student
export const submitHomework = asyncHandler(async (req, res) => {
  const { files } = req.body;
  const homework = await Homework.findById(req.params.id);

  if (!homework) {
    res.status(404);
    throw new Error('Tapşırıq tapılmadı');
  }

  const existingIndex = homework.submissions.findIndex(
    sub => sub.student.toString() === req.user._id.toString()
  );

  const status = new Date() > new Date(homework.dueDate) ? 'late' : 'submitted';

  if (existingIndex !== -1) {
    homework.submissions[existingIndex].files = files || homework.submissions[existingIndex].files;
    homework.submissions[existingIndex].submittedAt = Date.now();
    homework.submissions[existingIndex].status = status;
  } else {
    homework.submissions.push({
      student: req.user._id,
      files: files || [],
      submittedAt: Date.now(),
      status,
    });
  }

  await homework.save();
  return apiResponse.success(res, 'Tapşırıq uğurla təhvil verildi', homework);
});

// @desc    Grade homework submission (Teacher)
// @route   PUT /api/homeworks/:id/grade
// @access  Private/Teacher,Admin
export const gradeHomework = asyncHandler(async (req, res) => {
  const { studentId, grade, feedback } = req.body;
  const homework = await Homework.findById(req.params.id);

  if (!homework) {
    res.status(404);
    throw new Error('Tapşırıq tapılmadı');
  }

  if (homework.teacher.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Bu tapşırığı qiymətləndirmək hüququnuz yoxdur');
  }

  const subIndex = homework.submissions.findIndex(
    sub => sub.student.toString() === studentId
  );

  if (subIndex === -1) {
    res.status(404);
    throw new Error('Tələbənin təhvil verilmiş tapşırığı tapılmadı');
  }

  homework.submissions[subIndex].grade = grade;
  homework.submissions[subIndex].feedback = feedback;
  homework.submissions[subIndex].status = 'graded';

  await homework.save();
  return apiResponse.success(res, 'Tapşırıq uğurla qiymətləndirildi', homework);
});
