import asyncHandler from 'express-async-handler';
import Exam from '../models/Exam.js';
import Group from '../models/Group.js';

// @desc    Get exams (filtered by group or teacher)
// @route   GET /api/exams
// @access  Private
export const getExams = asyncHandler(async (req, res) => {
  const { groupId, teacherId } = req.query;

  let query = {};

  if (req.user.role === 'student') {
    // Tələbə yalnız öz daxil olduğu qrupların imtahanlarını görə bilər
    const groups = await Group.find({ students: req.user._id }).select('_id');
    const groupIds = groups.map((g) => g._id);
    query.group = { $in: groupIds };
  } else if (req.user.role === 'teacher') {
    // Müəllim yalnız özünün təyin edildiyi imtahanları görə bilər (və ya öz qrupunun)
    query.teacher = req.user._id;
  }

  // İstəyə görə filterlər (əgər admin və ya müəllim axtarırsa)
  if (groupId && req.user.role !== 'student') {
    query.group = groupId;
  }
  if (teacherId && req.user.role === 'admin') {
    query.teacher = teacherId;
  }

  const exams = await Exam.find(query)
    .populate('group', 'name')
    .populate('teacher', 'name avatar')
    .sort({ date: 1 });

  // Tələbədirsə, yalnız öz nəticəsini qaytar
  if (req.user.role === 'student') {
    const examsForStudent = exams.map(exam => {
      const examObj = exam.toObject();
      examObj.results = examObj.results.filter(
        r => r.student.toString() === req.user._id.toString()
      );
      return examObj;
    });
    return res.status(200).json({
      success: true,
      data: examsForStudent,
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
  const exam = await Exam.findById(req.params.id)
    .populate('group', 'name students')
    .populate('teacher', 'name avatar')
    .populate('results.student', 'name email avatar');

  if (!exam) {
    res.status(404);
    throw new Error('İmtahan tapılmadı');
  }

  // Tələbədirsə, o qrupda olub-olmadığını yoxla və yalnız öz nəticəsini göstər
  if (req.user.role === 'student') {
    const isStudentInGroup = await Group.exists({
      _id: exam.group._id,
      students: req.user._id
    });

    if (!isStudentInGroup) {
      res.status(403);
      throw new Error('Bu imtahanı görmək icazəniz yoxdur');
    }

    const examObj = exam.toObject();
    examObj.results = examObj.results.filter(
      r => r.student._id.toString() === req.user._id.toString()
    );
    if (examObj.questions && examObj.questions.length > 0) {
      examObj.questions = examObj.questions.map(q => {
        const { correctAnswer, ...rest } = q;
        return rest;
      });
    }
    return res.status(200).json({
      success: true,
      data: examObj,
    });
  }

  // Müəllimdirsə, yalnız özünün təyin etdiyi imtahanları görə bilər (və ya admin)
  if (req.user.role === 'teacher' && exam.teacher._id.toString() !== req.user._id.toString()) {
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

  // Qrupu tap
  const targetGroup = await Group.findById(group);
  if (!targetGroup) {
    res.status(404);
    throw new Error('Qrup tapılmadı');
  }

  // Teacher validation
  if (req.user.role === 'teacher' && targetGroup.teacher.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Siz yalnız öz qruplarınıza imtahan əlavə edə bilərsiniz');
  }

  const exam = await Exam.create({
    title,
    description,
    group,
    teacher: req.user._id,
    date,
    duration,
    type,
    questions: questions || [],
    results: [],
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
  let exam = await Exam.findById(req.params.id);

  if (!exam) {
    res.status(404);
    throw new Error('İmtahan tapılmadı');
  }

  // Teacher validation
  if (req.user.role === 'teacher' && exam.teacher.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Bu imtahanı yeniləmək icazəniz yoxdur');
  }

  exam = await Exam.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

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

  // Teacher validation
  if (req.user.role === 'teacher' && exam.teacher.toString() !== req.user._id.toString()) {
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
  const { results } = req.body; // results should be an array of { student, score, feedback }

  const exam = await Exam.findById(req.params.id);

  if (!exam) {
    res.status(404);
    throw new Error('İmtahan tapılmadı');
  }

  if (req.user.role === 'teacher' && exam.teacher.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Bu imtahana nəticə əlavə etmək icazəniz yoxdur');
  }

  if (!Array.isArray(results)) {
    res.status(400);
    throw new Error('Nəticələr siyahı (array) formatında olmalıdır');
  }

  // Mövcud nəticələri tapıb yeniləmək, yoxdursa əlavə etmək
  results.forEach((newResult) => {
    const existingIndex = exam.results.findIndex(
      (r) => r.student.toString() === newResult.student
    );

    if (existingIndex !== -1) {
      exam.results[existingIndex].score = newResult.score;
      if (newResult.feedback) {
        exam.results[existingIndex].feedback = newResult.feedback;
      }
    } else {
      exam.results.push({
        student: newResult.student,
        score: newResult.score,
        feedback: newResult.feedback
      });
    }
  });

  await exam.save();

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

  const existingResult = exam.results.find(r => r.student.toString() === req.user._id.toString());
  if (existingResult) {
    res.status(400);
    throw new Error('Siz artıq bu imtahanı vermisiniz');
  }

  let totalScore = 0;
  let maxPossibleScore = 0;

  exam.questions.forEach((question) => {
    const pts = question.points || 1;
    maxPossibleScore += pts;
    
    if (question.type === 'multiple-choice' || question.type === 'true-false') {
      const studentAnswer = answers && answers[question._id.toString()];
      if (studentAnswer && studentAnswer === question.correctAnswer) {
        totalScore += pts;
      }
    }
  });

  const normalizedScore = maxPossibleScore > 0 
    ? Math.round((totalScore / maxPossibleScore) * 100) 
    : 0;

  exam.results.push({
    student: req.user._id,
    score: normalizedScore,
    feedback: ''
  });

  await exam.save();

  res.status(200).json({
    success: true,
    data: { score: normalizedScore }
  });
});
