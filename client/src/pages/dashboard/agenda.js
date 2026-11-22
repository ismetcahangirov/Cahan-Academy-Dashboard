// Today's lessons from the schedule list.
// Schedule.dayOfWeek: 0 = Monday … 6 = Sunday; one-off lessons match by their specificDate (local day).
const toMinutes = (hhmm = '') => {
  const [h, m] = String(hhmm).split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export const lessonsForDay = (schedule = [], now = new Date()) => {
  const dayIdx = (now.getDay() + 6) % 7;
  return schedule
    .filter((s) =>
      s.repetitionType === 'once' && s.specificDate ? sameDay(new Date(s.specificDate), now) : s.dayOfWeek === dayIdx
    )
    .sort((a, b) => String(a.startTime).localeCompare(String(b.startTime)));
};

export const lessonState = (lesson, now) => {
  const mins = now.getHours() * 60 + now.getMinutes();
  if (toMinutes(lesson.endTime) <= mins) return 'done';
  if (toMinutes(lesson.startTime) <= mins) return 'current';
  return 'upcoming';
};
