import asyncHandler from 'express-async-handler';
import Classwork from '../models/Classwork.js';
import Group from '../models/Group.js';
import { apiResponse } from '../utils/apiResponse.js';

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

  res.status(200).json(apiResponse(classworks, 'Sinif işləri uğurla gətirildi'));
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

  res.status(200).json(apiResponse(classwork, 'Sinif işi detalları uğurla gətirildi'));
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

  res.status(201).json(apiResponse(createdClasswork, 'Sinif işi uğurla yaradıldı'));
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

  res.status(200).json(apiResponse(populated, 'Sinif işi uğurla yeniləndi'));
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

  res.status(200).json(apiResponse(null, 'Sinif işi uğurla silindi'));
});

// @desc    Submit classwork (Student)
// @route   POST /api/classworks/:id/submit
// @access  Private/Student
export const submitClasswork = asyncHandler(async (req, res) => {
  const { files } = req.body;
  const classworkId = req.params.id;

  const classwork = await Classwork.findById(classworkId);

  if (!classwork) {
    res.status(404);
    throw new Error('Sinif işi tapılmadı');
  }

  const existingSubmissionIndex = classwork.submissions.findIndex(
    sub => sub.student.toString() === req.user._id.toString()
  );

  if (existingSubmissionIndex !== -1) {
    classwork.submissions[existingSubmissionIndex].files = files || classwork.submissions[existingSubmissionIndex].files;
    classwork.submissions[existingSubmissionIndex].submittedAt = Date.now();
    classwork.submissions[existingSubmissionIndex].status = 'submitted';
  } else {
    classwork.submissions.push({
      student: req.user._id,
      files: files || [],
      submittedAt: Date.now(),
      status: 'submitted',
    });
  }

  await classwork.save();

  res.status(200).json(apiResponse(classwork, 'Sinif işi uğurla təhvil verildi'));
});

// @desc    Grade classwork submission (Teacher)
// @route   PUT /api/classworks/:id/grade
// @access  Private/Teacher,Admin
export const gradeClasswork = asyncHandler(async (req, res) => {
  const { studentId, grade, feedback } = req.body;
  const classworkId = req.params.id;

  const classwork = await Classwork.findById(classworkId);

  if (!classwork) {
    res.status(404);
    throw new Error('Sinif işi tapılmadı');
  }

  if (classwork.teacher.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Bu sinif işini qiymətləndirmək hüququnuz yoxdur');
  }

  const submissionIndex = classwork.submissions.findIndex(
    sub => sub.student.toString() === studentId
  );

  if (submissionIndex === -1) {
    res.status(404);
    throw new Error('Tələbənin təhvil verilmiş işi tapılmadı');
  }

  classwork.submissions[submissionIndex].grade = grade;
  classwork.submissions[submissionIndex].feedback = feedback;
  classwork.submissions[submissionIndex].status = 'graded';

  await classwork.save();

  res.status(200).json(apiResponse(classwork, 'Sinif işi uğurla qiymətləndirildi'));
});
