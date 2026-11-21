import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import Quiz from '../models/Quiz.js';
import Group from '../models/Group.js';
import apiResponse from '../utils/apiResponse.js';
import {
  applyManualGrades,
  gradeAnswers,
  mergeQuestions,
  reviewAnswers,
  serializeReview,
  stripCorrectAnswers,
  summarizeReview,
} from '../utils/grading.js';
import { notifyGroupStudents, notifyStudents } from '../utils/notifyStudents.js';
import { buildGroupFilter, canManageGroup } from '../utils/groupAccess.js';

// Late network requests are still accepted this long after the time limit.
const SUBMIT_GRACE_MS = 2 * 60 * 1000;

const idOf = (value) => (value && value._id ? value._id : value)?.toString();

const findByStudent = (list, studentId) => (list || []).find((item) => idOf(item.student) === String(studentId));

// null when the quiz has no time limit
const quizEndsAt = (quiz, startedAt) => {
  const minutes = Number(quiz.timeLimit);
  return minutes > 0 ? new Date(new Date(startedAt).getTime() + minutes * 60 * 1000) : null;
};

// Student view: no correct answers, only own attempt, questions only once the timer has started.
const toStudentQuiz = (quiz, userId) => {
  const obj = typeof quiz.toObject === 'function' ? quiz.toObject() : quiz;
  const uid = userId.toString();
  const start = findByStudent(obj.starts, uid);
  obj.attempts = (obj.attempts || []).filter((a) => idOf(a.student) === uid);
  obj.questionCount = (obj.questions || []).length;
  obj.questions = start || obj.attempts.length ? stripCorrectAnswers(obj.questions) : [];
  obj.startedAt = start ? start.startedAt : null;
  delete obj.starts;
  return obj;
};

const buildAttemptReview = (quiz, attempt, includeCorrectAnswers) => {
  const items = reviewAnswers(quiz.questions, attempt.answers);
  return {
    student: attempt.student,
    earnedPoints: attempt.score,
    totalPoints: attempt.totalPoints,
    percent: attempt.totalPoints > 0 ? Math.round((attempt.score / attempt.totalPoints) * 100) : 0,
    submittedAt: attempt.completedAt,
    pendingCount: summarizeReview(items).pendingCount,
    answers: serializeReview(items, { includeCorrectAnswers }),
  };
};

// Admin, or the teacher of the quiz's group
const canManageQuiz = async (user, quiz) => {
  if (user.role === 'admin') return true;
  return canManageGroup(user, await Group.findById(idOf(quiz.group)).select('teacher'));
};

const rethrowAsBadRequest = (res, error) => {
  if (error instanceof mongoose.Error.ValidationError) {
    res.status(400);
    throw new Error(Object.values(error.errors).map((e) => e.message).join(', '));
  }
  throw error;
};

// @desc    Get all quizzes
// @route   GET /api/quizzes
// @access  Private
export const getQuizzes = asyncHandler(async (req, res) => {
  const isStudent = req.user.role === 'student';
  const filter = {};

  // Own groups only (teacher: taught, student: enrolled); groupId narrows, never widens
  const groupFilter = await buildGroupFilter(req.user, req.query.groupId);
  if (groupFilter !== undefined) filter.group = groupFilter;
  if (isStudent) filter.isActive = true;

  let query = Quiz.find(filter)
    .populate('group', 'name')
    .populate('teacher', 'name')
    .sort('-createdAt');
  if (!isStudent) query = query.populate('attempts.student', 'name email avatar');

  const quizzes = await query;
  const data = isStudent ? quizzes.map((q) => toStudentQuiz(q, req.user._id)) : quizzes;

  return apiResponse.success(res, 'Quizlər uğurla gətirildi', data);
});

// @desc    Get single quiz
// @route   GET /api/quizzes/:id
// @access  Private
export const getQuizById = asyncHandler(async (req, res) => {
  const isStudent = req.user.role === 'student';
  let query = Quiz.findById(req.params.id)
    .populate('group', 'name')
    .populate('teacher', 'name avatar');
  if (!isStudent) query = query.populate('attempts.student', 'name email avatar');

  const quiz = await query;

  if (!quiz) {
    res.status(404);
    throw new Error('Quiz tapılmadı');
  }

  if (isStudent) {
    const inGroup = await Group.exists({ _id: idOf(quiz.group), students: req.user._id });
    if (!inGroup || !quiz.isActive) {
      res.status(403);
      throw new Error('Bu quizi görmək icazəniz yoxdur');
    }
    return apiResponse.success(res, 'Quiz detalları uğurla gətirildi', toStudentQuiz(quiz, req.user._id));
  }

  if (!(await canManageQuiz(req.user, quiz))) {
    res.status(403);
    throw new Error('Bu quizi görmək icazəniz yoxdur');
  }

  return apiResponse.success(res, 'Quiz detalları uğurla gətirildi', quiz);
});

// @desc    Create new quiz
// @route   POST /api/quizzes
// @access  Private/Teacher,Admin
export const createQuiz = asyncHandler(async (req, res) => {
  const { title, description, group, questions, timeLimit } = req.body;

  const targetGroup = mongoose.isValidObjectId(group) ? await Group.findById(group) : null;
  if (!targetGroup) {
    res.status(404);
    throw new Error('Qrup tapılmadı');
  }

  if (!canManageGroup(req.user, targetGroup)) {
    res.status(403);
    throw new Error('Siz yalnız öz qruplarınıza quiz əlavə edə bilərsiniz');
  }

  let quiz;
  try {
    quiz = await Quiz.create({
      title,
      description,
      group,
      questions: mergeQuestions([], questions) || [],
      timeLimit: timeLimit || 30,
      teacher: req.user._id,
    });
  } catch (error) {
    rethrowAsBadRequest(res, error);
  }

  if (quiz.isActive) {
    await notifyGroupStudents(targetGroup._id, {
      sender: req.user._id,
      type: 'quiz',
      title: 'Yeni quiz',
      message: `"${quiz.title}" quizi əlavə edildi.`,
      link: '/quizzes',
    });
  }

  return apiResponse.success(res, 'Quiz uğurla yaradıldı', quiz, 201);
});

// @desc    Update quiz
// @route   PUT /api/quizzes/:id
// @access  Private/Teacher,Admin
export const updateQuiz = asyncHandler(async (req, res) => {
  const { title, description, group, questions, timeLimit, isActive } = req.body;

  const quiz = await Quiz.findById(req.params.id);

  if (!quiz) {
    res.status(404);
    throw new Error('Quiz tapılmadı');
  }

  if (!(await canManageQuiz(req.user, quiz))) {
    res.status(403);
    throw new Error('Bu quizi yeniləmək hüququnuz yoxdur');
  }

  if (group !== undefined && String(group) !== quiz.group.toString()) {
    const targetGroup = mongoose.isValidObjectId(group) ? await Group.findById(group) : null;
    if (!targetGroup) {
      res.status(404);
      throw new Error('Qrup tapılmadı');
    }
    if (!canManageGroup(req.user, targetGroup)) {
      res.status(403);
      throw new Error('Siz yalnız öz qruplarınıza quiz əlavə edə bilərsiniz');
    }
    quiz.group = targetGroup._id;
  }

  quiz.title = title || quiz.title;
  quiz.description = description || quiz.description;
  if (questions !== undefined) quiz.questions = mergeQuestions(quiz.questions, questions) || [];
  quiz.timeLimit = timeLimit || quiz.timeLimit;
  if (isActive !== undefined) quiz.isActive = isActive;

  let updatedQuiz;
  try {
    updatedQuiz = await quiz.save();
  } catch (error) {
    rethrowAsBadRequest(res, error);
  }
  return apiResponse.success(res, 'Quiz uğurla yeniləndi', updatedQuiz);
});

// @desc    Submit quiz attempt (Student)
// @route   POST /api/quizzes/:id/submit
// @access  Private/Student
export const submitQuiz = asyncHandler(async (req, res) => {
  const { answers } = req.body;
  const quiz = await Quiz.findById(req.params.id);

  if (!quiz) {
    res.status(404);
    throw new Error('Quiz tapılmadı');
  }

  const inGroup = await Group.exists({ _id: quiz.group, students: req.user._id });
  if (!inGroup || !quiz.isActive) {
    res.status(403);
    throw new Error('Bu quizə daxil olmaq icazəniz yoxdur');
  }

  if (findByStudent(quiz.attempts, req.user._id)) {
    res.status(400);
    throw new Error('Siz artıq bu quizi tamamlamısınız');
  }

  const start = findByStudent(quiz.starts, req.user._id);
  if (!start) {
    res.status(400);
    throw new Error('Quiz başlanmayıb');
  }
  const endsAt = quizEndsAt(quiz, start.startedAt);
  if (endsAt && Date.now() > endsAt.getTime() + SUBMIT_GRACE_MS) {
    res.status(400);
    throw new Error('Quiz vaxtı bitib');
  }

  const graded = gradeAnswers(quiz.questions, answers);
  const attempt = {
    student: req.user._id,
    answers: graded.answers,
    score: graded.score,
    totalPoints: graded.totalPoints,
    completedAt: new Date(),
  };

  // One attempt per student; atomic so a double click cannot create two.
  const update = await Quiz.updateOne(
    { _id: quiz._id, 'attempts.student': { $ne: req.user._id } },
    { $push: { attempts: attempt } }
  );

  if (update.modifiedCount === 0) {
    res.status(400);
    throw new Error('Siz artıq bu quizi tamamlamısınız');
  }

  return apiResponse.success(res, 'Quiz uğurla tamamlandı', attempt);
});

// @desc    Start the quiz timer (Student); repeated calls return the first start time
// @route   POST /api/quizzes/:id/start
// @access  Private/Student
export const startQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);

  if (!quiz) {
    res.status(404);
    throw new Error('Quiz tapılmadı');
  }

  const inGroup = await Group.exists({ _id: quiz.group, students: req.user._id });
  if (!inGroup || !quiz.isActive) {
    res.status(403);
    throw new Error('Bu quizə daxil olmaq icazəniz yoxdur');
  }

  if (findByStudent(quiz.attempts, req.user._id)) {
    res.status(400);
    throw new Error('Siz artıq bu quizi tamamlamısınız');
  }

  // Atomic, so two tabs cannot record two different start times.
  await Quiz.updateOne(
    { _id: quiz._id, 'starts.student': { $ne: req.user._id } },
    { $push: { starts: { student: req.user._id, startedAt: new Date() } } }
  );
  const { starts } = await Quiz.findById(quiz._id).select('starts').lean();
  const { startedAt } = findByStudent(starts, req.user._id);

  return apiResponse.success(res, 'Quiz başladı', {
    startedAt,
    endsAt: quizEndsAt(quiz, startedAt),
    serverNow: new Date(),
    timeLimit: quiz.timeLimit,
    questions: stripCorrectAnswers(quiz.toObject().questions),
  });
});

// @desc    One student's submitted answers (teacher/admin, or the student themself)
// @route   GET /api/quizzes/:id/attempts/:studentId
// @access  Private
export const getQuizAttempt = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id).populate('attempts.student', 'name email avatar');

  if (!quiz) {
    res.status(404);
    throw new Error('Quiz tapılmadı');
  }

  const isSelf = req.user.role === 'student' && req.params.studentId === req.user._id.toString();
  if (!isSelf && (req.user.role === 'student' || !(await canManageQuiz(req.user, quiz)))) {
    res.status(403);
    throw new Error('Bu cavablara baxmaq icazəniz yoxdur');
  }

  const attempt = findByStudent(quiz.attempts, req.params.studentId);
  if (!attempt) {
    res.status(404);
    throw new Error('Nəticə tapılmadı');
  }

  return apiResponse.success(res, 'Cavablar gətirildi', buildAttemptReview(quiz, attempt, !isSelf));
});

// @desc    Grade open-ended answers of an attempt and recompute its score
// @route   PUT /api/quizzes/:id/attempts/:studentId/grades
// @access  Private/Teacher,Admin
export const gradeQuizAttempt = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);

  if (!quiz) {
    res.status(404);
    throw new Error('Quiz tapılmadı');
  }

  if (!(await canManageQuiz(req.user, quiz))) {
    res.status(403);
    throw new Error('Bu quizi qiymətləndirmək hüququnuz yoxdur');
  }

  const attempt = findByStudent(quiz.attempts, req.params.studentId);
  if (!attempt) {
    res.status(404);
    throw new Error('Nəticə tapılmadı');
  }

  const graded = applyManualGrades(quiz.questions, attempt.answers, req.body.grades);
  if (graded.error) {
    res.status(400);
    throw new Error(graded.error);
  }

  attempt.score = Math.min(summarizeReview(graded.items).earnedPoints, attempt.totalPoints);
  await quiz.save({ validateModifiedOnly: true });

  if (graded.changed) {
    await notifyStudents([attempt.student], {
      sender: req.user._id,
      type: 'quiz',
      title: 'Quiz qiymətləndirildi',
      message: `"${quiz.title}" quizindəki cavablarınız yoxlanıldı. Nəticə: ${attempt.score}/${attempt.totalPoints}.`,
      link: '/quizzes',
      key: 'quizAnswersGraded',
      params: { title: quiz.title, score: attempt.score, total: attempt.totalPoints },
    });
  }

  await quiz.populate('attempts.student', 'name email avatar');
  const review = buildAttemptReview(quiz, findByStudent(quiz.attempts, req.params.studentId), true);
  return apiResponse.success(res, 'Cavablar qiymətləndirildi', review);
});

// @desc    Delete quiz
// @route   DELETE /api/quizzes/:id
// @access  Private/Teacher,Admin
export const deleteQuiz = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id);

  if (!quiz) {
    res.status(404);
    throw new Error('Quiz tapılmadı');
  }

  if (!(await canManageQuiz(req.user, quiz))) {
    res.status(403);
    throw new Error('Bu quizi silmək hüququnuz yoxdur');
  }

  await quiz.deleteOne();
  return apiResponse.success(res, 'Quiz uğurla silindi', null);
});
