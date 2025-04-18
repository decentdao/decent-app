const fs = require('fs');
const path = require('path');

// Paths
const localesDir = path.join(__dirname, '../public/locales');
const enDir = path.join(localesDir, 'en');

// List of target languages (excluding 'en' and skipping .DS_Store)
const languages = fs.readdirSync(localesDir).filter(lang => lang !== 'en' && lang !== '.DS_Store');

// Function to recursively check if all keys in the source object exist in the target object
function areKeysPresent(source, target) {
  for (const key in source) {
    if (!Object.prototype.hasOwnProperty.call(target, key)) {
      return false;
    }
    if (typeof source[key] === 'object' && source[key] !== null) {
      if (!areKeysPresent(source[key], target[key] || {})) {
        return false;
      }
    }
  }
  return true;
}

// Main function to check keys
function checkKeys() {
  // Filter out .DS_Store and non-JSON files in the 'en' directory
  const enFiles = fs
    .readdirSync(enDir)
    .filter(file => path.extname(file) === '.json' && file !== '.DS_Store');
  let allKeysPresent = true;

  for (const file of enFiles) {
    const enFilePath = path.join(enDir, file);
    const enContent = JSON.parse(fs.readFileSync(enFilePath, 'utf8'));

    for (const lang of languages) {
      const langFilePath = path.join(localesDir, lang, file);

      if (!fs.existsSync(langFilePath)) {
        console.error(`Missing file: ${langFilePath}`);
        throw new Error(`Missing keys in ${lang} for file ${file}`);
      }

      const langContent = JSON.parse(fs.readFileSync(langFilePath, 'utf8'));

      if (!areKeysPresent(enContent, langContent)) {
        console.error(`Missing keys in ${langFilePath}`);
        throw new Error(`Missing keys in ${lang} for file ${file}`);
      }
    }
  }

  return allKeysPresent;
}

// Run the check
const result = checkKeys();
console.log(`All keys present in all language files: ${result}`);
