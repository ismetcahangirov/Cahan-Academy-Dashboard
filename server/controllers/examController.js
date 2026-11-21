import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import Exam from '../models/Exam.js';
import Group from '../models/Group.js';
import { gradeAnswers, mergeQuestions, stripCorrectAnswers } from '../utils/grading.js';
import { notifyGroupStudents, notifyStudents } from '../utils/notifyStudents.js';

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

const canManageExam = async (user, exam) => {
  if (user.role === 'admin') return true;
  if (user.role !== 'teacher') return false;
  if (idOf(exam.teacher) === user._id.toString()) return true;
  if (exam.group && exam.group.teacher) return idOf(exam.group.teacher) === user._id.toString();
  return Boolean(await Group.exists({ _id: idOf(exam.group), teacher: user._id }));
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
  const filters = [];

  if (req.user.role === 'student') {
    const groups = await Group.find({ students: req.user._id }).select('_id');
    filters.push({ group: { $in: groups.map((g) => g._id) } });
  } else if (req.user.role === 'teacher') {
    const groups = await Group.find({ teacher: req.user._id }).select('_id');
    filters.push({ $or: [{ teacher: req.user._id }, { group: { $in: groups.map((g) => g._id) } }] });
  }

  if (groupId && mongoose.isValidObjectId(groupId)) filters.push({ group: groupId });
  if (teacherId && req.user.role === 'admin' && mongoose.isValidObjectId(teacherId)) {
    filters.push({ teacher: teacherId });
  }

  const exams = await Exam.find(filters.length ? { $and: filters } : {})
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

  if (req.user.role === 'teacher' && targetGroup.teacher.toString() !== req.user._id.toString()) {
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
    if (req.user.role === 'teacher' && targetGroup.teacher.toString() !== req.user._id.toString()) {
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
  const normalizedScore = graded.totalPoints > 0
    ? Math.round((graded.score / graded.totalPoints) * 100)
    : 0;

  // Atomic guard against double submission (two tabs, double click).
  const update = await Exam.updateOne(
    { _id: exam._id, 'results.student': { $ne: req.user._id } },
    {
      $push: {
        results: {
          student: req.user._id,
          score: normalizedScore,
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

  res.status(200).json({
    success: true,
    data: {
      score: normalizedScore,
      correctPoints: graded.score,
      totalPoints: graded.totalPoints,
    }
  });
});
