import asyncHandler from 'express-async-handler';
import mongoose from 'mongoose';
import Quiz from '../models/Quiz.js';
import Group from '../models/Group.js';
import apiResponse from '../utils/apiResponse.js';
import { gradeAnswers, mergeQuestions, stripCorrectAnswers } from '../utils/grading.js';
import { notifyGroupStudents } from '../utils/notifyStudents.js';

const idOf = (value) => (value && value._id ? value._id : value)?.toString();

// Student view: no correct answers, only own attempt.
const toStudentQuiz = (quiz, userId) => {
  const obj = typeof quiz.toObject === 'function' ? quiz.toObject() : quiz;
  const uid = userId.toString();
  obj.questions = stripCorrectAnswers(obj.questions);
  obj.attempts = (obj.attempts || []).filter((a) => idOf(a.student) === uid);
  return obj;
};

const canManageQuiz = async (user, quiz) => {
  if (user.role === 'admin') return true;
  if (user.role !== 'teacher') return false;
  if (idOf(quiz.teacher) === user._id.toString()) return true;
  return Boolean(await Group.exists({ _id: idOf(quiz.group), teacher: user._id }));
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
  const filters = [];
  const isStudent = req.user.role === 'student';

  if (req.user.role === 'teacher') {
    const groups = await Group.find({ teacher: req.user._id }).select('_id');
    filters.push({ group: { $in: groups.map((g) => g._id) } });
  } else if (isStudent) {
    const groups = await Group.find({ students: req.user._id }).select('_id');
    filters.push({ group: { $in: groups.map((g) => g._id) } });
    filters.push({ isActive: true });
  }

  // Narrows the role restriction above, never widens it.
  if (req.query.groupId) {
    if (!mongoose.isValidObjectId(req.query.groupId)) {
      return apiResponse.success(res, 'Quizlər uğurla gətirildi', []);
    }
    filters.push({ group: req.query.groupId });
  }

  let query = Quiz.find(filters.length ? { $and: filters } : {})
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

  if (req.user.role === 'teacher' && targetGroup.teacher.toString() !== req.user._id.toString()) {
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
    if (req.user.role === 'teacher' && targetGroup.teacher.toString() !== req.user._id.toString()) {
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
