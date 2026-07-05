const assert = require('assert');
const { normalizeScholarshipRow } = require('./scholarshipDataAdapter');

const camelCaseRow = {
  id: 'sch-1',
  title: 'Academic Excellence Scholarship',
  deadline: '2026-10-01',
  description: 'For strong academic records.',
  amount: '1,000,000 KRW',
  provider: 'PNU',
  eligibleMajors: ['Computer Science', 'Business'],
  eligibleNationalities: ['Mongolia', 'Vietnam'],
  minGpa: 3.5,
  minTopikLevel: 4,
  minYear: 2,
  maxYear: 4,
  tags: ['academic', 'international'],
};

assert.deepStrictEqual(normalizeScholarshipRow(camelCaseRow), camelCaseRow);

assert.deepStrictEqual(
  normalizeScholarshipRow({
    id: 'sch-2',
    scholarship_name: 'Global Student Scholarship',
    deadline: '2026-11-15',
    details: 'For international students.',
    scholarship_amount: '500,000 KRW',
    organization: 'International Office',
    eligible_majors: ['Engineering'],
    eligible_nationalities: ['Uzbekistan'],
    min_gpa: '3.0',
    min_topik_level: '3',
    min_year: '1',
    max_year: '3',
    keyword_tags: ['global'],
  }),
  {
    id: 'sch-2',
    title: 'Global Student Scholarship',
    deadline: '2026-11-15',
    description: 'For international students.',
    amount: '500,000 KRW',
    provider: 'International Office',
    eligibleMajors: ['Engineering'],
    eligibleNationalities: ['Uzbekistan'],
    minGpa: '3.0',
    minTopikLevel: '3',
    minYear: '1',
    maxYear: '3',
    tags: ['global'],
  }
);

assert.deepStrictEqual(
  normalizeScholarshipRow({
    eligible_majors: 'Computer Science, Business, Engineering',
    eligible_nationalities: 'Mongolia, Vietnam',
    keyword_tags: 'academic, international, topik',
  }),
  {
    id: undefined,
    title: undefined,
    deadline: undefined,
    description: undefined,
    amount: undefined,
    provider: undefined,
    eligibleMajors: ['Computer Science', 'Business', 'Engineering'],
    eligibleNationalities: ['Mongolia', 'Vietnam'],
    minGpa: undefined,
    minTopikLevel: undefined,
    minYear: undefined,
    maxYear: undefined,
    tags: ['academic', 'international', 'topik'],
  }
);

assert.deepStrictEqual(
  normalizeScholarshipRow({
    id: 'sch-3',
    title: 'Needs Defaults',
    eligibleMajors: null,
    eligibleNationalities: undefined,
    tags: null,
  }),
  {
    id: 'sch-3',
    title: 'Needs Defaults',
    deadline: undefined,
    description: undefined,
    amount: undefined,
    provider: undefined,
    eligibleMajors: [],
    eligibleNationalities: [],
    minGpa: undefined,
    minTopikLevel: undefined,
    minYear: undefined,
    maxYear: undefined,
    tags: [],
  }
);

assert.strictEqual(normalizeScholarshipRow(null), null);

console.log('PASS');
