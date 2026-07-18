import {
  AlertTriangle,
  BookOpen,
  BookMarked,
  IdCard,
  FileBadge,
  Headset,
  CircleHelp,
  MessageSquarePlus,
  type LucideIcon,
} from 'lucide-react'

export type HelpTopicTone =
  | 'emergency'
  | 'onestop'
  | 'library'
  | 'contact'
  | 'permit'
  | 'app'

export interface HelpTopic {
  id: string
  titleKey: string
  descriptionKey: string
  path: string
  icon: LucideIcon
  tone: HelpTopicTone
}

export interface HelpMoreItem {
  id: string
  titleKey: string
  descriptionKey: string
  path: string
  icon: LucideIcon
}

export const helpTopicToneStyles: Record<
  HelpTopicTone,
  { iconWrap: string; icon: string; title: string }
> = {
  emergency: {
    iconWrap: 'bg-rose-50',
    icon: 'text-rose-500',
    title: 'text-rose-600',
  },
  onestop: {
    iconWrap: 'bg-emerald-50',
    icon: 'text-emerald-600',
    title: 'text-emerald-700',
  },
  library: {
    iconWrap: 'bg-violet-50',
    icon: 'text-violet-600',
    title: 'text-violet-700',
  },
  contact: {
    iconWrap: 'bg-orange-50',
    icon: 'text-orange-500',
    title: 'text-orange-600',
  },
  permit: {
    iconWrap: 'bg-teal-50',
    icon: 'text-teal-600',
    title: 'text-teal-700',
  },
  app: {
    iconWrap: 'bg-sky-50',
    icon: 'text-sky-600',
    title: 'text-sky-700',
  },
}

export const helpTopics: HelpTopic[] = [
  {
    id: 'emergency',
    titleKey: 'support.topic.emergency',
    descriptionKey: 'support.topic.emergencyDesc',
    path: '/support/emergency',
    icon: AlertTriangle,
    tone: 'emergency',
  },
  {
    id: 'one-stop',
    titleKey: 'support.topic.oneStop',
    descriptionKey: 'support.topic.oneStopDesc',
    path: '/campus-life/one-stop',
    icon: BookMarked,
    tone: 'onestop',
  },
  {
    id: 'library',
    titleKey: 'support.topic.library',
    descriptionKey: 'support.topic.libraryDesc',
    path: '/campus-life/library',
    icon: BookOpen,
    tone: 'library',
  },
  {
    id: 'contact',
    titleKey: 'support.topic.contact',
    descriptionKey: 'support.topic.contactDesc',
    path: '/support/contact',
    icon: IdCard,
    tone: 'contact',
  },
  {
    id: 'work-permit',
    titleKey: 'support.topic.workPermit',
    descriptionKey: 'support.topic.workPermitDesc',
    path: '/support/work-permit',
    icon: FileBadge,
    tone: 'permit',
  },
  {
    id: 'app-support',
    titleKey: 'support.topic.appSupport',
    descriptionKey: 'support.topic.appSupportDesc',
    path: '/support/app',
    icon: Headset,
    tone: 'app',
  },
]

export const helpMoreItems: HelpMoreItem[] = [
  {
    id: 'faq',
    titleKey: 'support.more.faq',
    descriptionKey: 'support.more.faqDesc',
    path: '/support/faq',
    icon: CircleHelp,
  },
  {
    id: 'feedback',
    titleKey: 'support.more.feedback',
    descriptionKey: 'support.more.feedbackDesc',
    path: '/support/feedback',
    icon: MessageSquarePlus,
  },
]

/** Kept for WorkPermit / RelatedLaws / Emergency static fallbacks */
export const supportCards = [
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
    icon: FileBadge,
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
