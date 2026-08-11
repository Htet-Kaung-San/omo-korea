const { readFileSync } = require('node:fs');
const { inflateRawSync } = require('node:zlib');

const EXPECTED_SHEETS = ['courses', 'engineering_courses'];
const REQUIRED_COLUMNS = {
  courses: ['course_id', 'course_name', 'credit', 'major_id', 'category'],
  engineering_courses: ['major_id', 'major_name'],
};

function decodeXml(value) {
  return String(value || '')
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function readZipEntries(buffer) {
  const eocdSignature = 0x06054b50;
  const centralSignature = 0x02014b50;
  const localSignature = 0x04034b50;
  const searchStart = Math.max(0, buffer.length - 65_557);
  let eocdOffset = -1;

  for (let offset = buffer.length - 22; offset >= searchStart; offset -= 1) {
    if (buffer.readUInt32LE(offset) === eocdSignature) {
      eocdOffset = offset;
      break;
    }
  }

  if (eocdOffset < 0) throw new Error('Invalid XLSX: ZIP directory not found');

  const entryCount = buffer.readUInt16LE(eocdOffset + 10);
  let centralOffset = buffer.readUInt32LE(eocdOffset + 16);
  const entries = new Map();

  for (let index = 0; index < entryCount; index += 1) {
    if (buffer.readUInt32LE(centralOffset) !== centralSignature) {
      throw new Error('Invalid XLSX: malformed ZIP central directory');
    }

    const compressionMethod = buffer.readUInt16LE(centralOffset + 10);
    const compressedSize = buffer.readUInt32LE(centralOffset + 20);
    const fileNameLength = buffer.readUInt16LE(centralOffset + 28);
    const extraLength = buffer.readUInt16LE(centralOffset + 30);
    const commentLength = buffer.readUInt16LE(centralOffset + 32);
    const localOffset = buffer.readUInt32LE(centralOffset + 42);
    const fileName = buffer
      .subarray(centralOffset + 46, centralOffset + 46 + fileNameLength)
      .toString('utf8')
      .replaceAll('\\', '/');

    if (buffer.readUInt32LE(localOffset) !== localSignature) {
      throw new Error(`Invalid XLSX: local ZIP entry missing for ${fileName}`);
    }

    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const dataStart = localOffset + 30 + localNameLength + localExtraLength;
    const compressed = buffer.subarray(dataStart, dataStart + compressedSize);
    let content;

    if (compressionMethod === 0) content = compressed;
    else if (compressionMethod === 8) content = inflateRawSync(compressed);
    else throw new Error(`Unsupported XLSX ZIP compression method ${compressionMethod}`);

    entries.set(fileName, content);
    centralOffset += 46 + fileNameLength + extraLength + commentLength;
  }

  return entries;
}

function getRequiredEntry(entries, name) {
  const value = entries.get(name);
  if (!value) throw new Error(`Invalid XLSX: missing ${name}`);
  return value.toString('utf8');
}

function columnIndex(cellReference) {
  const letters = String(cellReference).match(/^[A-Z]+/i)?.[0]?.toUpperCase();
  if (!letters) throw new Error(`Invalid cell reference: ${cellReference}`);
  return [...letters].reduce((value, letter) => value * 26 + letter.charCodeAt(0) - 64, 0) - 1;
}

function parseSharedStrings(xml) {
  return [...xml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map((match) =>
    decodeXml(
      [...match[1].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)]
        .map((text) => text[1])
        .join(''),
    ),
  );
}

function parseCellValue(cellXml, type, sharedStrings) {
  if (type === 'inlineStr') {
    return decodeXml(
      [...cellXml.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)]
        .map((match) => match[1])
        .join(''),
    );
  }

  const rawValue = cellXml.match(/<v\b[^>]*>([\s\S]*?)<\/v>/)?.[1];
  if (rawValue === undefined) return null;
  if (type === 's') return sharedStrings[Number(rawValue)] ?? '';
  if (type === 'str') return decodeXml(rawValue);
  if (type === 'b') return rawValue === '1';

  const numericValue = Number(rawValue);
  return Number.isFinite(numericValue) ? numericValue : decodeXml(rawValue);
}

function parseWorksheet(xml, sharedStrings) {
  const rows = [];

  for (const rowMatch of xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const values = [];
    for (const cellMatch of rowMatch[1].matchAll(
      /<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g,
    )) {
      const attributes = cellMatch[1];
      const reference = attributes.match(/\br="([^"]+)"/)?.[1];
      if (!reference) continue;
      const type = attributes.match(/\bt="([^"]+)"/)?.[1] || '';
      values[columnIndex(reference)] = parseCellValue(cellMatch[2] || '', type, sharedStrings);
    }
    if (values.some((value) => value !== null && value !== undefined && value !== '')) {
      rows.push(values);
    }
  }

  if (rows.length === 0) return { columns: [], rows: [], rawRows: [] };
  const columns = rows[0].map((value) => String(value ?? '').trim());
  return {
    columns,
    rawRows: rows,
    rows: rows.slice(1).map((values, rowIndex) => {
      const row = { _rowNumber: rowIndex + 2 };
      columns.forEach((column, index) => {
        row[column] = values[index] ?? null;
      });
      return row;
    }),
  };
}

function readXlsxWorkbookBuffer(buffer) {
  const entries = readZipEntries(buffer);
  const workbookXml = getRequiredEntry(entries, 'xl/workbook.xml');
  const relationshipsXml = getRequiredEntry(entries, 'xl/_rels/workbook.xml.rels');
  const sharedStrings = entries.has('xl/sharedStrings.xml')
    ? parseSharedStrings(entries.get('xl/sharedStrings.xml').toString('utf8'))
    : [];
  const relationships = new Map(
    [...relationshipsXml.matchAll(/<Relationship\b([^>]*)\/?\s*>/g)].map((match) => {
      const id = match[1].match(/\bId="([^"]+)"/)?.[1];
      const target = match[1].match(/\bTarget="([^"]+)"/)?.[1];
      return [id, target];
    }),
  );
  const sheets = {};
  const sheetNames = [];

  for (const sheetMatch of workbookXml.matchAll(/<sheet\b([^>]*)\/?\s*>/g)) {
    const attributes = sheetMatch[1];
    const name = decodeXml(attributes.match(/\bname="([^"]+)"/)?.[1]);
    const relationshipId = attributes.match(/\br:id="([^"]+)"/)?.[1];
    const target = relationships.get(relationshipId);
    if (!name || !target) throw new Error('Invalid XLSX: unresolved worksheet relationship');
    const entryName = target.startsWith('/')
      ? target.slice(1)
      : target.startsWith('xl/')
        ? target
        : `xl/${target}`;
    sheetNames.push(name);
    sheets[name] = parseWorksheet(getRequiredEntry(entries, entryName), sharedStrings);
  }

  return { sheetNames, sheets };
}

function readXlsxWorkbook(workbookPath) {
  return readXlsxWorkbookBuffer(readFileSync(workbookPath));
}

function groupDuplicates(rows, field) {
  const groups = new Map();
  rows.forEach((row) => {
    const rawValue = row[field];
    if (rawValue === null || rawValue === undefined || String(rawValue).trim() === '') return;
    const key = typeof rawValue === 'string' ? rawValue.trim() : String(rawValue);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  });
  return [...groups.entries()]
    .filter(([, matches]) => matches.length > 1)
    .map(([value, matches]) => ({
      value,
      rows: matches.map((row) => row._rowNumber),
      workbookCourseIds: matches
        .map((row) => row.workbookCourseId)
        .filter((item) => item != null),
    }));
}

function malformedNameReasons(value) {
  const name = String(value ?? '');
  const reasons = [];
  if (!name.trim()) reasons.push('missing course name');
  if (/^[IVXLCDM]+$/.test(name)) reasons.push('Roman numeral only');
  if (name.trim() && name.trim().length <= 4) reasons.push('very short course name');
  if (/^\d/.test(name)) reasons.push('starts with a numeric fragment');
  if ((name.match(/\(/g) || []).length !== (name.match(/\)/g) || []).length) {
    reasons.push('unbalanced parentheses');
  }
  if (name !== name.trim()) reasons.push('leading or trailing whitespace');
  if (/\s{2,}/.test(name)) reasons.push('repeated whitespace');
  if (/\w\(/.test(name)) reasons.push('missing space before parenthesis');
  return reasons;
}

function analyzeWorkbook(workbook, mappingConfig) {
  const errors = [];
  const warnings = [];
  const missingSheets = EXPECTED_SHEETS.filter((name) => !workbook.sheetNames.includes(name));
  const unexpectedSheets = workbook.sheetNames.filter((name) => !EXPECTED_SHEETS.includes(name));

  if (missingSheets.length) errors.push(`Missing required sheets: ${missingSheets.join(', ')}`);
  if (unexpectedSheets.length) warnings.push(`Unexpected sheets: ${unexpectedSheets.join(', ')}`);

  for (const [sheetName, requiredColumns] of Object.entries(REQUIRED_COLUMNS)) {
    const sheet = workbook.sheets[sheetName];
    if (!sheet) continue;
    const missingColumns = requiredColumns.filter((column) => !sheet.columns.includes(column));
    if (missingColumns.length) {
      errors.push(`${sheetName} is missing required columns: ${missingColumns.join(', ')}`);
    }
  }

  const courses = (workbook.sheets.courses?.rows || []).map((row) => ({
    _rowNumber: row._rowNumber,
    workbookCourseId: row.course_id,
    courseName: row.course_name,
    credit: row.credit,
    workbookMajorId: row.major_id,
    category: row.category,
  }));
  const workbookMajors = workbook.sheets.engineering_courses?.rows || [];
  const duplicateWorkbookCourseIds = groupDuplicates(courses, 'workbookCourseId');
  const duplicateCourseNames = groupDuplicates(courses, 'courseName');
  const malformedCourseNames = courses
    .map((row) => ({
      row: row._rowNumber,
      workbookCourseId: row.workbookCourseId,
      courseName: row.courseName,
      reasons: malformedNameReasons(row.courseName),
    }))
    .filter((item) => item.reasons.length > 0);
  const decimalCredits = courses
    .filter((row) => typeof row.credit === 'number' && !Number.isInteger(row.credit))
    .map((row) => ({
      row: row._rowNumber,
      workbookCourseId: row.workbookCourseId,
      courseName: row.courseName,
      credit: row.credit,
    }));

  const mappings = Array.isArray(mappingConfig?.mappings) ? mappingConfig.mappings : [];
  const mappingByWorkbookId = new Map(mappings.map((mapping) => [String(mapping.workbook_major_id), mapping]));
  const confirmed = [];
  const unresolved = [];
  const missingMappings = [];
  const mismatchedMappings = [];

  workbookMajors.forEach((major) => {
    const mapping = mappingByWorkbookId.get(String(major.major_id));
    if (!mapping) {
      missingMappings.push({ majorId: major.major_id, majorName: major.major_name });
      return;
    }
    if (mapping.workbook_major_name !== major.major_name) {
      mismatchedMappings.push({
        majorId: major.major_id,
        workbookName: major.major_name,
        configuredName: mapping.workbook_major_name,
      });
    }
    if (mapping.production_major_id == null) unresolved.push(mapping);
    else confirmed.push(mapping);
  });

  const invalidConfirmedMappings = confirmed.filter(
    (mapping) =>
      mapping.status !== 'CONFIRMED' ||
      !Number.isInteger(mapping.production_major_id) ||
      mapping.production_major_id <= 0 ||
      mapping.production_major_name !== mapping.workbook_major_name,
  );
  const invalidUnresolvedMappings = unresolved.filter(
    (mapping) =>
      mapping.status !== 'UNRESOLVED' ||
      mapping.production_major_name !== null ||
      !String(mapping.explanation || '').trim(),
  );

  const importBlockingIssues = [];
  if (courses.length) {
    importBlockingIssues.push(
      `${courses.length} courses lack reviewed official production-safe identifiers`,
    );
  }
  if (missingMappings.length) importBlockingIssues.push(`${missingMappings.length} workbook majors have no mapping entry`);
  if (mismatchedMappings.length) importBlockingIssues.push(`${mismatchedMappings.length} mapping names do not match the workbook`);
  if (invalidConfirmedMappings.length) importBlockingIssues.push(`${invalidConfirmedMappings.length} confirmed mappings are invalid`);
  if (invalidUnresolvedMappings.length) importBlockingIssues.push(`${invalidUnresolvedMappings.length} unresolved mappings are invalid`);
  if (duplicateWorkbookCourseIds.length) warnings.push(`${duplicateWorkbookCourseIds.length} duplicate workbook course identifier groups found`);
  if (duplicateCourseNames.length) warnings.push(`${duplicateCourseNames.length} duplicate course name groups found`);
  if (malformedCourseNames.length) warnings.push(`${malformedCourseNames.length} malformed or suspicious course names found`);
  if (decimalCredits.length) warnings.push(`${decimalCredits.length} decimal-credit courses found`);
  if (unresolved.length) warnings.push(`${unresolved.length} majors remain unresolved`);
  warnings.push(
    'Workbook course identifiers are local row identifiers, not production IDs. Never insert or upsert them into the production course primary key.',
  );

  const unresolvedIds = new Set(unresolved.map((mapping) => String(mapping.workbook_major_id)));
  const duplicatedWorkbookIdentifierValues = new Set(
    duplicateWorkbookCourseIds.flatMap((group) => group.workbookCourseIds.map(String)),
  );
  const decimalCreditRows = new Set(decimalCredits.map((item) => item.row));
  const missingMappingIds = new Set(missingMappings.map((mapping) => String(mapping.majorId)));
  const mismatchedMappingIds = new Set(mismatchedMappings.map((mapping) => String(mapping.majorId)));
  const invalidMappingIds = new Set(
    [...invalidConfirmedMappings, ...invalidUnresolvedMappings].map((mapping) =>
      String(mapping.workbook_major_id),
    ),
  );
  const courseImportReviews = courses.map((course) => {
    const mapping = mappingByWorkbookId.get(String(course.workbookMajorId));
    const blockingReasons = [
      'OFFICIAL_COURSE_IDENTIFIER_MISSING: no reviewed production-safe course identifier exists for this workbook row',
    ];

    if (unresolvedIds.has(String(course.workbookMajorId))) {
      blockingReasons.push(
        'PRODUCTION_MAJOR_MAPPING_UNRESOLVED: the workbook major has no confirmed production major ID',
      );
    }
    if (!mapping || missingMappingIds.has(String(course.workbookMajorId))) {
      blockingReasons.push('PRODUCTION_MAJOR_MAPPING_MISSING: no reviewed mapping entry exists');
    }
    if (mismatchedMappingIds.has(String(course.workbookMajorId))) {
      blockingReasons.push('PRODUCTION_MAJOR_MAPPING_NAME_MISMATCH: configured and workbook names differ');
    }
    if (invalidMappingIds.has(String(course.workbookMajorId))) {
      blockingReasons.push('PRODUCTION_MAJOR_MAPPING_INVALID: the reviewed mapping entry is invalid');
    }
    if (duplicatedWorkbookIdentifierValues.has(String(course.workbookCourseId))) {
      blockingReasons.push('DUPLICATE_WORKBOOK_COURSE_IDENTIFIER: local workbook identifier is duplicated');
    }
    if (decimalCreditRows.has(course._rowNumber)) {
      blockingReasons.push('DECIMAL_CREDIT_REQUIRES_REVIEW: production credit compatibility is unresolved');
    }

    return {
      row: course._rowNumber,
      workbookCourseId: course.workbookCourseId,
      courseName: course.courseName,
      credit: course.credit,
      category: course.category,
      workbookMajorId: course.workbookMajorId,
      productionMajorId: mapping?.production_major_id ?? null,
      blockingReasons,
    };
  });
  const eligibleCourses = courseImportReviews.filter((course) => course.blockingReasons.length === 0);
  const blockedCourses = courseImportReviews.filter((course) => course.blockingReasons.length > 0);
  const structureValid = errors.length === 0;
  const importSafe =
    structureValid && importBlockingIssues.length === 0 && blockedCourses.length === 0;

  return {
    structureValid,
    importSafe,
    errors,
    warnings,
    importBlockingIssues,
    sheetNames: workbook.sheetNames,
    sheets: Object.fromEntries(
      Object.entries(workbook.sheets).map(([name, sheet]) => [
        name,
        { rowCount: sheet.rows.length, columns: sheet.columns },
      ]),
    ),
    duplicateWorkbookCourseIds,
    duplicateCourseNames,
    malformedCourseNames,
    decimalCredits,
    courseIdentifierSafety: {
      officialProductionIdentifiersPresent: false,
      count: courses.length,
      message:
        'All workbook course identifiers must be discarded during any future import; production must use reviewed official source identifiers.',
    },
    eligibleCourses,
    blockedCourses,
    majorMappings: {
      confirmed,
      unresolved,
      missingMappings,
      mismatchedMappings,
      invalidConfirmedMappings,
      invalidUnresolvedMappings,
      unresolvedCourseRows: courses.filter((course) =>
        unresolvedIds.has(String(course.workbookMajorId)),
      ).length,
    },
  };
}

function validateWorkbook({ workbookPath, mappingPath }) {
  const workbook = readXlsxWorkbook(workbookPath);
  const mappingConfig = JSON.parse(readFileSync(mappingPath, 'utf8'));
  return analyzeWorkbook(workbook, mappingConfig);
}

module.exports = {
  EXPECTED_SHEETS,
  REQUIRED_COLUMNS,
  analyzeWorkbook,
  malformedNameReasons,
  readXlsxWorkbook,
  readXlsxWorkbookBuffer,
  validateWorkbook,
};
