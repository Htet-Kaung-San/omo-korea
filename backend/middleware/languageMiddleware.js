const {
  SUPPORTED_LANGUAGE_PREFS,
  resolveLanguagePref,
} = require('./supportedLanguages');

const SUPPORTED_LANGUAGES = new Set(SUPPORTED_LANGUAGE_PREFS);

function parseAcceptLanguage(header) {
  if (!header || typeof header !== 'string') {
    return 'en';
  }

  const first = header.split(',')[0].trim().toLowerCase();
  const base = first.split('-')[0];
  const resolved = resolveLanguagePref(base);
  return resolved || (SUPPORTED_LANGUAGES.has(base) ? base : 'en');
}

function languageMiddleware(req, res, next) {
  req.language = parseAcceptLanguage(req.headers['accept-language']);
  next();
}

module.exports = {
  languageMiddleware,
  parseAcceptLanguage,
  localizeRow,
  localizeRows,
};

function localizeRows(rows = [], language = 'en', fields = []) {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.map((row) => localizeRow(row, language, fields));
}

function localizeRow(row = {}, language = 'en', fields = []) {
  const localized = { ...row };

  fields.forEach((field) => {
    const localizedValue =
      row[`${field}_${language}`] ??
      row[`${field}_en`] ??
      row[field] ??
      null;

    if (localizedValue !== null && localizedValue !== undefined) {
      localized[field] = localizedValue;
    }
  });

  return localized;
}
