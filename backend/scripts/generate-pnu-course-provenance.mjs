import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { getSource } = require('./lib/pnuCourseOfferings.cjs');
const { SOURCE_FILE } = require('./lib/pnuCourseRestrictions.cjs');
const { datasetChecksum, validatePackage } = require('./lib/pnuCourseApplication.cjs');

const backendRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
const stableHash = (value) => sha256(Buffer.from(JSON.stringify(value), 'utf8'));

const applicationManifest = readJson(join(backendRoot, 'config', 'pnu-course-application-manifest.json'));
const applicationPackagePath = join(backendRoot, 'data', 'local', 'pnu-course-application', '2026-2.json');
const metadataManifestPath = join(backendRoot, 'config', 'pnu-course-metadata-2026-2.json');
const resolutionManifestPath = join(backendRoot, 'config', 'pnu-course-metadata-resolutions-2026-2.json');
const applicationPackageBytes = readFileSync(applicationPackagePath);
const metadataManifestBytes = readFileSync(metadataManifestPath);
const resolutionManifestBytes = readFileSync(resolutionManifestPath);
const applicationPackage = JSON.parse(applicationPackageBytes.toString('utf8'));
const metadataManifest = JSON.parse(metadataManifestBytes.toString('utf8'));
const resolutionManifest = JSON.parse(resolutionManifestBytes.toString('utf8'));
const expectedMetadataManifestSha256 = '288ff7569cff5494e029b12f14aeddd174bbb7083926984b70a3c159bfaaf051';

if (sha256(applicationPackageBytes) !== applicationManifest.applicationPackageFileSha256) {
  throw new Error(`Application package file checksum mismatch: ${sha256(applicationPackageBytes)}`);
}
if (sha256(metadataManifestBytes) !== expectedMetadataManifestSha256) {
  throw new Error(`Metadata manifest checksum mismatch: ${sha256(metadataManifestBytes)}`);
}

validatePackage(applicationPackage, applicationManifest.datasetSha256);

const sourceDirectory = join(backendRoot, 'data', 'source', '2026-2');
const sourcePaths = {
  offeringWorkbook: join(sourceDirectory, getSource(2026, '2').localFileName),
  restrictionWorkbook: join(sourceDirectory, SOURCE_FILE),
};
for (const [key, path] of Object.entries(sourcePaths)) {
  if (!existsSync(path)) continue;
  const expected = key === 'offeringWorkbook'
    ? applicationManifest.sourceOfferingWorkbookSha256
    : applicationManifest.sourceRestrictionWorkbookSha256;
  const actual = sha256(readFileSync(path));
  if (actual !== expected) throw new Error(`${key} checksum mismatch: ${actual}`);
}

const dataset = applicationPackage.dataset;
const assignmentByNumber = new Map(dataset.courseAssignments.map((row) => [row.official_course_number, row]));
const offeringByIdentity = new Map(dataset.courseOfferings.map((row) => [`${row.official_course_number}|${row.section}`, row]));
const resolutionByNumber = new Map(resolutionManifest.entries.map((row) => [row.officialCourseNumber, row]));

const reviewedBasePackage = {
  schemaVersion: dataset.schemaVersion,
  mode: dataset.mode,
  source: dataset.source,
  expectedCounts: dataset.expectedCounts,
  counts: applicationManifest.counts,
  exclusions: dataset.exclusions,
  courseAssignments: dataset.courseAssignments,
  courseOfferings: dataset.courseOfferings,
  courseRestrictions: dataset.courseRestrictions,
  courseRestrictionExceptions: dataset.courseRestrictionExceptions,
};
const reconstructedDataset = {
  schemaVersion: reviewedBasePackage.schemaVersion,
  mode: reviewedBasePackage.mode,
  source: reviewedBasePackage.source,
  expectedCounts: reviewedBasePackage.expectedCounts,
  exclusions: reviewedBasePackage.exclusions,
  courseAssignments: reviewedBasePackage.courseAssignments,
  courseOfferings: reviewedBasePackage.courseOfferings,
  courseRestrictions: reviewedBasePackage.courseRestrictions,
  courseRestrictionExceptions: reviewedBasePackage.courseRestrictionExceptions,
};
if (datasetChecksum(reconstructedDataset) !== applicationManifest.datasetSha256) {
  throw new Error('Normalized provenance cannot reconstruct the reviewed application dataset checksum');
}

const reviewedMetadataPackage = {
  scope: { majorId: resolutionManifest.productionMajor.majorId, section: resolutionManifest.section },
  manifestSha256: expectedMetadataManifestSha256,
  resolutionSha256: sha256(resolutionManifestBytes),
  additionalOfferingIdentities: resolutionManifest.entries.length,
  metadataRows: metadataManifest.entries.length,
  identities: metadataManifest.entries.map((metadata) => {
    const resolution = resolutionByNumber.get(metadata.officialCourseNumber) || null;
    const assignment = assignmentByNumber.get(metadata.officialCourseNumber) || null;
    const offering = resolution || offeringByIdentity.get(`${metadata.officialCourseNumber}|${metadata.section}`) || null;
    return {
      officialCourseNumber: metadata.officialCourseNumber,
      academicYear: metadataManifest.academicYear,
      semester: metadataManifest.semester,
      section: metadata.section,
      courseId: resolution?.courseId ?? assignment?.course_id ?? offering?.course_id ?? null,
      productionCourseName: resolution?.productionCourseName ?? assignment?.expected_course_name ?? null,
      officialKoreanTitle: resolution?.officialCourseName ?? null,
      syllabusEnglishTitle: metadata.courseName,
      credit: resolution?.credit ?? assignment?.expected_credit ?? null,
      category: resolution?.category ?? assignment?.expected_category ?? null,
      offering: offering ? {
        professor: offering.professor ?? null,
        yearLevel: offering.yearLevel ?? offering.year_level ?? null,
        theoryHours: offering.theoryHours ?? offering.theory_hours ?? null,
        practicalHours: offering.practicalHours ?? offering.practical_hours ?? null,
        enrollmentLimit: offering.enrollmentLimit ?? offering.enrollment_limit ?? null,
        schedule: offering.schedule ?? null,
        classroom: offering.classroom ?? null,
        remoteCourseStatus: offering.remoteCourseStatus ?? offering.remote_course_status ?? null,
        originalLanguageCode: offering.originalLanguageCode ?? offering.original_language_code ?? null,
        teachingLanguage: offering.teachingLanguage ?? offering.teaching_language ?? null,
        teamTeachingStatus: offering.teamTeachingStatus ?? offering.team_teaching_status ?? null,
        generalEducationArea: offering.generalEducationArea ?? offering.general_education_area ?? null,
        remarks: offering.remarks ?? null,
        sourceUrl: offering.sourceUrl ?? offering.source_url ?? null,
        retrievedAt: offering.retrievedAt ?? offering.retrieved_at ?? null,
      } : null,
      metadata: {
        presentationRequirement: metadata.presentationRequirement,
        groupProjectRequirement: metadata.groupProjectRequirement,
        assignmentRequirement: metadata.assignmentRequirement,
        examInformation: metadata.examInformation,
      },
      evidence: {
        sourcePdfFilename: metadata.sourcePdfFilename,
        sourcePdfSha256: metadata.sourcePdfSha256,
        evidenceText: metadata.evidenceText,
        pageReference: null,
        verifiedAt: metadata.verifiedAt,
      },
    };
  }),
};

const normalizedPayloadSha256 = stableHash({ reviewedBasePackage, reviewedMetadataPackage });
const provenance = {
  schemaVersion: 2,
  academicYear: applicationManifest.academicYear,
  semester: applicationManifest.semester,
  applicationDatasetSha256: applicationManifest.datasetSha256,
  applicationPackageFileSha256: applicationManifest.applicationPackageFileSha256,
  normalizedPayloadSha256,
  sources: {
    offeringWorkbook: {
      logicalName: getSource(2026, '2').localFileName,
      sha256: applicationManifest.sourceOfferingWorkbookSha256,
      normalizedSnapshotSha256: applicationManifest.sourceOfferingSnapshotSha256,
    },
    restrictionWorkbook: {
      logicalName: SOURCE_FILE,
      sha256: applicationManifest.sourceRestrictionWorkbookSha256,
      normalizedSnapshotSha256: applicationManifest.sourceRestrictionSnapshotSha256,
    },
  },
  reviewedBasePackage,
  reviewedMetadataPackage,
};

writeFileSync(
  join(backendRoot, 'config', 'pnu-course-provenance-2026-2.json'),
  `${JSON.stringify(provenance, null, 2)}\n`,
  'utf8',
);
console.log(`Wrote normalized provenance ${normalizedPayloadSha256}`);
