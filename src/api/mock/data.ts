import type {
  ChecklistItem,
  Course,
  GraduationProgress,
  Notification,
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
  name: 'Minh Nguyen',
  nationality: 'Vietnam',
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
  totalRequired: 130,
  totalCompleted: 87,
  breakdown: {
    required: { completed: 45, required: 60 },
    elective: { completed: 27, required: 40 },
    genEd: { completed: 15, required: 30 },
  },
}

export const mockFreshmanGraduation: GraduationProgress = {
  totalRequired: 130,
  totalCompleted: 2,
  breakdown: {
    required: { completed: 0, required: 60 },
    elective: { completed: 0, required: 40 },
    genEd: { completed: 2, required: 30 },
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
    title: 'Major credits requirement',
    description: 'Complete at least 60 credits in your major department.',
    completed: false,
  },
  {
    id: 'gr2',
    title: 'General education requirement',
    description: 'Complete at least 30 credits in General Education courses.',
    completed: true,
  },
  {
    id: 'gr3',
    title: 'TOPIK certificate submission',
    description: 'Submit TOPIK level 4 or higher certificate to the International Student Office.',
    completed: false,
  },
  {
    id: 'gr4',
    title: 'Graduation thesis or exam',
    description: 'Pass your department\'s graduation exam or submit a graduation thesis.',
    completed: false,
  },
  {
    id: 'gr5',
    title: 'Total credits requirement',
    description: 'Earn a total of at least 130 credits.',
    completed: true,
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
