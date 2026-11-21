import { format } from 'date-fns';
import { az, enUS, ru } from 'date-fns/locale';
import i18n from '../i18n';

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

export default formatDate;
