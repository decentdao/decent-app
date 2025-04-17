import { enUS } from 'date-fns/locale';
import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import resourcesToBackend from 'i18next-resources-to-backend';
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

export const supportedLanguages = ['en'];

i18n
  .use(
    resourcesToBackend(
      (language: string, namespace: string) => import(`./locales/${language}/${namespace}.json`),
    ),
  )
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    initImmediate: true,
    debug: true,
    fallbackLng: 'en',
    lng: 'en',
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
