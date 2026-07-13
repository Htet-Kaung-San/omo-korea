import type {
  ChecklistItem,
  Course,
  EmergencyGuide,
  CampusFacilities,
  GraduationProgress,
  Notification,
  ProgramItem,
  ScholarshipItem,
  User,
} from '@/types/api'
import {
  INTEREST_OPTIONS,
  MAJOR_OPTIONS,
  NATIONALITY_OPTIONS,
} from '@/data/options'

export { INTEREST_OPTIONS, MAJOR_OPTIONS, NATIONALITY_OPTIONS }

export const DEMO_STUDENT_ID = '202012345'
export const DEMO_PASSWORD = 'password'

export const mockUser: User = {
  studentId: DEMO_STUDENT_ID,
  name: 'Hong Gildong',
  nationality: 'Chinese',
  major: 'Computer Science & Engineering',
  interests: ['AI', 'Data Science', 'Korean Language'],
}

export const mockCourses: Course[] = [
  {
    id: 'c1',
    nameKo: '컴퓨터공학개론',
    nameEn: 'Introduction to Computer Science',
    type: 'REQUIRED',
    credits: 3,
    department: 'Computer Science & Engineering',
    tags: ['AI', 'Data Science'],
  },
  {
    id: 'c2',
    nameKo: '자료구조',
    nameEn: 'Data Structures',
    type: 'REQUIRED',
    credits: 3,
    department: 'Computer Science & Engineering',
    tags: ['Data Science'],
  },
  {
    id: 'c3',
    nameKo: '인공지능개론',
    nameEn: 'Introduction to Artificial Intelligence',
    type: 'ELECTIVE',
    credits: 3,
    department: 'Computer Science & Engineering',
    tags: ['AI', 'Robotics'],
  },
  {
    id: 'c4',
    nameKo: '경영학원론',
    nameEn: 'Principles of Management',
    type: 'ELECTIVE',
    credits: 3,
    department: 'Business Administration',
    tags: ['Business'],
  },
  {
    id: 'c5',
    nameKo: '대학영어',
    nameEn: 'College English',
    type: 'GEN_ED',
    credits: 2,
    department: 'General Education',
    tags: ['Korean Language'],
  },
  {
    id: 'c6',
    nameKo: '창의적설계',
    nameEn: 'Creative Design Thinking',
    type: 'GEN_ED',
    credits: 2,
    department: 'General Education',
    tags: ['Design'],
  },
  {
    id: 'c7',
    nameKo: '기계설계',
    nameEn: 'Mechanical Design',
    type: 'REQUIRED',
    credits: 3,
    department: 'Mechanical Engineering',
    tags: ['Robotics'],
  },
  {
    id: 'c8',
    nameKo: '머신러닝',
    nameEn: 'Machine Learning',
    type: 'ELECTIVE',
    credits: 3,
    department: 'Computer Science & Engineering',
    tags: ['AI', 'Data Science'],
  },
]

export const mockGraduation: GraduationProgress = {
  totalRequired: 133,
  totalCompleted: 73,
  breakdown: {
    generalRequired: { completed: 10, required: 10 },
    generalElective: { completed: 12, required: 15 },
    majorBasic: { completed: 25, required: 25 },
    majorRequired: { completed: 17, required: 43 },
    majorElective: { completed: 6, required: 34 },
    generalFree: { completed: 3, required: 6 },
  },
}

export const mockFreshmanGraduation: GraduationProgress = {
  totalRequired: 133,
  totalCompleted: 2,
  breakdown: {
    generalRequired: { completed: 2, required: 10 },
    generalElective: { completed: 0, required: 15 },
    majorBasic: { completed: 0, required: 25 },
    majorRequired: { completed: 0, required: 43 },
    majorElective: { completed: 0, required: 34 },
    generalFree: { completed: 0, required: 6 },
  },
}

export const mockNotifications: Notification[] = [
  {
    id: 'n1',
    title: 'Fall 2026 Course Registration',
    body: 'Registration opens Aug 10 and closes Aug 14. Prepare your course list in advance.',
    date: '2026-08-10',
    category: 'REGISTRATION',
    priority: 'HIGH',
  },
  {
    id: 'n2',
    title: 'Tuition Payment Deadline',
    body: 'Second-semester tuition must be paid by Aug 25 to avoid late fees.',
    date: '2026-08-25',
    category: 'DEADLINE',
    priority: 'HIGH',
  },
  {
    id: 'n3',
    title: 'International Student Orientation',
    body: 'Welcome session for new international students — Mar 3, 2 PM at International House.',
    date: '2026-03-03',
    category: 'GENERAL',
    priority: 'NORMAL',
  },
  {
    id: 'n4',
    title: 'Add/Drop Period Ends',
    body: 'Last day to add or drop courses without transcript notation: Sep 5.',
    date: '2026-09-05',
    category: 'DEADLINE',
    priority: 'NORMAL',
  },
]

export const mockChecklist: ChecklistItem[] = [
  {
    id: 'cl1',
    title: 'Alien registration',
    description: 'Apply for your 외국인등록증 at the local immigration office within 90 days of arrival.',
    completed: false,
  },
  {
    id: 'cl2',
    title: 'Bank account',
    description: 'Open a local bank account for tuition payments and daily expenses.',
    completed: true,
  },
  {
    id: 'cl3',
    title: 'SIM card',
    description: 'Get a Korean mobile plan for campus alerts and two-factor authentication.',
    completed: false,
  },
]

export const mockGraduationChecklist: ChecklistItem[] = [
  {
    id: 'gr1',
    title: 'General Required credits (교양필수)',
    description: 'Complete all 10 required General Education credits (교양필수).',
    completed: true,
    creditRequirement: { category: 'generalRequired' },
  },
  {
    id: 'gr2',
    title: 'General Elective credits (교양선택)',
    description: 'Complete all 15 General Elective credits (교양선택).',
    completed: false,
    creditRequirement: { category: 'generalElective' },
  },
  {
    id: 'gr3',
    title: 'Major Basic credits (전공기초)',
    description: 'Complete all 25 Major Basic credits (전공기초).',
    completed: true,
    creditRequirement: { category: 'majorBasic' },
  },
  {
    id: 'gr4',
    title: 'Major Required credits (전공필수)',
    description: 'Complete all 43 Major Required credits (전공필수).',
    completed: false,
    creditRequirement: { category: 'majorRequired' },
  },
  {
    id: 'gr5',
    title: 'Major Elective credits (전공선택)',
    description: 'Complete all 34 Major Elective credits (전공선택).',
    completed: false,
    creditRequirement: { category: 'majorElective' },
  },
  {
    id: 'gr6',
    title: 'General Free Elective credits (일반선택)',
    description: 'Complete all 6 General Free Elective credits (일반선택).',
    completed: false,
    creditRequirement: { category: 'generalFree' },
  },
  {
    id: 'gr7',
    title: 'Total credit requirement',
    description: 'Earn the full cumulative total of 133 credits.',
    completed: false,
    creditRequirement: { category: 'total' },
  },
  {
    id: 'gr8',
    title: 'TOPIK certificate submission',
    description: 'Submit TOPIK level 4 or higher certificate to the International Student Office.',
    completed: false,
  },
  {
    id: 'gr9',
    title: 'Graduation thesis or exam',
    description: "Pass your department's graduation exam or submit a graduation thesis.",
    completed: false,
    creditRequirement: { category: 'total' },
  },
]

export const mockChatIntents: { keywords: string[]; reply: string; intentId: string }[] = [
  {
    intentId: 'registration',
    keywords: ['registration', 'register', 'course registration', 'enroll'],
    reply: 'Course registration for Fall 2026 is Aug 10–14. Log in to the PNU portal and complete your cart before the deadline.',
  },
  {
    intentId: 'credits',
    keywords: ['credit', 'credits', 'graduation credits'],
    reply: 'Most undergraduate programs require 130 total credits: Required (~60), Elective (~40), and Gen-Ed (~30). Check your major handbook for exact numbers.',
  },
  {
    intentId: 'add-drop',
    keywords: ['add', 'drop', 'add/drop', 'withdraw'],
    reply: 'The add/drop period for Fall 2026 ends Sep 5. Changes after that date may appear on your transcript.',
  },
  {
    intentId: 'dorm',
    keywords: ['dorm', 'dormitory', 'housing', 'residence'],
    reply: 'International students can apply for on-campus housing through the dorm office. Applications typically open one semester ahead.',
  },
  {
    intentId: 'cafeteria',
    keywords: ['cafeteria', 'food', 'meal', 'dining'],
    reply: 'Student cafeterias are located near the main library and engineering building. Hours are generally 7:30 AM – 7:00 PM on weekdays.',
  },
  {
    intentId: 'library',
    keywords: ['library', 'study', 'books'],
    reply: 'The central library is open Mon–Fri 8 AM – 10 PM. Bring your student ID for entry and book checkout.',
  },
  {
    intentId: 'international-office',
    keywords: ['international', 'visa', 'alien', 'foreigner'],
    reply: 'Visit the International Student Office (Building 123) Mon–Fri 9 AM – 5 PM for visa, alien registration, and exchange program questions.',
  },
  {
    intentId: 'tuition',
    keywords: ['tuition', 'payment', 'fee', 'fees'],
    reply: 'Tuition for the upcoming semester is due Aug 25. Pay through the student portal or at designated bank counters.',
  },
  {
    intentId: 'major',
    keywords: ['major', 'department', 'change major'],
    reply: 'To change your major, submit a transfer application to your current department during the designated period each semester.',
  },
  {
    intentId: 'orientation',
    keywords: ['orientation', 'welcome', 'new student'],
    reply: 'International student orientation is Mar 3 at 2 PM at International House. Attendance is strongly recommended.',
  },
]

export const CHAT_FALLBACK =
  "I don't have an answer for that. Contact the International Student Office at iso@pnu.ac.kr or visit Building 123."

export const CHAT_SUGGESTIONS = [
  'Course registration',
  'Graduation credits',
  'Dorm housing',
  'Alien registration',
  'Library hours',
  'Tuition payment',
]

export const mockCareerOpportunities = [
  {
    id: 'mock-ai-engineer-intern',
    source: 'jobkorea',
    company: 'PNU AI Lab',
    title: 'AI Research Intern (Entry-level)',
    deadline: '~08/15(금)',
    role: 'AI Engineer',
    applicationType: '즉시지원',
    sourceUrl: 'https://www.jobkorea.co.kr/theme/entry-level-internship',
  },
  {
    id: 'mock-data-analyst',
    source: 'jobkorea',
    company: 'Busan Data Co.',
    title: 'Junior Data Analyst',
    deadline: '~08/20(수)',
    role: 'Data Scientist',
    applicationType: '홈페이지',
    sourceUrl: 'https://www.jobkorea.co.kr/theme/entry-level-internship',
  },
  {
    id: 'mock-ux-designer',
    source: 'jobkorea',
    company: 'Design Studio KR',
    title: 'UX/UI Designer (New Graduate)',
    deadline: '~08/10(일)',
    role: 'Product Designer',
    applicationType: '즉시지원',
    sourceUrl: 'https://www.jobkorea.co.kr/theme/entry-level-internship',
  },
  {
    id: 'mock-backend-developer',
    source: 'jobkorea',
    company: 'Startup Connect',
    title: 'Backend Developer Internship',
    deadline: '~08/25(화)',
    role: 'Backend Developer',
    applicationType: '즉시지원',
    sourceUrl: 'https://www.jobkorea.co.kr/theme/entry-level-internship',
  },
  {
    id: 'mock-marketing-intern',
    source: 'jobkorea',
    company: 'Global Brands Korea',
    title: 'Marketing Intern (Entry-level)',
    deadline: '~08/18(월)',
    role: 'Marketing Planner',
    applicationType: '홈페이지',
    sourceUrl: 'https://www.jobkorea.co.kr/theme/entry-level-internship',
  },
  {
    id: 'mock-system-engineer',
    source: 'jobkorea',
    company: 'Hyewoom Tech',
    title: 'System Engineer (New Graduate)',
    deadline: '~07/31(금)',
    role: 'System Engineer',
    applicationType: '즉시지원',
    sourceUrl: 'https://www.jobkorea.co.kr/theme/entry-level-internship',
  },
]

export const programs: ProgramItem[] = [
  {
    id: 'p1',
    title: 'AI Agent 해커톤 2026',
    description: 'Build AI-powered student support tools with teammates from across PNU.',
    date: '2026.07.18',
    category: 'Hackathon',
  },
  {
    id: 'p2',
    title: 'PNU 창업동아리 모집',
    description: 'Join startup clubs and meet peers interested in entrepreneurship.',
    date: '2026.07.25',
    category: 'Club',
  },
  {
    id: 'p3',
    title: 'International Student Career Camp',
    description: 'Resume, interview, and networking sessions for international students.',
    date: '2026.08.02',
    category: 'Career',
  },
]

export const mockPrograms = programs

export const scholarships: ScholarshipItem[] = [
  {
    id: 's1',
    title: 'GKS Scholarship',
    deadline: 'D-7',
    description: 'Government scholarship opportunity for international students.',
    eligibility: 'International students with strong academic records.',
  },
  {
    id: 's2',
    title: '정보컴퓨터공학과 성적우수',
    deadline: 'D-21',
    description: 'Department merit scholarship for outstanding academic performance.',
    eligibility: 'Computer Science & Engineering students with high GPA.',
  },
  {
    id: 's3',
    title: 'International Student Support Scholarship',
    deadline: 'D-30',
    description: 'Need-based support for enrolled international students.',
    eligibility: 'International students who submit financial support documents.',
  },
]

export const mockScholarships = scholarships

export const mockEmergencyGuide: EmergencyGuide = {
  quick_access: {
    police: { number: '112', label: 'Police' },
    fire_medical: { number: '119', label: 'Fire / Medical' },
    disease_control: { number: '1339', label: 'Disease control' },
  },
  database_contacts: [
    {
      id: 'embassy-mongolia',
      type: 'embassy',
      name: 'Embassy of Mongolia',
      phone: '+82-2-794-1350',
      country_flag: '🇲🇳',
      map_query: 'Embassy of Mongolia Seoul',
    },
    {
      id: 'hospital-pnu',
      type: 'hospital',
      name: "Pusan Nat'l Univ Hospital",
      phone: null,
      distance: '850m',
      map_query: 'Pusan National University Hospital',
    },
    {
      id: 'police-geumjeong',
      type: 'police_station',
      name: 'Geumjeong Police Station',
      phone: null,
      distance: '2.1km',
      map_query: 'Geumjeong Police Station',
    },
  ],
  guide_text:
    "Stay calm. Say: '저 다쳤어요 (I'm hurt)' or '도와주세요 (Please help).' Share your location and student ID if possible.",
}

export const mockCampusFacilities: CampusFacilities = {
  shuttle_bus_metadata: {
    key_stops: [
      { id: 'main-gate', name: 'Main Gate', description: 'Central campus entrance' },
      { id: 'library', name: 'Central Library', description: 'Library stop' },
      { id: 'engineering', name: 'Engineering Building', description: 'Engineering complex' },
      { id: 'dormitory', name: 'International Dormitory', description: 'On-campus housing' },
    ],
  },
  cafeterias: [
    {
      id: 'busan-geumjeong-staff',
      name: '금정회관 교직원 식당',
      menu: {
        week_label: '07월 13일 ~ 07월 18일',
        week_start: '2026-07-13',
        week_end: '2026-07-18',
        prev_menu_date: '2026-07-10',
        next_menu_date: '2026-07-20',
        rows: [
          {
            meal_type: '조식',
            meal_label: '조식\n미운영',
            columns: [
              { day: 'mon', day_label: '월 2026.07.13', price: null, items: [], note: '미운영' },
              { day: 'tue', day_label: '화 2026.07.14', price: null, items: [], note: '미운영' },
              { day: 'wed', day_label: '수 2026.07.15', price: null, items: [], note: '미운영' },
              { day: 'thu', day_label: '목 2026.07.16', price: null, items: [], note: '미운영' },
              { day: 'fri', day_label: '금 2026.07.17', price: null, items: [], note: '미운영' },
              { day: 'sat', day_label: '토 2026.07.18', price: null, items: [], note: '미운영' },
            ],
          },
          {
            meal_type: '중식',
            meal_label: '중식\n11:00~15:00',
            columns: [
              {
                day: 'mon',
                day_label: '월 2026.07.13',
                price: '정식-6,500원',
                items: ['백미밥', '모듬햄김치국', '치킨스테이크/머스터드'],
                note: null,
              },
              {
                day: 'tue',
                day_label: '화 2026.07.14',
                price: '정식-6,500원',
                items: ['백미밥', '북어배추장국', '돈육불고기(상추쌈)'],
                note: null,
              },
              {
                day: 'wed',
                day_label: '수 2026.07.15',
                price: '정식-6,500원',
                items: ['백미밥', '반계탕', '돈가스/소스'],
                note: null,
              },
              {
                day: 'thu',
                day_label: '목 2026.07.16',
                price: '정식-6,500원',
                items: ['흑미밥', '우육탕', '꿔바로우/소스'],
                note: null,
              },
              { day: 'fri', day_label: '금 2026.07.17', price: null, items: [], note: null },
              { day: 'sat', day_label: '토 2026.07.18', price: null, items: [], note: null },
            ],
          },
          {
            meal_type: '석식',
            meal_label: '석식',
            columns: [
              { day: 'mon', day_label: '월 2026.07.13', price: null, items: [], note: null },
              { day: 'tue', day_label: '화 2026.07.14', price: null, items: [], note: null },
              { day: 'wed', day_label: '수 2026.07.15', price: null, items: [], note: null },
              { day: 'thu', day_label: '목 2026.07.16', price: null, items: [], note: null },
              { day: 'fri', day_label: '금 2026.07.17', price: null, items: [], note: null },
              { day: 'sat', day_label: '토 2026.07.18', price: null, items: [], note: null },
            ],
          },
        ],
      },
    },
    {
      id: 'busan-geumjeong-student',
      name: '금정회관 학생 식당',
      menu: {
        week_label: '07월 13일 ~ 07월 18일',
        week_start: '2026-07-13',
        week_end: '2026-07-18',
        prev_menu_date: '2026-07-10',
        next_menu_date: '2026-07-20',
        rows: [],
      },
    },
    {
      id: 'busan-student-hall',
      name: '학생회관 학생 식당',
      menu: {
        week_label: '07월 13일 ~ 07월 18일',
        week_start: '2026-07-13',
        week_end: '2026-07-18',
        prev_menu_date: '2026-07-10',
        next_menu_date: '2026-07-20',
        rows: [],
      },
    },
  ],
  cafeteria_source: 'mock',
  scraped_at: '2026-07-13T00:00:00.000Z',
}
