import { enUS } from 'date-fns/locale';
import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import Backend from 'i18next-http-backend';
import { initReactI18next } from 'react-i18next';

/**
 * Contains initialization for the react-i18next library, which handles displaying strings based on the browser's current
 * language setting. This library is based on the popular i18next JavaScript library, tailored specificaly to React.
 *
 * Each supported language requires a set of corresponding .json files in the `.locales/{country code}/`
 * directory, e.g. `.locales/es/common.json`.
 *
 * Splitting strings into separate files creates distinct "namespaces" in i18next, which allows the loading of only
 * the strings needed for a given user path, rather that all strings at once, which as the project grows larger can
 * impact load times.
 *
 * Rendering translated strings can be done a number of different ways, including via the `useTranslation` hook,
 * `withTranslation` higher-order component, or `Translation` render prop:
 * https://react.i18next.com/latest/usetranslation-hook
 * https://react.i18next.com/latest/withtranslation-hoc
 * https://react.i18next.com/latest/translation-render-prop
 *
 * Documentation related to plurals and string interpolation can be found at:
 * https://www.i18next.com/translation-function/plurals
 * https://www.i18next.com/translation-function/interpolation
 */

export const supportedLanguages = [
  'en',
  'de',
  'es',
  'fr',
  'it',
  'ja',
  'ko',
  'pt',
  'ru',
  'uk',
  'zh',
  'zh_hant',
];

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    backend: {
      // for all available options read the backend's repository readme file
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    initImmediate: true,
    debug: false,
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: [
      'actions',
      'breadcrumbs',
      'common',
      'daoCreate',
      'daoEdit',
      'dashboard',
      'gaslessVoting',
      'home',
      'languages',
      'menu',
      'modals',
      'navigation',
      'proposal',
      'proposalDapps',
      'proposalMetadata',
      'proposalTemplate',
      'roles',
      'settings',
      'stake',
      'transaction',
      'treasury',
      'revenueSharing',
      'staking',
    ],
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

/**
 * @returns the date-fns Locale corresponding to the current i18n language setting
 */
export const useDateFNSLocale = () => {
  let locale = undefined;
  switch (i18n.language) {
    default:
      locale = enUS;
  }
  return locale;
};
