// Shared answer contract for exams and quizzes.
// Client sends `answers` either as { [questionId]: value } or as
// [{ questionId, selectedOption }]. Values are compared as strings:
// multiple-choice -> option index ('0', '1', ...), true-false -> 'true' / 'false',
// open-ended -> free text (stored, not auto-graded).

export const AUTO_GRADED_TYPES = ['multiple-choice', 'true-false'];

export const normalizeValue = (value) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'boolean' || typeof value === 'number') return String(value);
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (trimmed === '' || trimmed === 'undefined' || trimmed === 'null') return undefined;
  return trimmed;
};

export const normalizeAnswers = (answers) => {
  const map = new Map();
  if (Array.isArray(answers)) {
    answers.forEach((a) => {
      if (!a || !a.questionId) return;
      const value = normalizeValue(a.selectedOption ?? a.answer);
      if (value !== undefined) map.set(String(a.questionId), value);
    });
  } else if (answers && typeof answers === 'object') {
    Object.entries(answers).forEach(([questionId, raw]) => {
      const value = normalizeValue(raw);
      if (value !== undefined) map.set(String(questionId), value);
    });
  }
  return map;
};

export const isAnswerCorrect = (question, answer) => {
  const correct = normalizeValue(question.correctAnswer);
  if (answer === undefined || correct === undefined) return false;
  if (question.type === 'true-false') return answer.toLowerCase() === correct.toLowerCase();
  return answer === correct;
};

export const questionPoints = (question) => (Number(question.points) > 0 ? Number(question.points) : 1);

// Returns { score, totalPoints, answers: [{ questionId, selectedOption, isCorrect, awardedPoints }] }.
// isCorrect and awardedPoints are null for open-ended questions; their points stay in
// totalPoints so the teacher decides on them.
export const gradeAnswers = (questions, rawAnswers) => {
  const answerMap = normalizeAnswers(rawAnswers);
  let score = 0;
  let totalPoints = 0;
  const graded = [];

  (questions || []).forEach((question) => {
    const points = questionPoints(question);
    totalPoints += points;
    const answer = answerMap.get(question._id.toString());
    const autoGraded = AUTO_GRADED_TYPES.includes(question.type);
    const isCorrect = autoGraded ? isAnswerCorrect(question, answer) : null;
    if (isCorrect) score += points;
    graded.push({
      questionId: question._id,
      selectedOption: answer ?? '',
      isCorrect,
      awardedPoints: autoGraded ? (isCorrect ? points : 0) : null,
    });
  });

  return { score, totalPoints, answers: graded };
};

// Auto-graded answers stored before awardedPoints existed fall back to isCorrect;
// open-ended answers stay null until the teacher grades them.
export const awardedPointsFor = (question, answer) => {
  if (Number.isFinite(answer.awardedPoints)) return answer.awardedPoints;
  if (!AUTO_GRADED_TYPES.includes(question.type)) return null;
  return answer.isCorrect ? questionPoints(question) : 0;
};

// Stored answers joined with their questions; answers to deleted questions are dropped.
export const reviewAnswers = (questions, answers) => {
  const byId = new Map((questions || []).map((q) => [q._id.toString(), q]));
  return (answers || []).flatMap((answer) => {
    const question = byId.get(String(answer.questionId));
    return question ? [{ question, answer, awarded: awardedPointsFor(question, answer) }] : [];
  });
};

export const summarizeReview = (items) => ({
  earnedPoints: items.reduce((sum, item) => sum + (item.awarded || 0), 0),
  totalPoints: items.reduce((sum, item) => sum + questionPoints(item.question), 0),
  pendingCount: items.filter((item) => item.awarded === null).length,
});

export const serializeReview = (items, { includeCorrectAnswers }) => items.map(({ question, answer, awarded }) => ({
  questionId: question._id,
  text: question.text,
  type: question.type,
  options: question.options || [],
  points: questionPoints(question),
  ...(includeCorrectAnswers ? { correctAnswer: question.correctAnswer ?? '' } : {}),
  answer: answer.selectedOption ?? '',
  isCorrect: answer.isCorrect ?? null,
  awardedPoints: awarded,
  autoGraded: AUTO_GRADED_TYPES.includes(question.type),
}));

// Accepts [{ questionId, points }] or { [questionId]: points }.
const normalizeGrades = (grades) => {
  const entries = Array.isArray(grades)
    ? grades.filter((g) => g && g.questionId).map((g) => [String(g.questionId), g.points])
    : Object.entries(grades && typeof grades === 'object' ? grades : {});
  return new Map(entries);
};

// Validates teacher points for open-ended answers and writes them to the answer subdocuments.
// Auto-graded points are frozen as they are and cannot be changed here.
// Returns { error } or { changed, items }.
export const applyManualGrades = (questions, answers, rawGrades) => {
  const grades = normalizeGrades(rawGrades);
  if (grades.size === 0) return { error: 'Qiymətləndiriləcək cavab göndərilməyib' };

  const items = reviewAnswers(questions, answers);
  const byQuestion = new Map(items.map((item) => [String(item.answer.questionId), item]));
  for (const [questionId, raw] of grades) {
    const item = byQuestion.get(questionId);
    if (!item || AUTO_GRADED_TYPES.includes(item.question.type)) {
      return { error: 'Yalnız açıq sualların balı əl ilə verilir' };
    }
    const max = questionPoints(item.question);
    const points = typeof raw === 'number' || (typeof raw === 'string' && raw.trim() !== '') ? Number(raw) : NaN;
    if (!Number.isFinite(points) || points < 0 || points > max) {
      return { error: `Bal 0 ilə ${max} arasında olmalıdır` };
    }
  }

  let changed = false;
  items.forEach((item) => {
    const key = String(item.answer.questionId);
    const next = grades.has(key) ? Number(grades.get(key)) : item.awarded;
    if (grades.has(key) && next !== item.awarded) changed = true;
    if (next !== null) item.answer.awardedPoints = next;
  });

  return { changed, items: reviewAnswers(questions, answers) };
};

// Merges incoming question edits with stored ones so a missing / "undefined"
// correctAnswer never wipes the stored one. Keeps _id so attempts stay linked.
export const mergeQuestions = (existing, incoming) => {
  if (!Array.isArray(incoming)) return undefined;
  const byId = new Map((existing || []).map((q) => [q._id.toString(), q]));
  return incoming.map((q) => {
    const previous = q && q._id ? byId.get(String(q._id)) : undefined;
    const merged = {
      text: q.text,
      type: q.type,
      options: Array.isArray(q.options) ? q.options : [],
      points: Number(q.points) > 0 ? Number(q.points) : 1,
    };
    if (previous) merged._id = previous._id;
    const correct = normalizeValue(q.correctAnswer);
    if (correct !== undefined) {
      merged.correctAnswer = correct;
    } else if (previous && normalizeValue(previous.correctAnswer) !== undefined
      && previous.type === q.type) {
      merged.correctAnswer = previous.correctAnswer;
    } else {
      merged.correctAnswer = '';
    }
    return merged;
  });
};

export const stripCorrectAnswers = (questions) =>
  (questions || []).map((q) => {
    const { correctAnswer: _omit, ...rest } = q;
    return rest;
  });
