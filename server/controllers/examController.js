import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import Exam from '../models/Exam.js';
import Group from '../models/Group.js';
import {
  applyManualGrades,
  gradeAnswers,
  mergeQuestions,
  reviewAnswers,
  serializeReview,
  stripCorrectAnswers,
  summarizeReview,
} from '../utils/grading.js';
import { notifyGroupStudents, notifyGroupTeacher, notifyStudents } from '../utils/notifyStudents.js';
import { buildGroupFilter, canManageGroup } from '../utils/groupAccess.js';

// Late network requests are still accepted this long after the exam ends.
const SUBMIT_GRACE_MS = 2 * 60 * 1000;

const idOf = (value) => (value && value._id ? value._id : value)?.toString();

const getExamWindow = (exam) => {
  const start = new Date(exam.date).getTime();
  return { start, end: start + (Number(exam.duration) || 0) * 60 * 1000 };
};

// Student view: only own result, no correct answers, no questions before the start time.
const toStudentExam = (exam, userId, now = Date.now()) => {
  const obj = typeof exam.toObject === 'function' ? exam.toObject() : exam;
  const uid = userId.toString();
  obj.results = (obj.results || []).filter((r) => idOf(r.student) === uid);
  const questions = obj.questions || [];
  obj.questionCount = questions.length;
  obj.questions = getExamWindow(obj).start <= now ? stripCorrectAnswers(questions) : [];
  if (obj.group && typeof obj.group === 'object') delete obj.group.students;
  return obj;
};

// score stays 0-100; earnedPoints / totalPoints are the raw points behind it
// (derived from the answers for results stored before those fields existed).
const toPercent = (earned, total) => (total > 0 ? Math.min(100, Math.max(0, Math.round((earned / total) * 100))) : 0);

const buildResultReview = (exam, result, includeCorrectAnswers) => {
  const items = reviewAnswers(exam.questions, result.answers);
  const summary = summarizeReview(items);
  return {
    student: result.student,
    earnedPoints: result.earnedPoints ?? summary.earnedPoints,
    totalPoints: result.totalPoints ?? summary.totalPoints,
    percent: result.score,
    feedback: result.feedback || '',
    submittedAt: result.createdAt,
    pendingCount: summary.pendingCount,
    answers: serializeReview(items, { includeCorrectAnswers }),
  };
};

const findResult = (exam, studentId) => exam.results.find((r) => idOf(r.student) === String(studentId));

// Admin, or the teacher of the exam's group
const canManageExam = async (user, exam) => {
  if (user.role === 'admin') return true;
  const group = exam.group?.teacher ? exam.group : await Group.findById(idOf(exam.group)).select('teacher');
  return canManageGroup(user, group);
};

const rethrowAsBadRequest = (res, error) => {
  if (error instanceof mongoose.Error.ValidationError) {
    res.status(400);
    throw new Error(Object.values(error.errors).map((e) => e.message).join(', '));
  }
  throw error;
};

// @desc    Get exams (filtered by group or teacher)
// @route   GET /api/exams
// @access  Private
export const getExams = asyncHandler(async (req, res) => {
  const { groupId, teacherId } = req.query;
  const query = {};

  // Own groups only; groupId can narrow but never widen that
  const groupFilter = await buildGroupFilter(req.user, groupId);
  if (groupFilter !== undefined) query.group = groupFilter;
  if (teacherId && req.user.role === 'admin' && mongoose.isValidObjectId(teacherId)) {
    query.teacher = teacherId;
  }

  const exams = await Exam.find(query)
    .populate('group', 'name')
    .populate('teacher', 'name avatar')
    .sort({ date: 1 });

  if (req.user.role === 'student') {
    const now = Date.now();
    return res.status(200).json({
      success: true,
      data: exams.map((exam) => toStudentExam(exam, req.user._id, now)),
    });
  }

  res.status(200).json({
    success: true,
    count: exams.length,
    data: exams,
  });
});

// @desc    Get single exam
// @route   GET /api/exams/:id
// @access  Private
export const getExamById = asyncHandler(async (req, res) => {
  const isStudent = req.user.role === 'student';
  const exam = await Exam.findById(req.params.id)
    .populate(isStudent
      ? { path: 'group', select: 'name' }
      : { path: 'group', select: 'name teacher students', populate: { path: 'students', select: 'name email avatar' } })
    .populate('teacher', 'name avatar')
    .populate('results.student', 'name email avatar');

  if (!exam) {
    res.status(404);
    throw new Error('İmtahan tapılmadı');
  }

  if (isStudent) {
    const isStudentInGroup = await Group.exists({
      _id: idOf(exam.group),
      students: req.user._id
    });

    if (!isStudentInGroup) {
      res.status(403);
      throw new Error('Bu imtahanı görmək icazəniz yoxdur');
    }

    return res.status(200).json({
      success: true,
      data: toStudentExam(exam, req.user._id),
    });
  }

  if (!(await canManageExam(req.user, exam))) {
    res.status(403);
    throw new Error('Bu imtahanı görmək icazəniz yoxdur');
  }

  res.status(200).json({
    success: true,
    data: exam,
  });
});

// @desc    Create exam
// @route   POST /api/exams
// @access  Private/Teacher, Admin
export const createExam = asyncHandler(async (req, res) => {
  const { title, description, group, date, duration, type, questions } = req.body;

  const targetGroup = mongoose.isValidObjectId(group) ? await Group.findById(group) : null;
  if (!targetGroup) {
    res.status(404);
    throw new Error('Qrup tapılmadı');
  }

  if (!canManageGroup(req.user, targetGroup)) {
    res.status(403);
    throw new Error('Siz yalnız öz qruplarınıza imtahan əlavə edə bilərsiniz');
  }

  let exam;
  try {
    exam = await Exam.create({
      title,
      description,
      group,
      teacher: req.user._id,
      date,
      duration,
      type,
      questions: mergeQuestions([], questions) || [],
      results: [],
    });
  } catch (error) {
    rethrowAsBadRequest(res, error);
  }

  await notifyGroupStudents(targetGroup._id, {
    sender: req.user._id,
    type: 'other',
    title: 'Yeni imtahan',
    message: `"${exam.title}" imtahanı ${new Date(exam.date).toLocaleString('az-AZ', { timeZone: 'Asia/Baku' })} tarixinə təyin edildi.`,
    link: '/exams',
  });

  res.status(201).json({
    success: true,
    data: exam,
  });
});

// @desc    Update exam
// @route   PUT /api/exams/:id
// @access  Private/Teacher, Admin
export const updateExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);

  if (!exam) {
    res.status(404);
    throw new Error('İmtahan tapılmadı');
  }

  if (!(await canManageExam(req.user, exam))) {
    res.status(403);
    throw new Error('Bu imtahanı yeniləmək icazəniz yoxdur');
  }

  const { title, description, group, date, duration, type, questions } = req.body;

  if (group !== undefined && String(group) !== exam.group.toString()) {
    const targetGroup = mongoose.isValidObjectId(group) ? await Group.findById(group) : null;
    if (!targetGroup) {
      res.status(404);
      throw new Error('Qrup tapılmadı');
    }
    if (!canManageGroup(req.user, targetGroup)) {
      res.status(403);
      throw new Error('Siz yalnız öz qruplarınıza imtahan əlavə edə bilərsiniz');
    }
    exam.group = targetGroup._id;
  }

  if (title !== undefined) exam.title = title;
  if (description !== undefined) exam.description = description;
  if (date !== undefined) exam.date = date;
  if (duration !== undefined) exam.duration = duration;
  if (type !== undefined) exam.type = type;
  if (questions !== undefined) exam.questions = mergeQuestions(exam.questions, questions) || [];

  try {
    await exam.save();
  } catch (error) {
    rethrowAsBadRequest(res, error);
  }

  res.status(200).json({
    success: true,
    data: exam,
  });
});

// @desc    Delete exam
// @route   DELETE /api/exams/:id
// @access  Private/Teacher, Admin
export const deleteExam = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);

  if (!exam) {
    res.status(404);
    throw new Error('İmtahan tapılmadı');
  }

  if (!(await canManageExam(req.user, exam))) {
    res.status(403);
    throw new Error('Bu imtahanı silmək icazəniz yoxdur');
  }

  await exam.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Add or update exam results for students
// @route   POST /api/exams/:id/results
// @access  Private/Teacher, Admin
export const addExamResults = asyncHandler(async (req, res) => {
  const { results } = req.body; // [{ student, score, feedback }]

  const exam = await Exam.findById(req.params.id);

  if (!exam) {
    res.status(404);
    throw new Error('İmtahan tapılmadı');
  }

  if (!(await canManageExam(req.user, exam))) {
    res.status(403);
    throw new Error('Bu imtahana nəticə əlavə etmək icazəniz yoxdur');
  }

  if (!Array.isArray(results)) {
    res.status(400);
    throw new Error('Nəticələr siyahı (array) formatında olmalıdır');
  }

  const group = await Group.findById(exam.group).select('students');
  const groupStudents = new Set((group?.students || []).map((id) => id.toString()));

  for (const entry of results) {
    if (!entry || !groupStudents.has(String(entry.student))) {
      res.status(400);
      throw new Error('Tələbə bu imtahanın qrupunda deyil');
    }
    const score = Number(entry.score);
    if (entry.score === '' || entry.score === null || !Number.isFinite(score) || score < 0 || score > 100) {
      res.status(400);
      throw new Error('Bal 0 ilə 100 arasında olmalıdır');
    }
  }

  const changedStudents = [];
  results.forEach((newResult) => {
    const studentId = String(newResult.student);
    const score = Number(newResult.score);
    const existing = exam.results.find((r) => r.student.toString() === studentId);

    if (existing) {
      const feedbackChanged = newResult.feedback !== undefined && existing.feedback !== newResult.feedback;
      if (existing.score !== score || feedbackChanged) changedStudents.push(studentId);
      existing.score = score;
      if (newResult.feedback !== undefined) existing.feedback = newResult.feedback;
    } else {
      changedStudents.push(studentId);
      exam.results.push({
        student: studentId,
        score,
        feedback: newResult.feedback
      });
    }
  });

  await exam.save();

  await notifyStudents(changedStudents, {
    sender: req.user._id,
    type: 'other',
    title: 'İmtahan nəticəsi',
    message: `"${exam.title}" imtahanının nəticəsi açıqlandı.`,
    link: '/exams',
    key: 'examResultPublished',
    params: { title: exam.title },
  });

  res.status(200).json({
    success: true,
    data: exam,
  });
});

// @desc    Submit exam answers (Student)
// @route   POST /api/exams/:id/submit
// @access  Private/Student
export const submitStudentExam = asyncHandler(async (req, res) => {
  const { answers } = req.body;
  const exam = await Exam.findById(req.params.id);

  if (!exam) {
    res.status(404);
    throw new Error('İmtahan tapılmadı');
  }

  const isStudentInGroup = await Group.exists({
    _id: exam.group,
    students: req.user._id
  });

  if (!isStudentInGroup) {
    res.status(403);
    throw new Error('Bu imtahana daxil olmaq icazəniz yoxdur');
  }

  if (!exam.questions || exam.questions.length === 0) {
    res.status(400);
    throw new Error('Bu imtahan onlayn keçirilmir');
  }

  const now = Date.now();
  const { start, end } = getExamWindow(exam);
  if (now < start) {
    res.status(400);
    throw new Error('İmtahan hələ başlamayıb');
  }
  if (now > end + SUBMIT_GRACE_MS) {
    res.status(400);
    throw new Error('İmtahan vaxtı bitib');
  }

  const graded = gradeAnswers(exam.questions, answers);
  const normalizedScore = toPercent(graded.score, graded.totalPoints);

  // Atomic guard against double submission (two tabs, double click).
  const update = await Exam.updateOne(
    { _id: exam._id, 'results.student': { $ne: req.user._id } },
    {
      $push: {
        results: {
          student: req.user._id,
          score: normalizedScore,
          earnedPoints: graded.score,
          totalPoints: graded.totalPoints,
          feedback: '',
          answers: graded.answers,
        },
      },
    }
  );

  if (update.modifiedCount === 0) {
    res.status(400);
    throw new Error('Siz artıq bu imtahanı vermisiniz');
  }

  await notifyGroupTeacher(exam.group, {
    sender: req.user._id,
    type: 'other',
    title: 'İmtahan təhvil verildi',
    message: `${req.user.name} "${exam.title}" imtahanını təhvil verdi`,
    link: '/exams',
    key: 'examSubmitted',
    params: { student: req.user.name, title: exam.title },
  });

  res.status(200).json({
    success: true,
    data: {
      score: normalizedScore,
      correctPoints: graded.score,
      totalPoints: graded.totalPoints,
    }
  });
});

// @desc    One student's submitted answers (teacher/admin, or the student after the exam ends)
// @route   GET /api/exams/:id/results/:studentId
// @access  Private
export const getExamResultAnswers = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id).populate('results.student', 'name email avatar');

  if (!exam) {
    res.status(404);
    throw new Error('İmtahan tapılmadı');
  }

  const isSelf = req.user.role === 'student' && req.params.studentId === req.user._id.toString();
  if (!isSelf && (req.user.role === 'student' || !(await canManageExam(req.user, exam)))) {
    res.status(403);
    throw new Error('Bu cavablara baxmaq icazəniz yoxdur');
  }

  const result = findResult(exam, req.params.studentId);
  if (!result) {
    res.status(404);
    throw new Error('Nəticə tapılmadı');
  }

  // Classmates may still be writing until the window (and its grace period) closes.
  if (isSelf && Date.now() <= getExamWindow(exam).end + SUBMIT_GRACE_MS) {
    res.status(403);
    throw new Error('Cavablarınız imtahan bitdikdən sonra görünəcək');
  }

  res.status(200).json({
    success: true,
    data: buildResultReview(exam, result, !isSelf),
  });
});

// @desc    Grade open-ended answers of a result and recompute its score
// @route   PUT /api/exams/:id/results/:studentId/grades
// @access  Private/Teacher, Admin
export const gradeExamResult = asyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);

  if (!exam) {
    res.status(404);
    throw new Error('İmtahan tapılmadı');
  }

  if (!(await canManageExam(req.user, exam))) {
    res.status(403);
    throw new Error('Bu imtahanı qiymətləndirmək icazəniz yoxdur');
  }

  const result = findResult(exam, req.params.studentId);
  if (!result) {
    res.status(404);
    throw new Error('Nəticə tapılmadı');
  }

  const graded = applyManualGrades(exam.questions, result.answers, req.body.grades);
  if (graded.error) {
    res.status(400);
    throw new Error(graded.error);
  }

  const summary = summarizeReview(graded.items);
  const totalPoints = result.totalPoints ?? summary.totalPoints;
  result.totalPoints = totalPoints;
  result.earnedPoints = Math.min(summary.earnedPoints, totalPoints);
  result.score = toPercent(result.earnedPoints, totalPoints);
  await exam.save({ validateModifiedOnly: true });

  if (graded.changed) {
    await notifyStudents([result.student], {
      sender: req.user._id,
      type: 'other',
      title: 'İmtahan nəticəsi yeniləndi',
      message: `"${exam.title}" imtahanındakı cavablarınız yoxlanıldı. Nəticə: ${result.score}/100.`,
      link: '/exams',
      key: 'examAnswersGraded',
      params: { title: exam.title, score: result.score },
    });
  }

  await exam.populate('results.student', 'name email avatar');
  res.status(200).json({
    success: true,
    data: buildResultReview(exam, findResult(exam, req.params.studentId), true),
  });
});
