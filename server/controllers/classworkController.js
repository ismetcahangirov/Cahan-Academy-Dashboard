import asyncHandler from 'express-async-handler';
import Classwork from '../models/Classwork.js';
import Group from '../models/Group.js';
import apiResponse from '../utils/apiResponse.js';
import { createNotification } from '../utils/notificationService.js';
import {
  buildGroupFilter,
  canManageGroup,
  canViewGroup,
  isGroupStudent,
} from '../utils/groupAccess.js';

const loadGroupOf = (classwork) => Group.findById(classwork.group?._id ?? classwork.group);

const isOwnSubmission = (sub, user) =>
  !!sub.student && (sub.student._id ?? sub.student).toString() === user._id.toString();

// Students only ever see their own submission
const withVisibleSubmissions = (classwork, user) => {
  const data = typeof classwork.toObject === 'function' ? classwork.toObject() : classwork;
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

// @desc    Get all classworks
// @route   GET /api/classworks
// @access  Private
export const getClassworks = asyncHandler(async (req, res) => {
  const query = {};
  const groupFilter = await buildGroupFilter(req.user, req.query.groupId);
  if (groupFilter) query.group = groupFilter;

  const classworks = await Classwork.find(query)
    .populate('group', 'name')
    .populate('teacher', 'name')
    .populate('submissions.student', 'name surname avatar')
    .sort('-createdAt')
    .lean();

  const visible = classworks.map((cw) => withVisibleSubmissions(cw, req.user));
  return apiResponse.success(res, 'Sinif işləri uğurla gətirildi', visible);
});

// @desc    Get single classwork
// @route   GET /api/classworks/:id
// @access  Private
export const getClassworkById = asyncHandler(async (req, res) => {
  const classwork = await Classwork.findById(req.params.id)
    .populate('group', 'name')
    .populate('teacher', 'name avatar')
    .populate('submissions.student', 'name surname email avatar');

  if (!classwork) {
    res.status(404);
    throw new Error('Sinif işi tapılmadı');
  }

  if (!canViewGroup(req.user, await loadGroupOf(classwork))) {
    res.status(403);
    throw new Error('Bu sinif işinə baxmaq hüququnuz yoxdur');
  }

  return apiResponse.success(
    res,
    'Sinif işi detalları uğurla gətirildi',
    withVisibleSubmissions(classwork, req.user)
  );
});

// @desc    Create new classwork
// @route   POST /api/classworks
// @access  Private/Teacher,Admin
export const createClasswork = asyncHandler(async (req, res) => {
  const { title, description, group, files } = req.body;

  const groupExists = await Group.findById(group);
  if (!groupExists) {
    res.status(404);
    throw new Error('Qrup tapılmadı');
  }

  if (!canManageGroup(req.user, groupExists)) {
    res.status(403);
    throw new Error('Siz yalnız öz qruplarınız üçün sinif işi yarada bilərsiniz');
  }

  const classwork = await Classwork.create({
    title,
    description,
    group,
    files: files || [],
    teacher: req.user._id,
  });

  const createdClasswork = await Classwork.findById(classwork._id)
    .populate('group', 'name')
    .populate('teacher', 'name');

  await notifyStudents(groupExists.students, {
    sender: req.user._id,
    type: 'classwork',
    title: 'Yeni sinif işi',
    message: `${groupExists.name} qrupu üçün yeni sinif işi: "${classwork.title}"`,
    link: '/classworks',
  });

  return apiResponse.success(res, 'Sinif işi uğurla yaradıldı', createdClasswork, 201);
});

// @desc    Update classwork
// @route   PUT /api/classworks/:id
// @access  Private/Teacher,Admin
export const updateClasswork = asyncHandler(async (req, res) => {
  const { title, description, files } = req.body;

  let classwork = await Classwork.findById(req.params.id);

  if (!classwork) {
    res.status(404);
    throw new Error('Sinif işi tapılmadı');
  }

  if (!canManageGroup(req.user, await loadGroupOf(classwork))) {
    res.status(403);
    throw new Error('Bu sinif işini yeniləmək hüququnuz yoxdur');
  }

  classwork.title = title || classwork.title;
  classwork.description = description || classwork.description;
  if (files) classwork.files = files;

  const updatedClasswork = await classwork.save();
  const populated = await Classwork.findById(updatedClasswork._id)
    .populate('group', 'name')
    .populate('teacher', 'name');

  return apiResponse.success(res, 'Sinif işi uğurla yeniləndi', populated);
});

// @desc    Delete classwork
// @route   DELETE /api/classworks/:id
// @access  Private/Teacher,Admin
export const deleteClasswork = asyncHandler(async (req, res) => {
  const classwork = await Classwork.findById(req.params.id);

  if (!classwork) {
    res.status(404);
    throw new Error('Sinif işi tapılmadı');
  }

  if (!canManageGroup(req.user, await loadGroupOf(classwork))) {
    res.status(403);
    throw new Error('Bu sinif işini silmək hüququnuz yoxdur');
  }

  await classwork.deleteOne();
  return apiResponse.success(res, 'Sinif işi uğurla silindi', null);
});

// @desc    Submit classwork (Student)
// @route   POST /api/classworks/:id/submit
// @access  Private/Student
export const submitClasswork = asyncHandler(async (req, res) => {
  const { files, links, note } = req.body;
  const classwork = await Classwork.findById(req.params.id);

  if (!classwork) {
    res.status(404);
    throw new Error('Sinif işi tapılmadı');
  }

  if (!isGroupStudent(req.user, await loadGroupOf(classwork))) {
    res.status(403);
    throw new Error('Siz yalnız öz qrupunuzun sinif işini təhvil verə bilərsiniz');
  }

  // Merge files + links into one array
  const allFiles = [
    ...(Array.isArray(files) ? files : []),
    ...(Array.isArray(links) ? links : []),
  ].filter(Boolean);

  const existingIndex = classwork.submissions.findIndex(
    sub => sub.student.toString() === req.user._id.toString()
  );

  if (existingIndex !== -1) {
    classwork.submissions[existingIndex].files = allFiles.length ? allFiles : classwork.submissions[existingIndex].files;
    classwork.submissions[existingIndex].submittedAt = Date.now();
    classwork.submissions[existingIndex].status = 'submitted';
    classwork.submissions[existingIndex].note = note ?? classwork.submissions[existingIndex].note;
  } else {
    classwork.submissions.push({
      student: req.user._id,
      files: allFiles,
      submittedAt: Date.now(),
      status: 'submitted',
      note: note || '',
    });
  }

  await classwork.save();
  return apiResponse.success(
    res,
    'Sinif işi uğurla təhvil verildi',
    withVisibleSubmissions(classwork, req.user)
  );
});

// @desc    Grade classwork submission (Teacher)
// @route   PUT /api/classworks/:id/grade
// @access  Private/Teacher,Admin
export const gradeClasswork = asyncHandler(async (req, res) => {
  const { studentId, grade, feedback } = req.body;
  const classwork = await Classwork.findById(req.params.id);

  if (!classwork) {
    res.status(404);
    throw new Error('Sinif işi tapılmadı');
  }

  if (!canManageGroup(req.user, await loadGroupOf(classwork))) {
    res.status(403);
    throw new Error('Bu sinif işini qiymətləndirmək hüququnuz yoxdur');
  }

  const subIndex = classwork.submissions.findIndex(
    sub => sub.student.toString() === studentId
  );

  if (subIndex === -1) {
    res.status(404);
    throw new Error('Tələbənin təhvil verilmiş işi tapılmadı');
  }

  classwork.submissions[subIndex].grade = grade;
  classwork.submissions[subIndex].feedback = feedback;
  classwork.submissions[subIndex].status = 'graded';

  await classwork.save();

  await notifyStudents([classwork.submissions[subIndex].student], {
    sender: req.user._id,
    type: 'classwork',
    title: 'Sinif işiniz qiymətləndirildi',
    message: `"${classwork.title}" sinif işiniz qiymətləndirildi: ${grade}`,
    link: '/classworks',
  });

  return apiResponse.success(res, 'Sinif işi uğurla qiymətləndirildi', classwork);
});

// @desc    Remove classwork submission (Student)
// @route   DELETE /api/classworks/:id/submit
// @access  Private/Student
export const removeClassworkSubmission = asyncHandler(async (req, res) => {
  const classwork = await Classwork.findById(req.params.id);

  if (!classwork) {
    res.status(404);
    throw new Error('Sinif işi tapılmadı');
  }

  if (!isGroupStudent(req.user, await loadGroupOf(classwork))) {
    res.status(403);
    throw new Error('Siz yalnız öz qrupunuzun sinif işini idarə edə bilərsiniz');
  }

  const existingIndex = classwork.submissions.findIndex(
    sub => sub.student.toString() === req.user._id.toString() || sub.student._id?.toString() === req.user._id.toString()
  );

  if (existingIndex !== -1) {
    classwork.submissions.splice(existingIndex, 1);
    await classwork.save();
  }

  return apiResponse.success(
    res,
    'Sinif işi göndərişi uğurla silindi',
    withVisibleSubmissions(classwork, req.user)
  );
});
