import asyncHandler from 'express-async-handler';
import Quiz from '../models/Quiz.js';
import Group from '../models/Group.js';
import apiResponse from '../utils/apiResponse.js';

// @desc    Get all quizzes
// @route   GET /api/quizzes
// @access  Private
export const getQuizzes = asyncHandler(async (req, res) => {
  let query = {};

  if (req.user.role === 'teacher') {
    query.teacher = req.user._id;
  } else if (req.user.role === 'student') {
    const groups = await Group.find({ students: req.user._id });
    const groupIds = groups.map(g => g._id);
    query.group = { $in: groupIds };
    query.isActive = true;
  }

  if (req.query.groupId) {
    query.group = req.query.groupId;
  }

  const quizzes = await Quiz.find(query)
    .populate('group', 'name')
    .populate('teacher', 'name')
    .select('-questions.correctAnswer')
    .sort('-createdAt');

  return apiResponse.success(res, 'Quizlər uğurla gətirildi', quizzes);
});

// @desc    Get single quiz
// @route   GET /api/quizzes/:id
// @access  Private
export const getQuizById = asyncHandler(async (req, res) => {
  const quiz = await Quiz.findById(req.params.id)
    .populate('group', 'name')
    .populate('teacher', 'name avatar');

  if (!quiz) {
    res.status(404);
    throw new Error('Quiz tapılmadı');
  }

  if (req.user.role === 'student') {
    const attempt = quiz.attempts.find(a => a.student.toString() === req.user._id.toString());
    if (!attempt) {
      const quizObj = quiz.toObject();
      quizObj.questions.forEach(q => delete q.correctAnswer);
      return apiResponse.success(res, 'Quiz detalları uğurla gətirildi', quizObj);
    }
  }

  return apiResponse.success(res, 'Quiz detalları uğurla gətirildi', quiz);
});

// @desc    Create new quiz
// @route   POST /api/quizzes
// @access  Private/Teacher,Admin
export const createQuiz = asyncHandler(async (req, res) => {
  const { title, description, group, questions, timeLimit } = req.body;

  const groupExists = await Group.findById(group);
  if (!groupExists) {
    res.status(404);
    throw new Error('Qrup tapılmadı');
  }

  const quiz = await Quiz.create({
    title,
    description,
    group,
    questions,
    timeLimit: timeLimit || 30,
    teacher: req.user._id,
  });

  return apiResponse.success(res, 'Quiz uğurla yaradıldı', quiz, 201);
});

// @desc    Update quiz
// @route   PUT /api/quizzes/:id
// @access  Private/Teacher,Admin
export const updateQuiz = asyncHandler(async (req, res) => {
  const { title, description, questions, timeLimit, isActive } = req.body;

  let quiz = await Quiz.findById(req.params.id);

  if (!quiz) {
    res.status(404);
    throw new Error('Quiz tapılmadı');
  }

  if (quiz.teacher.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Bu quizi yeniləmək hüququnuz yoxdur');
  }

  quiz.title = title || quiz.title;
  quiz.description = description || quiz.description;
  quiz.questions = questions || quiz.questions;
  quiz.timeLimit = timeLimit || quiz.timeLimit;
  if (isActive !== undefined) quiz.isActive = isActive;

  const updatedQuiz = await quiz.save();
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

  const existingAttempt = quiz.attempts.find(
    a => a.student.toString() === req.user._id.toString()
  );

  if (existingAttempt) {
    res.status(400);
    throw new Error('Siz artıq bu quizi tamamlamısınız');
  }

  let score = 0;
  let totalPoints = 0;
  const processedAnswers = [];

  quiz.questions.forEach(question => {
    const studentAnswer = answers.find(a => a.questionId === question._id.toString());
    const isCorrect = studentAnswer && studentAnswer.selectedOption === question.correctAnswer;

    if (isCorrect) score += question.points;
    totalPoints += question.points;

    processedAnswers.push({
      questionId: question._id,
      selectedOption: studentAnswer ? studentAnswer.selectedOption : -1,
      isCorrect,
    });
  });

  const attempt = {
    student: req.user._id,
    answers: processedAnswers,
    score,
    totalPoints,
    completedAt: Date.now(),
  };

  quiz.attempts.push(attempt);
  await quiz.save();

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

  if (quiz.teacher.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Bu quizi silmək hüququnuz yoxdur');
  }

  await quiz.deleteOne();
  return apiResponse.success(res, 'Quiz uğurla silindi', null);
});
