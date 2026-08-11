const TYPE_PRIORITY = { REQUIRED: 0, GEN_ED: 1, ELECTIVE: 2 };

const COURSE_FIELDS = [
  { id: 'AI_ML', label: 'AI / Machine Learning', terms: ['artificial intelligence', 'machine learning', 'deep learning', 'reinforcement learning', 'natural language processing', 'generative ai', 'multimodal', 'ai', '인공지능', '머신러닝', '딥러닝', '강화학습', '자연어처리', '생성모델', '멀티모달'] },
  { id: 'DATA_DATABASE', label: 'Data / Database', terms: ['database', 'data mining', 'data science', 'data analytics', 'time series', 'statistical learning', '데이터베이스', '데이터마이닝', '데이터과학', '데이터사이언스', '데이터분석', '시계열', '통계학습'] },
  { id: 'WEB', label: 'Web', terms: ['web application', 'web', 'internet', '웹응용', '웹', '인터넷'] },
  { id: 'SOFTWARE_ENGINEERING', label: 'Software Engineering', terms: ['software engineering', 'software design', '소프트웨어공학', '소프트웨어설계'] },
  { id: 'ALGORITHMS_THEORY', label: 'Algorithms / Theory', terms: ['algorithm', 'data structures', 'discrete mathematics', 'compiler', 'optimization', 'quantum computing', '알고리즘', '자료구조', '이산수학', '컴파일러', '최적화', '양자컴퓨팅'] },
  { id: 'SYSTEMS_ARCHITECTURE', label: 'Computer Systems / Architecture', terms: ['operating systems', 'system software', 'computer architecture', 'unix', 'cloud computing', '운영체제', '시스템소프트웨어', '컴퓨터구조', '유닉스', '클라우드컴퓨팅'] },
  { id: 'NETWORKS_SECURITY', label: 'Networks / Security', terms: ['network security', 'computer networks', 'data communications', 'information security', 'blockchain', '네트워크보안', '컴퓨터네트워크', '데이터통신', '정보보안', '블록체인'] },
  { id: 'EMBEDDED_IOT', label: 'Embedded / IoT', terms: ['embedded', 'internet of things', 'iot', 'logic circuit', '임베디드', '사물인터넷', '논리회로'] },
  { id: 'VISION_GRAPHICS', label: 'Computer Vision / Graphics', terms: ['computer vision', 'computer graphics', 'multimedia processing', 'image processing', '컴퓨터비전', '컴퓨터그래픽스', '멀티미디어처리', '영상처리'] },
  { id: 'PROGRAMMING', label: 'Programming', terms: ['programming', 'c++', 'platform based', 'mobile programming', '프로그래밍', '플랫폼기반', '모바일프로그래밍'] },
];

const STOP_WORDS = new Set([
  'a', 'an', 'and', 'course', 'for', 'in', 'introduction', 'intro', 'of', 'the',
  'to', 'advanced', 'basic', 'engineering', 'programming', 'principles',
  'practice', 'lab', 'design', 'computer', 'fundamentals', 'foundation',
  '개론', '기초', '고급', '공학', '프로그래밍', '원리', '실습', '실험', '설계', '컴퓨터', '과목',
]);

function normalizeValue(value) {
  return String(value ?? '').normalize('NFKC').trim().toLowerCase();
}

const ROMAN_NUMERALS = { i: '1', ii: '2', iii: '3', iv: '4', v: '5' };

function singularize(word) {
  if (word.length > 3 && word.endsWith('ies')) return `${word.slice(0, -3)}y`;
  if (word.length > 2 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
}

/**
 * Canonical key for comparing a course by name across the two places names are
 * written differently.
 *
 * The catalog stores bilingual names — 'Computer Architecture (컴퓨터구조)' —
 * while student.completed_courses holds free text a human typed, usually the
 * English name alone. A raw comparison therefore never matches, so courses a
 * student has already passed were recommended straight back to them.
 *
 * Only Hangul-bearing parentheticals are dropped. '(I)' and '(II)' distinguish
 * genuinely different courses and must survive, so they are kept and folded to
 * digits instead, alongside light singularisation so 'Probabilities and
 * Statistics' and 'Probability and Statistics' agree.
 */
function canonicalCourseName(value) {
  const text = normalizeValue(value)
    .replace(/\([^)]*[가-힣][^)]*\)/g, ' ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
  if (!text) return '';
  return text
    .split(' ')
    .filter(Boolean)
    .map((word) => ROMAN_NUMERALS[word] ?? word)
    .map(singularize)
    .join(' ');
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function getCourseIdentifiers(course = {}) {
  const raw = [course.id, course.courseId, course.course_id, course.title, course.name,
    course.nameEn, course.nameKo, course.raw?.course_id, course.raw?.course_name,
    course.raw?.course_name_en]
    .filter((value) => value !== null && value !== undefined && value !== '');
  // Both the literal value and its canonical form, so a bilingual catalog name
  // and a plain English one resolve to a shared key.
  const identifiers = raw.map(normalizeValue);
  for (const value of raw) {
    const canonical = canonicalCourseName(value);
    if (canonical) identifiers.push(canonical);
  }
  return [...new Set(identifiers)].filter(Boolean);
}

function getCourseText(course = {}) {
  return [course.title, course.name, course.nameEn, course.nameKo,
    course.raw?.course_name, course.raw?.course_name_en, course.courseField,
    course.field, course.topic].filter(Boolean).join(' ');
}

function getCourseDisplayName(course = {}) {
  return String(course.nameEn || course.title || course.name || course.nameKo ||
    course.courseId || course.id || '').trim();
}

function getCourseType(course = {}) {
  return String(course.raw?.category || course.category || course.course_type ||
    course.type || '').toUpperCase();
}

function getCourseMajorId(course = {}) {
  const value = course.raw?.major_id || course.major_id || course.majorId;
  return value === null || value === undefined || value === '' ? '' : String(value).trim();
}

function parseYearLevel(value) {
  if (value === null || value === undefined || value === '') return null;
  const normalized = normalizeValue(value);
  if (normalized.includes('전학년') || normalized.includes('all')) return 'ALL';
  const match = normalized.match(/[1-8]/);
  const parsed = match ? Number(match[0]) : Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 8 ? parsed : null;
}

function getCourseYear(course = {}) {
  return parseYearLevel(course.raw?.year_level ?? course.raw?.year ??
    course.raw?.recommended_year ?? course.yearLevel ?? course.year ??
    course.recommendedYear ?? course.grade ?? course.course_year);
}

function getYearSignal(student = {}, course = {}) {
  const studentYear = Number(student.year ?? student.studentYear);
  const courseYear = getCourseYear(course);
  if (!Number.isInteger(studentYear) || studentYear < 1 || studentYear > 8 || !courseYear) {
    return { score: 0, kind: null };
  }
  if (courseYear === 'ALL') return { score: 12, kind: 'all' };
  if (courseYear === studentYear) return { score: 18, kind: 'exact' };
  if (Math.abs(courseYear - studentYear) === 1) return { score: 10, kind: 'adjacent' };
  return { score: 0, kind: null };
}

function isSameMajorCourse(student = {}, course = {}) {
  const studentMajorId = student.majorId || student.major_id;
  if (studentMajorId !== null && studentMajorId !== undefined && studentMajorId !== '' &&
      String(studentMajorId).trim() === getCourseMajorId(course)) return true;
  const major = normalizeValue(student.major);
  const department = normalizeValue(course.department || course.major || '');
  return Boolean(major && department && department === major);
}

function includesTerm(text, term) {
  const normalizedTerm = normalizeValue(term);
  if (/^[a-z0-9+]+$/.test(normalizedTerm)) {
    const escaped = normalizedTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^a-z0-9+])${escaped}($|[^a-z0-9+])`, 'i').test(text);
  }
  return text.includes(normalizedTerm);
}

function getCourseField(course = {}) {
  const explicit = normalizeValue(course.courseField || course.field || course.topic);
  const explicitMatch = COURSE_FIELDS.find((field) =>
    normalizeValue(field.id) === explicit || normalizeValue(field.label) === explicit);
  if (explicitMatch) return explicitMatch;
  const text = normalizeValue(getCourseText(course));
  for (const field of COURSE_FIELDS) {
    if (field.terms.some((term) => includesTerm(text, term))) return field;
  }
  return null;
}

function getMeaningfulKeywords(course = {}) {
  const text = normalizeValue(getCourseText(course));
  const keywords = new Set();
  const field = getCourseField(course);
  if (field) keywords.add(field.id.toLowerCase());
  for (const definition of COURSE_FIELDS) {
    for (const term of definition.terms) {
      if (includesTerm(text, term)) keywords.add(normalizeValue(term).replace(/\s+/g, '_'));
    }
  }
  for (const token of text.match(/[a-z0-9+]+|[가-힣]+/g) || []) {
    if (token.length > 1 && !STOP_WORDS.has(token)) keywords.add(token);
  }
  return keywords;
}

function getInterestMatches(interests = [], course = {}) {
  const courseField = getCourseField(course);
  const tags = new Set(normalizeArray(course.tags || course.tag_list).map(normalizeValue));
  const matches = [];
  for (const interest of normalizeArray(interests)) {
    const value = String(interest || '').trim();
    const interestField = getCourseField({ name: value });
    if (tags.has(normalizeValue(value))) matches.push({ value, field: null });
    else if (courseField && interestField?.id === courseField.id) matches.push({ value, field: courseField });
  }
  const seen = new Set();
  return matches.filter((match) => {
    const key = normalizeValue(match.value);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizedStatus(status) {
  return normalizeValue(status).replace(/[\s-]+/g, '_');
}

function isCompletedStatus(status) {
  return ['completed', 'complete', 'passed'].includes(normalizedStatus(status));
}

function isCurrentStatus(status) {
  return ['enrolled', 'in_progress', 'current'].includes(normalizedStatus(status));
}

function resolveCourse(reference = {}, courses = []) {
  const identifiers = new Set(getCourseIdentifiers(reference));
  return courses.find((course) => getCourseIdentifiers(course)
    .some((identifier) => identifiers.has(identifier))) || reference;
}

function buildHistory(courses = [], options = {}) {
  const completed = [];
  const excluded = new Set();
  for (const value of normalizeArray(options.completedCourseIds)) {
    const normalized = normalizeValue(value);
    if (!normalized) continue;
    excluded.add(normalized);
    const canonical = canonicalCourseName(value);
    if (canonical) excluded.add(canonical);
    completed.push({ ...resolveCourse({ name: String(value), courseId: value }, courses), semester: null });
  }
  for (const enrollment of normalizeArray(options.enrollmentHistory)) {
    const course = resolveCourse(enrollment, courses);
    if (isCompletedStatus(enrollment.status)) {
      getCourseIdentifiers(course).forEach((value) => excluded.add(value));
      completed.push({ ...course, semester: enrollment.semester ?? null });
    } else if (isCurrentStatus(enrollment.status)) {
      getCourseIdentifiers(course).forEach((value) => excluded.add(value));
    }
  }
  return { completed, excluded };
}

function semesterOrdinal(value) {
  const text = normalizeValue(value);
  const match = text.match(/(?:19|20)\d{2}/);
  if (!match) return null;
  let term = 0;
  if (/(fall|autumn|\b2\b|가을)/.test(text)) term = 2;
  else if (/(summer|여름)/.test(text)) term = 1.5;
  else if (/(spring|\b1\b|봄)/.test(text)) term = 1;
  else if (/(winter|겨울)/.test(text)) term = 2.5;
  return Number(match[0]) * 3 + term;
}

function getCourseLevel(course = {}) {
  const text = normalizeValue(getCourseText(course));
  if (/(introduction|intro|basic|foundation|fundamentals|개론|입문|기초)/.test(text)) return 1;
  if (/(advanced|seminar|capstone|고급|세미나|캡스톤)/.test(text)) return 3;
  return 2;
}

function scoreHistoryMatch(candidate, source, recency) {
  const candidateField = getCourseField(candidate);
  const sourceField = getCourseField(source);
  const sameField = Boolean(candidateField && sourceField && candidateField.id === sourceField.id);
  const candidateKeywords = getMeaningfulKeywords(candidate);
  const sourceKeywords = getMeaningfulKeywords(source);
  const overlap = [...candidateKeywords].filter((keyword) => sourceKeywords.has(keyword));
  if (!sameField && overlap.length === 0) return null;
  const similarity = overlap.length / Math.max(1, Math.min(candidateKeywords.size, sourceKeywords.size));
  const candidateYear = getCourseYear(candidate);
  const sourceYear = getCourseYear(source);
  const yearProgression = Number.isInteger(candidateYear) && Number.isInteger(sourceYear) && candidateYear > sourceYear;
  const levelProgression = getCourseLevel(candidate) > getCourseLevel(source);
  const progression = sameField && (yearProgression || levelProgression);
  return {
    score: ((sameField ? 10 : 0) + Math.min(8, similarity * 8) + (progression ? 4 : 0)) * recency,
    source,
    field: candidateField,
  };
}

function getHistorySignal(candidate, completed = []) {
  const ordinals = completed.map((course) => semesterOrdinal(course.semester)).filter(Number.isFinite);
  const newest = ordinals.length ? Math.max(...ordinals) : null;
  let best = null;
  for (const source of completed) {
    const ordinal = semesterOrdinal(source.semester);
    const recency = ordinal === null || newest === null ? 0.75 : Math.max(0.55, 1 - (newest - ordinal) * 0.08);
    const match = scoreHistoryMatch(candidate, source, recency);
    if (match && (!best || match.score > best.score)) best = match;
  }
  return best ? { ...best, score: Math.min(22, Math.round(best.score * 100) / 100) } :
    { score: 0, source: null, field: null };
}

function buildMatchHint(signals) {
  const reasons = [];
  if (signals.major) reasons.push({ weight: 40, text: 'Same department as your major' });
  if (signals.required) reasons.push({ weight: 20, text: 'Required course in your major' });
  if (signals.elective) reasons.push({ weight: 10, text: 'Elective course in your major' });
  if (signals.genEd) reasons.push({ weight: 8, text: 'General education course' });
  if (signals.year.kind === 'exact') reasons.push({ weight: 18, text: 'Recommended for your year level' });
  if (signals.year.kind === 'adjacent') reasons.push({ weight: 10, text: 'Suitable for a nearby year level' });
  if (signals.year.kind === 'all') reasons.push({ weight: 12, text: 'Suitable for students across year levels' });
  if (signals.interests.length) {
    const field = signals.interests.find((match) => match.field)?.field;
    const label = field?.label || signals.interests.slice(0, 2).map((match) => match.value).join(', ');
    reasons.push({ weight: Math.min(signals.interests.length, 2) * 10, text: `Matches your ${label} interest` });
  }
  if (signals.history.source) {
    const name = getCourseDisplayName(signals.history.source);
    if (name) reasons.push({ weight: signals.history.score, text: `Related to ${name}, which you previously completed` });
  }
  return reasons.sort((a, b) => b.weight - a.weight || a.text.localeCompare(b.text))
    .slice(0, 3).map((reason) => reason.text).join('; ');
}

function scoreCourse(student = {}, course = {}, completed = []) {
  const major = isSameMajorCourse(student, course);
  const interests = getInterestMatches(student.interests, course);
  const type = getCourseType(course);
  const required = type === 'REQUIRED' && major;
  const elective = type === 'ELECTIVE' && major;
  const genEd = type === 'GEN_ED';
  const year = getYearSignal(student, course);
  const history = getHistorySignal(course, completed);
  let score = (major ? 40 : 0) + year.score + Math.min(interests.length, 2) * 10 + history.score;
  if (required) score += 20;
  if (elective) score += 10;
  if (genEd) score += 8;
  return {
    score: Math.min(Math.round(score * 100) / 100, 100),
    matchHint: buildMatchHint({ major, interests, required, elective, genEd, year, history }),
  };
}

function compareCourses(a, b) {
  if (b.score !== a.score) return b.score - a.score;
  const typeDifference = (TYPE_PRIORITY[getCourseType(a)] ?? Number.MAX_SAFE_INTEGER) -
    (TYPE_PRIORITY[getCourseType(b)] ?? Number.MAX_SAFE_INTEGER);
  if (typeDifference) return typeDifference;
  const nameDifference = String(a.nameEn || a.title || a.name || '')
    .localeCompare(String(b.nameEn || b.title || b.name || ''));
  return nameDifference || String(a.id ?? a.course_id ?? '').localeCompare(String(b.id ?? b.course_id ?? ''));
}

function recommendCourses(student = {}, courses = [], options = {}) {
  const catalog = normalizeArray(courses);
  const history = buildHistory(catalog, options);
  const requestedType = String(options.type || 'ALL').toUpperCase();
  const limit = Number.isInteger(options.limit) && options.limit > 0 ? options.limit : catalog.length;
  const available = catalog
    .filter((course) => !getCourseIdentifiers(course).some((id) => history.excluded.has(id)))
    .filter((course) => requestedType === 'ALL' || getCourseType(course) === requestedType);
  const scored = available.map((course) => ({
    ...course,
    type: getCourseType(course) || course.type || 'ELECTIVE',
    ...scoreCourse(student, course, history.completed),
  })).sort(compareCourses);
  const matched = scored.filter((course) => course.score >= 40);
  if (matched.length) return matched.slice(0, limit);
  return available.filter((course) => getCourseType(course) === 'GEN_ED')
    .map((course) => ({ ...course, type: 'GEN_ED', score: 15,
      matchHint: 'General education fallback because no course met the personalized matching threshold.' }))
    .sort(compareCourses).slice(0, limit);
}

module.exports = { getCourseField, getMeaningfulKeywords, parseYearLevel, recommendCourses };
