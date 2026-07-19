const ACADEMY_TZ = () => process.env.ACADEMY_TIMEZONE || 'Asia/Baku';

// Academy-local "now". dayOfWeek uses project convention: 0=Monday .. 6=Sunday.
export function getAcademyNow(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ACADEMY_TZ(),
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false, weekday: 'short',
  }).formatToParts(now);
  const get = (t) => parts.find((p) => p.type === t)?.value ?? '';
  const dayMap = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  let hour = Number(get('hour'));
  if (hour === 24) hour = 0; // some ICU builds emit "24" at midnight
  return {
    dateStr: `${get('year')}-${get('month')}-${get('day')}`,
    hour,
    minute: Number(get('minute')),
    dayOfWeek: dayMap[get('weekday')] ?? 0,
  };
}

// Weekday (0=Monday .. 6=Sunday) for a "YYYY-MM-DD" string.
export function dayOfWeekForDateStr(dateStr) {
  const jsDay = new Date(`${dateStr}T12:00:00Z`).getUTCDay(); // 0=Sun .. 6=Sat
  return (jsDay + 6) % 7;
}

// Format a Date as "YYYY-MM-DD" in Asia/Baku.
export function academyDateStr(date) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ACADEMY_TZ(),
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date(date));
  const get = (t) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function toMinutes(hhmm) {
  const [h, m] = String(hhmm).split(':').map(Number);
  return h * 60 + m;
}
