// Group schedule days: index 0 = Monday .. 6 = Sunday (same convention as the server and Schedule.dayOfWeek).
export const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

// Canonical value stored in Group.schedule.days (language independent, parsed by the server).
export const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Older groups were saved with whatever UI language the admin had, so accept every known spelling.
const ALIASES = [
  ['monday', 'mon', 'bazar ertəsi', 'b.ertəsi', 'b.e', 'понедельник', 'пн'],
  ['tuesday', 'tue', 'çərşənbə axşamı', 'çərşənbə a.', 'ç.a', 'вторник', 'вт'],
  ['wednesday', 'wed', 'çərşənbə', 'ç', 'среда', 'ср'],
  ['thursday', 'thu', 'cümə axşamı', 'cümə a.', 'c.a', 'четверг', 'чт'],
  ['friday', 'fri', 'cümə', 'c', 'пятница', 'пт'],
  ['saturday', 'sat', 'şənbə', 'ş', 'суббота', 'сб'],
  ['sunday', 'sun', 'bazar', 'b', 'воскресенье', 'вс'],
];

export const normalizeDay = (value) => {
  if (typeof value === 'number') return Number.isInteger(value) && value >= 0 && value <= 6 ? value : -1;
  if (typeof value !== 'string') return -1;
  const v = value.trim().toLowerCase();
  if (/^[0-6]$/.test(v)) return Number(v);
  return ALIASES.findIndex((names) => names.includes(v));
};

export const toDayName = (value) => {
  const idx = normalizeDay(value);
  return idx === -1 ? null : DAY_NAMES[idx];
};

export const formatDays = (days, t) => {
  if (!Array.isArray(days)) return '';
  const indexes = [...new Set(days.map(normalizeDay))];
  const known = indexes.filter((i) => i !== -1).sort((a, b) => a - b);
  const unknown = days.filter((d) => normalizeDay(d) === -1).map(String);
  return [...known.map((i) => t(`schedule.days.${DAY_KEYS[i]}`)), ...unknown].join(', ');
};
