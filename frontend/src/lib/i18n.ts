import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import uzCommon from '@/locales/uz/common.json';
import uzErrors from '@/locales/uz/errors.json';
import uzValidation from '@/locales/uz/validation.json';
import enCommon from '@/locales/en/common.json';
import enErrors from '@/locales/en/errors.json';
import enValidation from '@/locales/en/validation.json';

const resources = {
  uz: {
    common: uzCommon,
    errors: uzErrors,
    validation: uzValidation,
  },
  en: {
    common: enCommon,
    errors: enErrors,
    validation: enValidation,
  },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem('language') || 'uz', // Default to Uzbek
    fallbackLng: 'uz',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false, // React already escapes
    },
  });

export default i18n;
