import { enUS } from 'date-fns/locale';
import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import ACTIONS_EN from './locales/en/actions.json';
import BREADCRUMBS_EN from './locales/en/breadcrumbs.json';
import COMMON_EN from './locales/en/common.json';
import DAOCREATE_EN from './locales/en/daoCreate.json';
import DAOEDIT_EN from './locales/en/daoEdit.json';
import DASHBOARD_EN from './locales/en/dashboard.json';
import GASLESS_VOTING_EN from './locales/en/gaslessVoting.json';
import HOME_EN from './locales/en/home.json';
import LANGUAGES_EN from './locales/en/languages.json';
import MENU_EN from './locales/en/menu.json';
import MODALS_EN from './locales/en/modals.json';
import NAVIGATION_EN from './locales/en/navigation.json';
import PROPOSAL_EN from './locales/en/proposal.json';
import PROPOSAL_METADATA_EN from './locales/en/proposalMetadata.json';
import PROPOSAL_TEMPLATE_EN from './locales/en/proposalTemplate.json';
import ROLES_EN from './locales/en/roles.json';
import SETTINGS_EN from './locales/en/settings.json';
import STAKE_EN from './locales/en/stake.json';
import TRANSACTION_EN from './locales/en/transaction.json';
import TREASURY_EN from './locales/en/treasury.json';

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

export const supportedLanguages = {
  en: {
    actions: ACTIONS_EN,
    breadcrumbs: BREADCRUMBS_EN,
    common: COMMON_EN,
    daoCreate: DAOCREATE_EN,
    daoEdit: DAOEDIT_EN,
    menu: MENU_EN,
    dashboard: DASHBOARD_EN,
    proposalTemplate: PROPOSAL_TEMPLATE_EN,
    proposal: PROPOSAL_EN,
    proposalMetadata: PROPOSAL_METADATA_EN,
    transaction: TRANSACTION_EN,
    treasury: TREASURY_EN,
    navigation: NAVIGATION_EN,
    modals: MODALS_EN,
    languages: LANGUAGES_EN,
    settings: SETTINGS_EN,
    stake: STAKE_EN,
    home: HOME_EN,
    roles: ROLES_EN,
    gaslessVoting: GASLESS_VOTING_EN,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: supportedLanguages,
    fallbackLng: 'en',
    defaultNS: 'common',
    interpolation: {
      escapeValue: false, // not needed for react as it escapes by default
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
