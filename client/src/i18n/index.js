import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import az from './locales/az.json';
import en from './locales/en.json';
import ru from './locales/ru.json';

/** Normalize browser locale codes like "az-AZ" → "az", "en-US" → "en" */
const normalize = (lng) => (lng ? lng.split('-')[0].split('_')[0].toLowerCase() : 'az');

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      az: { translation: az },
      en: { translation: en },
      ru: { translation: ru },
    },
    fallbackLng: 'az',
    supportedLngs: ['az', 'en', 'ru'],
    // Detection order: localStorage first, then browser
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
      convertDetectedLanguage: normalize,
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
