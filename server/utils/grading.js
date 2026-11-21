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

// Returns { score, totalPoints, answers: [{ questionId, selectedOption, isCorrect }] }.
// isCorrect is null for open-ended questions; their points stay in totalPoints so the
// teacher decides on them.
export const gradeAnswers = (questions, rawAnswers) => {
  const answerMap = normalizeAnswers(rawAnswers);
  let score = 0;
  let totalPoints = 0;
  const graded = [];

  (questions || []).forEach((question) => {
    const points = Number(question.points) > 0 ? Number(question.points) : 1;
    totalPoints += points;
    const answer = answerMap.get(question._id.toString());
    const autoGraded = AUTO_GRADED_TYPES.includes(question.type);
    const isCorrect = autoGraded ? isAnswerCorrect(question, answer) : null;
    if (isCorrect) score += points;
    graded.push({
      questionId: question._id,
      selectedOption: answer ?? '',
      isCorrect,
    });
  });

  return { score, totalPoints, answers: graded };
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
