import asyncHandler from 'express-async-handler';
import Classwork from '../models/Classwork.js';
import Group from '../models/Group.js';
import apiResponse from '../utils/apiResponse.js';

// @desc    Get all classworks
// @route   GET /api/classworks
// @access  Private
export const getClassworks = asyncHandler(async (req, res) => {
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

  const classworks = await Classwork.find(query)
    .populate('group', 'name')
    .populate('teacher', 'name')
    .sort('-createdAt');

  return apiResponse.success(res, 'Sinif işləri uğurla gətirildi', classworks);
});

// @desc    Get single classwork
// @route   GET /api/classworks/:id
// @access  Private
export const getClassworkById = asyncHandler(async (req, res) => {
  const classwork = await Classwork.findById(req.params.id)
    .populate('group', 'name')
    .populate('teacher', 'name avatar')
    .populate('submissions.student', 'name email avatar');

  if (!classwork) {
    res.status(404);
    throw new Error('Sinif işi tapılmadı');
  }

  if (req.user.role === 'student') {
    const studentSubmission = classwork.submissions.find(
      sub => sub.student._id.toString() === req.user._id.toString()
    );
    classwork.submissions = studentSubmission ? [studentSubmission] : [];
  }

  return apiResponse.success(res, 'Sinif işi detalları uğurla gətirildi', classwork);
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

  if (classwork.teacher.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
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

  if (classwork.teacher.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
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
  return apiResponse.success(res, 'Sinif işi uğurla təhvil verildi', classwork);
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

  if (classwork.teacher.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
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
  return apiResponse.success(res, 'Sinif işi uğurla qiymətləndirildi', classwork);
});
