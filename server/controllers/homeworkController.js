import asyncHandler from 'express-async-handler';
import Homework from '../models/Homework.js';
import Group from '../models/Group.js';
import apiResponse from '../utils/apiResponse.js';
import { createNotification } from '../utils/notificationService.js';
import {
  buildGroupFilter,
  canManageGroup,
  canViewGroup,
  isGroupStudent,
} from '../utils/groupAccess.js';

const loadGroupOf = (homework) => Group.findById(homework.group?._id ?? homework.group);

const isOwnSubmission = (sub, user) =>
  !!sub.student && (sub.student._id ?? sub.student).toString() === user._id.toString();

// Students only ever see their own submission
const withVisibleSubmissions = (homework, user) => {
  const data = typeof homework.toObject === 'function' ? homework.toObject() : homework;
  if (user.role === 'student') {
    data.submissions = (data.submissions || []).filter((sub) => isOwnSubmission(sub, user));
  }
  return data;
};

const notifyStudents = async (studentIds, notification) => {
  try {
    await Promise.all(
      studentIds.map((recipient) => createNotification({ ...notification, recipient }))
    );
  } catch (error) {
    console.error('Bildiriş göndərilmədi:', error);
  }
};

// @desc    Get all homeworks
// @route   GET /api/homeworks
// @access  Private
export const getHomeworks = asyncHandler(async (req, res) => {
  const query = {};
  const groupFilter = await buildGroupFilter(req.user, req.query.groupId);
  if (groupFilter) query.group = groupFilter;

  const homeworks = await Homework.find(query)
    .populate('group', 'name')
    .populate('teacher', 'name')
    .populate('submissions.student', 'name surname avatar')
    .sort('-createdAt')
    .lean();

  const visible = homeworks.map((hw) => withVisibleSubmissions(hw, req.user));
  return apiResponse.success(res, 'Ev tapşırıqları uğurla gətirildi', visible);
});

// @desc    Get single homework
// @route   GET /api/homeworks/:id
// @access  Private
export const getHomeworkById = asyncHandler(async (req, res) => {
  const homework = await Homework.findById(req.params.id)
    .populate('group', 'name')
    .populate('teacher', 'name avatar')
    .populate('submissions.student', 'name surname email avatar');

  if (!homework) {
    res.status(404);
    throw new Error('Tapşırıq tapılmadı');
  }

  if (!canViewGroup(req.user, await loadGroupOf(homework))) {
    res.status(403);
    throw new Error('Bu tapşırığa baxmaq hüququnuz yoxdur');
  }

  return apiResponse.success(
    res,
    'Tapşırıq detalları uğurla gətirildi',
    withVisibleSubmissions(homework, req.user)
  );
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

  if (!canManageGroup(req.user, groupExists)) {
    res.status(403);
    throw new Error('Siz yalnız öz qruplarınız üçün tapşırıq yarada bilərsiniz');
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

  await notifyStudents(groupExists.students, {
    sender: req.user._id,
    type: 'homework',
    title: 'Yeni ev tapşırığı',
    message: `${groupExists.name} qrupu üçün yeni ev tapşırığı: "${homework.title}"`,
    link: '/homeworks',
  });

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

  if (!canManageGroup(req.user, await loadGroupOf(homework))) {
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

  if (!canManageGroup(req.user, await loadGroupOf(homework))) {
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
  const { files, links, note } = req.body;
  const homework = await Homework.findById(req.params.id);

  if (!homework) {
    res.status(404);
    throw new Error('Tapşırıq tapılmadı');
  }

  if (!isGroupStudent(req.user, await loadGroupOf(homework))) {
    res.status(403);
    throw new Error('Siz yalnız öz qrupunuzun tapşırığını təhvil verə bilərsiniz');
  }

  // Merge files + links into one array
  const allFiles = [
    ...(Array.isArray(files) ? files : []),
    ...(Array.isArray(links) ? links : []),
  ].filter(Boolean);

  const existingIndex = homework.submissions.findIndex(
    sub => sub.student.toString() === req.user._id.toString()
  );

  const status = new Date() > new Date(homework.dueDate) ? 'late' : 'submitted';

  if (existingIndex !== -1) {
    homework.submissions[existingIndex].files = allFiles.length ? allFiles : homework.submissions[existingIndex].files;
    homework.submissions[existingIndex].submittedAt = Date.now();
    homework.submissions[existingIndex].status = status;
    homework.submissions[existingIndex].note = note ?? homework.submissions[existingIndex].note;
  } else {
    homework.submissions.push({
      student: req.user._id,
      files: allFiles,
      submittedAt: Date.now(),
      status,
      note: note || '',
    });
  }

  await homework.save();
  return apiResponse.success(
    res,
    'Tapşırıq uğurla təhvil verildi',
    withVisibleSubmissions(homework, req.user)
  );
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

  if (!canManageGroup(req.user, await loadGroupOf(homework))) {
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

  await notifyStudents([homework.submissions[subIndex].student], {
    sender: req.user._id,
    type: 'homework',
    title: 'Tapşırığınız qiymətləndirildi',
    message: `"${homework.title}" tapşırığınız qiymətləndirildi: ${grade}`,
    link: '/homeworks',
  });

  return apiResponse.success(res, 'Tapşırıq uğurla qiymətləndirildi', homework);
});

// @desc    Remove homework submission (Student)
// @route   DELETE /api/homeworks/:id/submit
// @access  Private/Student
export const removeHomeworkSubmission = asyncHandler(async (req, res) => {
  const homework = await Homework.findById(req.params.id);

  if (!homework) {
    res.status(404);
    throw new Error('Tapşırıq tapılmadı');
  }

  if (!isGroupStudent(req.user, await loadGroupOf(homework))) {
    res.status(403);
    throw new Error('Siz yalnız öz qrupunuzun tapşırığını idarə edə bilərsiniz');
  }

  const existingIndex = homework.submissions.findIndex(
    sub => sub.student.toString() === req.user._id.toString() || sub.student._id?.toString() === req.user._id.toString()
  );

  if (existingIndex !== -1) {
    homework.submissions.splice(existingIndex, 1);
    await homework.save();
  }

  return apiResponse.success(
    res,
    'Tapşırıq göndərişi uğurla silindi',
    withVisibleSubmissions(homework, req.user)
  );
});
