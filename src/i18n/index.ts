import { de, enUS, es, fr, it, ja, ko, pt, ru, uk, zhCN, zhTW } from 'date-fns/locale';
import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { useEffect, useReducer, useState } from 'react';
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

async function buildLanguageFile(languageCode: string, path: string): Promise<{}> {
  const fileName = `/locales/${languageCode}/${path}.json`;
  try {
    const response = await fetch(fileName);
    if (!response.ok) {
      throw new Error(`Failed to load ${fileName}: ${response.statusText}`);
    }
    const obj = await response.json(); // Parse the JSON response
    console.log(obj);
    return obj;
  } catch (error) {
    console.error(`Error loading file: ${fileName}`, error);
    return {}; // Return an empty object if the file cannot be loaded
  }
}

function buildLanguage(languageCode: string): Promise<{}> {
  buildLanguageFile(languageCode, 'actions').then(actions => {
    console.log('actions', actions);
  });
  const result = Promise.all([
    buildLanguageFile(languageCode, 'actions'),
    buildLanguageFile(languageCode, 'breadcrumbs'),
    buildLanguageFile(languageCode, 'common'),
    buildLanguageFile(languageCode, 'daoCreate'),
    buildLanguageFile(languageCode, 'daoEdit'),
    buildLanguageFile(languageCode, 'dashboard'),
    buildLanguageFile(languageCode, 'gaslessVoting'),
    buildLanguageFile(languageCode, 'home'),
    buildLanguageFile(languageCode, 'languages'),
    buildLanguageFile(languageCode, 'menu'),
    buildLanguageFile(languageCode, 'modals'),
    buildLanguageFile(languageCode, 'navigation'),
    buildLanguageFile(languageCode, 'proposal'),
    buildLanguageFile(languageCode, 'proposalDapps'),
    buildLanguageFile(languageCode, 'proposalMetadata'),
    buildLanguageFile(languageCode, 'proposalTemplate'),
    buildLanguageFile(languageCode, 'roles'),
    buildLanguageFile(languageCode, 'settings'),
    buildLanguageFile(languageCode, 'stake'),
    buildLanguageFile(languageCode, 'transaction'),
    buildLanguageFile(languageCode, 'treasury'),
  ]).then(
    ([
      actions,
      breadcrumbs,
      common,
      daoCreate,
      daoEdit,
      dashboard,
      gaslessVoting,
      home,
      languages,
      menu,
      modals,
      navigation,
      proposal,
      proposalDapps,
      proposalMetadata,
      proposalTemplate,
      roles,
      settings,
      stake,
      transaction,
      treasury,
    ]) => {
      return {
        actions,
        breadcrumbs,
        common,
        daoCreate,
        daoEdit,
        dashboard,
        gaslessVoting,
        home,
        languages,
        menu,
        modals,
        navigation,
        proposal,
        proposalDapps,
        proposalMetadata,
        proposalTemplate,
        roles,
        settings,
        stake,
        transaction,
        treasury,
      };
    },
  );
  return result;
}

function buildLanguages(): Promise<{}> {
  const result = Promise.all([
    buildLanguage('en'),
    buildLanguage('de'),
    buildLanguage('es'),
    buildLanguage('fr'),
    buildLanguage('it'),
    buildLanguage('ja'),
    buildLanguage('ko'),
    buildLanguage('pt'),
    buildLanguage('ru'),
    buildLanguage('uk'),
    buildLanguage('zh'),
    buildLanguage('zh_hant'),
  ]).then(
    ([
      en,
      deLanguage,
      esLanguage,
      frLanguage,
      itLanguage,
      jaLanguage,
      koLanguage,
      ptLanguage,
      ruLanguage,
      ukLanguage,
      zhLanguage,
      zh_hantLanguage,
    ]) => {
      return {
        en,
        de: deLanguage,
        es: esLanguage,
        fr: frLanguage,
        it: itLanguage,
        ja: jaLanguage,
        ko: koLanguage,
        pt: ptLanguage,
        ru: ruLanguage,
        uk: ukLanguage,
        zh: zhLanguage,
        zh_hant: zh_hantLanguage,
      };
    },
  );
  return result;
}

let initializedLanguages: {} | undefined = undefined; // Singleton variable to store initialized languages
let initializationPromise: Promise<void> | null = null; // Singleton to ensure initialization runs only once

async function initializeI18n() {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      const supportedLanguages = await buildLanguages();

      await i18n
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

      initializedLanguages = supportedLanguages;
    })();
  }

  await initializationPromise;
}

export const useSupportedLanguages = (): {} | undefined => {
  const [, forceUpdate] = useReducer(x => x + 1, 0); // Used to trigger re-renders

  useEffect(() => {
    if (!initializedLanguages) {
      initializeI18n()
        .then(() => {
          forceUpdate(); // Trigger a re-render when initialization is complete
        })
        .catch(err => {
          console.error('Error initializing i18n:', err);
        });
    }
  }, []); // Empty dependency array ensures this runs only once

  return initializedLanguages;
};

export default i18n;

/**
 * @returns the date-fns Locale corresponding to the current i18n language setting
 */
export const useDateFNSLocale = () => {
  let locale = undefined;
  switch (i18n.language) {
    case 'en':
      locale = enUS;
      break;

    case 'de':
      locale = de;
      break;

    case 'es':
      locale = es;
      break;

    case 'fr':
      locale = fr;
      break;

    case 'it':
      locale = it;
      break;

    case 'ja':
      locale = ja;
      break;

    case 'ko':
      locale = ko;
      break;

    case 'pt':
      locale = pt;
      break;

    case 'ru':
      locale = ru;
      break;

    case 'uk':
      locale = uk;
      break;

    case 'zh':
      locale = zhCN;
      break;

    case 'zh_hant':
      locale = zhTW;
      break;

    default:
      locale = enUS;
  }
  return locale;
};
