import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const ts = require('typescript')
const frontendRoot = join(dirname(fileURLToPath(import.meta.url)), '..')

function loadTypeScriptModule(relativePath) {
  const source = readFileSync(join(frontendRoot, relativePath), 'utf8')
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const module = { exports: {} }
  Function('module', 'exports', output)(module, module.exports)
  return module.exports
}

const {
  getCourseLanguageBadgeKey,
  getRemoteCourseStatusKey,
  getVerifiedCourseOfferingDisplay,
} = loadTypeScriptModule(
  'src/utils/courseOfferingDisplay.ts',
)
const { mapRecommendedCourse } = loadTypeScriptModule('src/api/real/mappers.ts')

const base = {
  id: '1',
  nameKo: '과목',
  nameEn: 'Course',
  type: 'ELECTIVE',
  credits: 3,
  department: '',
  tags: [],
  score: 50,
}

assert.equal(
  getCourseLanguageBadgeKey({
    isEnglishTaught: true,
    originalLanguageCode: 'E',
    teachingLanguage: 'ENGLISH',
  }),
  'courseOffering.englishTaught',
)
assert.equal(
  getCourseLanguageBadgeKey({
    isEnglishTaught: false,
    originalLanguageCode: 'C',
    teachingLanguage: 'OTHER',
  }),
  'courseOffering.chinese',
)
assert.equal(
  getCourseLanguageBadgeKey({
    isEnglishTaught: null,
    originalLanguageCode: null,
    teachingLanguage: null,
  }),
  null,
)
assert.equal(
  getCourseLanguageBadgeKey({
    isEnglishTaught: null,
    originalLanguageCode: null,
    teachingLanguage: 'MIXED',
  }),
  'courseOffering.mixedLanguage',
)
assert.equal(getRemoteCourseStatusKey(null), null)
assert.equal(getRemoteCourseStatusKey('REMOTE'), 'courseOffering.remote')

const unknown = mapRecommendedCourse(base)
for (const field of [
  'officialCourseNumber',
  'academicYear',
  'semester',
  'section',
  'professor',
  'schedule',
  'remoteCourseStatus',
  'originalLanguageCode',
  'teachingLanguage',
  'isEnglishTaught',
  'theoryHours',
  'practicalHours',
  'presentationRequirement',
  'groupProjectRequirement',
  'assignmentRequirement',
  'examInformation',
]) {
  assert.equal(unknown[field], null, `${field} must preserve unknown as null`)
}
assert.equal(mapRecommendedCourse({ ...base, isEnglishTaught: false }).isEnglishTaught, false)

const fixtureDisplays = [
  { ...base, id: 'english', isEnglishTaught: true, originalLanguageCode: 'E', teachingLanguage: 'ENGLISH' },
  { ...base, id: 'chinese', isEnglishTaught: false, originalLanguageCode: 'C', teachingLanguage: 'OTHER' },
  { ...base, id: 'unknown-language' },
  { ...base, id: 'remote', remoteCourseStatus: 'REMOTE' },
  { ...base, id: 'staffed', professor: 'Professor Kim', schedule: 'Mon 09:00' },
  { ...base, id: 'no-offering' },
].map((fixture) => getVerifiedCourseOfferingDisplay(mapRecommendedCourse(fixture)))

assert.equal(fixtureDisplays[0].languageBadgeKey, 'courseOffering.englishTaught')
assert.equal(fixtureDisplays[1].languageBadgeKey, 'courseOffering.chinese')
assert.equal(fixtureDisplays[2].languageBadgeKey, null)
assert.equal(fixtureDisplays[3].remoteStatusKey, 'courseOffering.remote')
assert.equal(fixtureDisplays[4].professor, 'Professor Kim')
assert.equal(fixtureDisplays[4].schedule, 'Mon 09:00')
assert.deepEqual(fixtureDisplays[5], {
  languageBadgeKey: null,
  remoteStatusKey: null,
  officialCourseNumber: null,
  term: null,
  section: null,
  professor: null,
  schedule: null,
  presentationRequirementKey: null,
  groupProjectRequirementKey: null,
  assignmentRequirementKey: null,
  examInformation: null,
  hasAssessmentMetadata: false,
})

const capstone = getVerifiedCourseOfferingDisplay(mapRecommendedCourse({
  ...base,
  id: 'capstone',
  presentationRequirement: 'REQUIRED',
  groupProjectRequirement: 'REQUIRED',
  assignmentRequirement: 'REQUIRED',
  examInformation: 'Presentation and final work evaluation',
}))
assert.equal(capstone.presentationRequirementKey, 'courseMetadata.presentation.required')
assert.equal(capstone.groupProjectRequirementKey, 'courseMetadata.groupProject.required')
assert.equal(capstone.assignmentRequirementKey, 'courseMetadata.assignment.required')
assert.equal(capstone.hasAssessmentMetadata, true)

const aiProgramming = getVerifiedCourseOfferingDisplay(mapRecommendedCourse({
  ...base,
  id: 'ai-programming',
  presentationRequirement: 'REQUIRED',
  assignmentRequirement: 'REQUIRED',
}))
assert.equal(aiProgramming.presentationRequirementKey, 'courseMetadata.presentation.required')
assert.equal(aiProgramming.groupProjectRequirementKey, null)

const databases = getVerifiedCourseOfferingDisplay(mapRecommendedCourse({
  ...base,
  id: 'databases',
  presentationRequirement: null,
  groupProjectRequirement: null,
  assignmentRequirement: null,
  examInformation: null,
}))
assert.equal(databases.presentationRequirementKey, null)
assert.equal(databases.groupProjectRequirementKey, null)
assert.equal(databases.assignmentRequirementKey, null)
assert.equal(databases.examInformation, null)
assert.equal(databases.hasAssessmentMetadata, false)

for (const id of [
  'computer-architecture',
  'ai-programming',
  'web-application-programming',
  'platform-based-programming',
  'software-engineering',
  'deep-learning-programming',
]) {
  const display = getVerifiedCourseOfferingDisplay(mapRecommendedCourse({
    ...base,
    id,
    assignmentRequirement: 'REQUIRED',
  }))
  assert.equal(display.assignmentRequirementKey, 'courseMetadata.assignment.required')
}

const explicitPresentationNone = getVerifiedCourseOfferingDisplay(mapRecommendedCourse({
  ...base,
  id: 'presentation-none',
  presentationRequirement: 'NONE',
}))
assert.equal(explicitPresentationNone.presentationRequirementKey, null)

console.log('Course offering and metadata frontend tests passed: 48 assertions')
