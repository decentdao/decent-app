require('dotenv').config(); // Load environment variables from .env
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const dotenv = require('dotenv');
// Check if .env.local exists and load it
const envLocalPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
}

// Adjust paths to be relative to the /scripts folder
const sourceDir = path.join(__dirname, '../src/i18n/locales/en');
const targetBaseDir = path.join(__dirname, '../src/i18n/locales');

// List of target languages and their directory names
const languages = {
  es: 'ES', // Spanish
  de: 'DE', // German
  fr: 'FR', // French
  it: 'IT', // Italian
  ja: 'JA', // Japanese
  ko: 'KO', // Korean
  pt: 'PT', // Portuguese
  ru: 'RU', // Russian
  uk: 'UK', // Ukrainian
  zh: 'ZH', // Simplified Chinese
  zh_hant: 'ZH-HANT', // Traditional Chinese
};

// Helper function to add a delay
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// Your DeepL API key
const DEEPL_API_KEY = process.env.VITE_APP_DEEPL_API_KEY;

if (!DEEPL_API_KEY) {
  console.error('Please set the DEEPL_API_KEY environment variable.');
  process.exit(1);
}

// Function to translate text while preserving placeholders inside {}
async function translateWithPlaceholders(text, langCode) {
  const singleQuoteRegex = /{[^}]+}/g;
  const singleQuoteRegexPlaceholders = text.match(singleQuoteRegex) || [];

  const doubleQuoteRegex = /{{[^}]+}}/g;
  const doubleQuoteRegexRegexPlaceholders = text.match(doubleQuoteRegex) || [];

  let translatedText = text;

  // Replace placeholders with temporary markers
  singleQuoteRegexPlaceholders.forEach((placeholder, index) => {
    translatedText = translatedText.replace(placeholder, `__SINGLEQUOTE_PLACEHOLDER_${index}__`);
  });

  // Replace placeholders with double {{}} with temporary markers
  doubleQuoteRegexRegexPlaceholders.forEach((placeholder, index) => {
    translatedText = translatedText.replace(placeholder, `__DOUBLEQUOTE_PLACEHOLDER_${index}__`);
  });

  // Replace "Decent Labs" with temporary markers
  translatedText = translatedText.replace('Decent Labs', '__DECENTLABS_PLACEHOLDER__');

  // Translate the text without placeholders
  try {
    const response = await axios.post(
      'https://api-free.deepl.com/v2/translate',
      new URLSearchParams({
        auth_key: DEEPL_API_KEY,
        text: translatedText,
        source_lang: 'EN',
        target_lang: langCode,
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      },
    );

    translatedText = response.data.translations[0].text;
  } catch (error) {
    console.error(
      `Error translating text "${text}" to "${langCode}":`,
      error.response?.data || error.message,
    );
    return text; // Fallback to original text
  }

  // Restore placeholders in the translated text
  doubleQuoteRegexRegexPlaceholders.forEach((placeholder, index) => {
    translatedText = translatedText.replace(`__DOUBLEQUOTE_PLACEHOLDER_${index}__`, placeholder);
  });

  // Restore placeholders with double {{}} in the translated text
  singleQuoteRegexPlaceholders.forEach((placeholder, index) => {
    translatedText = translatedText.replace(`__SINGLEQUOTE_PLACEHOLDER_${index}__`, placeholder);
  });

  // Replace "Decent Labs" with temporary markers
  translatedText = translatedText.replace('__DECENTLABS_PLACEHOLDER__', 'Decent Labs');

  return translatedText;
}

// Recursive function to translate all string values in a JSON object
async function translateObject(obj, langCode, existingTranslations = {}) {
  const translatedObj = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      // Check if the key already has a translation
      if (existingTranslations[key]) {
        translatedObj[key] = existingTranslations[key];
      } else {
        try {
          translatedObj[key] = await translateWithPlaceholders(value, langCode);
          await delay(200); // Add a delay of 200ms between requests to avoid rate limiting
        } catch (error) {
          console.error(`Error translating key "${key}" to "${langCode}":`, error);
          translatedObj[key] = value; // Fallback to original
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      // Recursively translate nested objects
      translatedObj[key] = await translateObject(value, langCode, existingTranslations[key] || {});
    } else {
      // Preserve non-string values as-is
      translatedObj[key] = value;
    }
  }

  return translatedObj;
}

async function translateFiles() {
  try {
    // Read all files in the source directory
    const files = fs.readdirSync(sourceDir);

    for (const file of files) {
      const sourceFile = path.join(sourceDir, file);

      // Process only JSON files
      if (path.extname(file) === '.json') {
        console.log(`Translating file: ${file}`);

        const content = JSON.parse(fs.readFileSync(sourceFile, 'utf8'));

        // Translate for each target language
        for (const [langDir, langCode] of Object.entries(languages)) {
          const targetDir = path.join(targetBaseDir, langDir);
          const targetFile = path.join(targetDir, file);

          // Ensure the target directory exists
          fs.mkdirSync(targetDir, { recursive: true });

          // Load existing translations if the target file exists
          let existingTranslations = {};
          if (fs.existsSync(targetFile)) {
            existingTranslations = JSON.parse(fs.readFileSync(targetFile, 'utf8'));
          }

          // Translate the entire JSON object
          const translatedContent = await translateObject(content, langCode, existingTranslations);

          // Write the translated content to the target file
          fs.writeFileSync(targetFile, JSON.stringify(translatedContent, null, 2), 'utf8');
          console.log(`Translated file saved: ${targetFile}`);
        }
      }
    }

    console.log('All files translated successfully!');
  } catch (error) {
    console.error('Error processing files:', error);
  }
}

translateFiles();
