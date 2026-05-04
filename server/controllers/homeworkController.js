import asyncHandler from 'express-async-handler';
import Homework from '../models/Homework.js';
import Group from '../models/Group.js';
import { apiResponse } from '../utils/apiResponse.js';

// @desc    Get all homeworks (teacher sees their own, student sees group's)
// @route   GET /api/homeworks
// @access  Private
export const getHomeworks = asyncHandler(async (req, res) => {
  let query = {};

  if (req.user.role === 'teacher') {
    query.teacher = req.user._id;
  } else if (req.user.role === 'student') {
    // Tələbənin qruplarını tapıb o qruplara aid tapşırıqları gətirmək olar.
    // Lakin hazırda qrupları Group modelindən tapmaq daha uyğundur.
    const groups = await Group.find({ students: req.user._id });
    const groupIds = groups.map(g => g._id);
    query.group = { $in: groupIds };
  }

  // Qrup filtri əgər query-də varsa (Məsələn, müəllim yalnız bir qrupun tapşırıqlarını görmək istəyir)
  if (req.query.groupId) {
    query.group = req.query.groupId;
  }

  const homeworks = await Homework.find(query)
    .populate('group', 'name')
    .populate('teacher', 'name')
    .sort('-createdAt');

  res.status(200).json(apiResponse(homeworks, 'Ev tapşırıqları uğurla gətirildi'));
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

  // Tələbə yalnız öz submission-ını görsün
  if (req.user.role === 'student') {
    const studentSubmission = homework.submissions.find(
      sub => sub.student._id.toString() === req.user._id.toString()
    );
    // Tam siyahını tələbəyə qaytarmırıq, yalnız ona aid olanı saxlayırıq və ya sadəcə öz submission-unu göndəririk
    // Hələlik bütün modeli, lakin filtrelenmiş submissonlar ilə qaytaraq
    homework.submissions = studentSubmission ? [studentSubmission] : [];
  }

  res.status(200).json(apiResponse(homework, 'Tapşırıq detalları uğurla gətirildi'));
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

  res.status(201).json(apiResponse(createdHomework, 'Ev tapşırığı uğurla yaradıldı'));
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

  // Yalnız yaradan müəllim və ya admin yeniləyə bilər
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

  res.status(200).json(apiResponse(populated, 'Tapşırıq uğurla yeniləndi'));
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

  res.status(200).json(apiResponse(null, 'Tapşırıq uğurla silindi'));
});

// @desc    Submit homework (Student)
// @route   POST /api/homeworks/:id/submit
// @access  Private/Student
export const submitHomework = asyncHandler(async (req, res) => {
  const { files } = req.body;
  const homeworkId = req.params.id;

  const homework = await Homework.findById(homeworkId);

  if (!homework) {
    res.status(404);
    throw new Error('Tapşırıq tapılmadı');
  }

  // Tələbənin artıq təhvil verib-vermədiyini yoxlayaq
  const existingSubmissionIndex = homework.submissions.findIndex(
    sub => sub.student.toString() === req.user._id.toString()
  );

  const status = new Date() > new Date(homework.dueDate) ? 'late' : 'submitted';

  if (existingSubmissionIndex !== -1) {
    // Yeniləmə
    homework.submissions[existingSubmissionIndex].files = files || homework.submissions[existingSubmissionIndex].files;
    homework.submissions[existingSubmissionIndex].submittedAt = Date.now();
    homework.submissions[existingSubmissionIndex].status = status;
  } else {
    // Yeni submission
    homework.submissions.push({
      student: req.user._id,
      files: files || [],
      submittedAt: Date.now(),
      status: status,
    });
  }

  await homework.save();

  res.status(200).json(apiResponse(homework, 'Tapşırıq uğurla təhvil verildi'));
});

// @desc    Grade homework submission (Teacher)
// @route   PUT /api/homeworks/:id/grade
// @access  Private/Teacher,Admin
export const gradeHomework = asyncHandler(async (req, res) => {
  const { studentId, grade, feedback } = req.body;
  const homeworkId = req.params.id;

  const homework = await Homework.findById(homeworkId);

  if (!homework) {
    res.status(404);
    throw new Error('Tapşırıq tapılmadı');
  }

  if (homework.teacher.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Bu tapşırığı qiymətləndirmək hüququnuz yoxdur');
  }

  const submissionIndex = homework.submissions.findIndex(
    sub => sub.student.toString() === studentId
  );

  if (submissionIndex === -1) {
    res.status(404);
    throw new Error('Tələbənin təhvil verilmiş tapşırığı tapılmadı');
  }

  homework.submissions[submissionIndex].grade = grade;
  homework.submissions[submissionIndex].feedback = feedback;
  homework.submissions[submissionIndex].status = 'graded';

  await homework.save();

  res.status(200).json(apiResponse(homework, 'Tapşırıq uğurla qiymətləndirildi'));
});
