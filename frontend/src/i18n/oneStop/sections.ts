export const ONE_STOP_PORTAL_URL = 'https://onestop.pusan.ac.kr/main'

export interface OneStopSectionDef {
  id: string
  titleKey: string
  stepKeys: string[]
  relatedPages?: { labelKey: string; href: string }[]
  noteKey?: string
}

export const oneStopSectionDefs: OneStopSectionDef[] = [
  {
    id: 'registration',
    titleKey: 'oneStop.registration.title',
    stepKeys: [
      'oneStop.registration.step1',
      'oneStop.registration.step2',
      'oneStop.registration.step3',
      'oneStop.registration.step4',
      'oneStop.registration.step5',
    ],
    relatedPages: [
      {
        labelKey: 'oneStop.registration.related.addDrop',
        href: 'https://onestop.pusan.ac.kr/page?menuCD=000000000000044',
      },
      {
        labelKey: 'oneStop.registration.related.cancellation',
        href: 'https://onestop.pusan.ac.kr/page?menuCD=000000000000358',
      },
      {
        labelKey: 'oneStop.registration.related.timetable',
        href: 'https://onestop.pusan.ac.kr/page?menuCD=000000000000366',
      },
    ],
    noteKey: 'oneStop.registration.note',
  },
  {
    id: 'cancellation',
    titleKey: 'oneStop.cancellation.title',
    stepKeys: [
      'oneStop.cancellation.step1',
      'oneStop.cancellation.step2',
      'oneStop.cancellation.step3',
      'oneStop.cancellation.step4',
    ],
    noteKey: 'oneStop.cancellation.note',
  },
  {
    id: 'grades',
    titleKey: 'oneStop.grades.title',
    stepKeys: [
      'oneStop.grades.step1',
      'oneStop.grades.step2',
      'oneStop.grades.step3',
      'oneStop.grades.step4',
    ],
    noteKey: 'oneStop.grades.note',
  },
  {
    id: 'tuition',
    titleKey: 'oneStop.tuition.title',
    stepKeys: [
      'oneStop.tuition.step1',
      'oneStop.tuition.step2',
      'oneStop.tuition.step3',
      'oneStop.tuition.step4',
      'oneStop.tuition.step5',
    ],
    noteKey: 'oneStop.tuition.note',
  },
  {
    id: 'leave-return',
    titleKey: 'oneStop.leaveReturn.title',
    stepKeys: [
      'oneStop.leaveReturn.step1',
      'oneStop.leaveReturn.step2',
      'oneStop.leaveReturn.step3',
    ],
    noteKey: 'oneStop.leaveReturn.note',
  },
]
