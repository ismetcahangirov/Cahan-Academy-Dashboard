import { format } from 'date-fns';
import { az, enUS, ru } from 'date-fns/locale';
import i18n from 'i18next';

const LOCALES = { az, en: enUS, ru };

// Browser ICU data often lacks full az-AZ month names ("2026 M11 13"), so dates go through date-fns.
export const getDateLocale = (lang = i18n.language) =>
  LOCALES[String(lang || 'az').split('-')[0].toLowerCase()] || az;

export const formatDate = (value, pattern = 'd MMMM yyyy', lang) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return format(date, pattern, { locale: getDateLocale(lang) });
};

// <input type="date"> / <input type="datetime-local"> values are in the user's timezone;
// toISOString() would give the UTC day/time instead (a day early around midnight in Baku).
export const toDateInputValue = (value = new Date()) => formatDate(value, 'yyyy-MM-dd');
export const toDateTimeInputValue = (value) => formatDate(value, "yyyy-MM-dd'T'HH:mm");

// A datetime-local value has no offset; send the real instant so the server's timezone does not matter
export const fromDateTimeInputValue = (value) => {
  if (!value) return value;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
};

export default formatDate;
