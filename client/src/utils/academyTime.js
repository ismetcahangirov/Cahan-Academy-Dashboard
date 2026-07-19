const ACADEMY_TZ = import.meta.env.VITE_ACADEMY_TIMEZONE || 'Asia/Baku';
const JOIN_EARLY_MINUTES = 10;

// Academy-local "now". dayOfWeek: 0=Monday .. 6=Sunday (project convention).
export function getAcademyNow(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ACADEMY_TZ,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short',
  }).formatToParts(now);
  const get = (t) => parts.find((p) => p.type === t)?.value ?? '';
  const dayMap = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  let hour = Number(get('hour'));
  if (hour === 24) hour = 0;
  return {
    dateStr: `${get('year')}-${get('month')}-${get('day')}`,
    hour,
    minute: Number(get('minute')),
    dayOfWeek: dayMap[get('weekday')] ?? 0,
  };
}

export function academyDateStr(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ACADEMY_TZ, year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date(date));
  const get = (t) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function toMinutes(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + m;
}

// { show, occurrenceDate } — whether the "Join" button is active for an online entry.
export function joinWindowState(entry, now = new Date()) {
  if (!entry || entry.type !== 'online') return { show: false, occurrenceDate: null };
  const a = getAcademyNow(now);
  let occurrenceDate;
  if (entry.repetitionType === 'once' && entry.specificDate) {
    occurrenceDate = academyDateStr(entry.specificDate);
    if (occurrenceDate !== a.dateStr) return { show: false, occurrenceDate };
  } else if (entry.dayOfWeek !== undefined && entry.dayOfWeek !== null) {
    if (entry.dayOfWeek !== a.dayOfWeek) return { show: false, occurrenceDate: a.dateStr };
    occurrenceDate = a.dateStr;
  } else {
    return { show: false, occurrenceDate: null };
  }
  const nowMin = a.hour * 60 + a.minute;
  const startMin = toMinutes(entry.startTime) - JOIN_EARLY_MINUTES;
  const endMin = toMinutes(entry.endTime);
  return { show: nowMin >= startMin && nowMin <= endMin, occurrenceDate };
}
