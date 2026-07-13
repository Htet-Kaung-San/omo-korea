import {
  AlertTriangle,
  BriefcaseBusiness,
  FileText,
  type LucideIcon,
} from 'lucide-react'

export interface SupportCard {
  id: string
  title: string
  description: string
  path: string
  icon: LucideIcon
}

export const supportCards: SupportCard[] = [
  {
    id: 'emergency',
    title: 'Emergency',
    description: '119/112, embassy, nearest help',
    path: '/support/emergency',
    icon: AlertTriangle,
  },
  {
    id: 'work-permit',
    title: 'Part-time Work Permit',
    description: 'Step-by-step application guide',
    path: '/support/work-permit',
    icon: BriefcaseBusiness,
  },
  {
    id: 'related-laws',
    title: 'Related Laws',
    description: 'Visa, labor, housing, rights',
    path: '/support/related-laws',
    icon: FileText,
  },
]

export const emergencyContacts = [
  { id: 'fire-medical', number: '119', label: 'Fire / Medical' },
  { id: 'police', number: '112', label: 'Police' },
  { id: 'disease-control', number: '1339', label: 'Disease control' },
]

export const embassyInfo = {
  countryFlag: '🇲🇳',
  name: 'Embassy of Mongolia',
  phone: '+82-2-794-1350',
  mapQuery: 'Embassy of Mongolia Seoul',
}

export const nearestHelp = [
  {
    id: 'hospital',
    name: "Pusan Nat'l Univ Hospital",
    distance: '850m',
    mapQuery: 'Pusan National University Hospital',
  },
  {
    id: 'police-station',
    name: 'Geumjeong Police Station',
    distance: '2.1km',
    mapQuery: 'Geumjeong Police Station',
  },
]

export const emergencyGuide = {
  text: "Stay calm. Say: '저 다쳤어요 (I'm hurt)' or '도와주세요 (Please help).' Share your location and student ID if possible.",
}

export const workPermit = {
  intro: 'Required before you start any part-time job on a student visa.',
  eligibility: [
    'D-2 visa, min. 1 semester done',
    'TOPIK 3+ or equivalent',
    'Max 25 hrs/week during semester',
    'Unlimited during vacation',
  ],
  steps: [
    'Get consent form from your department.',
    'Apply at Hi Korea or Immigration office.',
    'Receive permit sticker in passport.',
    'Register job with International Center.',
  ],
}

export const lawCategories = ['Visa', 'Labor', 'Housing', 'Rights']

export const relatedLaws = [
  {
    id: 'visa',
    category: 'Visa',
    title: 'Visa & Immigration Act',
    description: 'D-2 status, extension rules, overstay penalties',
  },
  {
    id: 'labor',
    category: 'Labor',
    title: 'Labor Standards Act',
    description: 'Minimum wage, working hours, foreign worker protections',
  },
  {
    id: 'housing',
    category: 'Housing',
    title: '전세/부동산 사기 예방 가이드',
    description: 'Lease contracts and deposit protection',
  },
  {
    id: 'rights',
    category: 'Rights',
    title: 'International Student Legal Rights',
    description: 'Rights and where to get help',
  },
]
