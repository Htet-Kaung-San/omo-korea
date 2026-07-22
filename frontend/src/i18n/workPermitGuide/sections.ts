export const HI_KOREA_URL = 'https://www.hikorea.go.kr'

export interface WorkPermitTableDef {
  titleKey?: string
  headerKeys: string[]
  rowKeys: string[][]
}

export interface WorkPermitSectionDef {
  id: string
  titleKey: string
  bulletKeys?: string[]
  stepKeys?: string[]
  tables?: WorkPermitTableDef[]
  hoursTable?: boolean
  tableFirst?: boolean
  relatedPages?: { labelKey: string; href: string }[]
  noteKey?: string
}

export const workPermitSectionDefs: WorkPermitSectionDef[] = [
  {
    id: 'basics',
    titleKey: 'workPermit.basics.title',
    bulletKeys: [
      'workPermit.basics.point1',
      'workPermit.basics.point2',
      'workPermit.basics.point3',
    ],
    noteKey: 'workPermit.basics.note',
  },
  {
    id: 'eligibility',
    titleKey: 'workPermit.eligibility.title',
    bulletKeys: [
      'workPermit.eligibility.point1',
      'workPermit.eligibility.point2',
      'workPermit.eligibility.point3',
      'workPermit.eligibility.point4',
    ],
    tables: [
      {
        titleKey: 'workPermit.eligibility.languageTable.title',
        headerKeys: [
          'workPermit.eligibility.languageTable.colLevel',
          'workPermit.eligibility.languageTable.colKorean',
          'workPermit.eligibility.languageTable.colEnglish',
        ],
        rowKeys: [
          [
            'workPermit.eligibility.languageTable.row1Level',
            'workPermit.eligibility.languageTable.row1Korean',
            'workPermit.eligibility.languageTable.row1English',
          ],
          [
            'workPermit.eligibility.languageTable.row2Level',
            'workPermit.eligibility.languageTable.row2Korean',
            'workPermit.eligibility.languageTable.row2English',
          ],
        ],
      },
    ],
    noteKey: 'workPermit.eligibility.note',
  },
  {
    id: 'hours',
    titleKey: 'workPermit.hours.title',
    tableFirst: true,
    hoursTable: true,
    bulletKeys: [
      'workPermit.hours.bonus1',
      'workPermit.hours.bonus2',
      'workPermit.hours.bonus3',
    ],
    noteKey: 'workPermit.hours.note',
  },
  {
    id: 'documents',
    titleKey: 'workPermit.documents.title',
    bulletKeys: [
      'workPermit.documents.item1',
      'workPermit.documents.item2',
      'workPermit.documents.item3',
      'workPermit.documents.item4',
      'workPermit.documents.item5',
      'workPermit.documents.item6',
      'workPermit.documents.item7',
    ],
    noteKey: 'workPermit.documents.note',
  },
  {
    id: 'apply',
    titleKey: 'workPermit.apply.title',
    stepKeys: [
      'workPermit.apply.step1',
      'workPermit.apply.step2',
      'workPermit.apply.step3',
      'workPermit.apply.step4',
    ],
    relatedPages: [
      {
        labelKey: 'workPermit.apply.related.hiKorea',
        href: HI_KOREA_URL,
      },
    ],
    noteKey: 'workPermit.apply.note',
  },
  {
    id: 'restrictions',
    titleKey: 'workPermit.restrictions.title',
    bulletKeys: [
      'workPermit.restrictions.item1',
      'workPermit.restrictions.item2',
      'workPermit.restrictions.item3',
      'workPermit.restrictions.item4',
      'workPermit.restrictions.item5',
      'workPermit.restrictions.item6',
    ],
  },
  {
    id: 'violations',
    titleKey: 'workPermit.violations.title',
    tables: [
      {
        headerKeys: [
          'workPermit.violations.table.colSituation',
          'workPermit.violations.table.colResult',
        ],
        rowKeys: [
          [
            'workPermit.violations.table.row1Situation',
            'workPermit.violations.table.row1Result',
          ],
          [
            'workPermit.violations.table.row2Situation',
            'workPermit.violations.table.row2Result',
          ],
          [
            'workPermit.violations.table.row3Situation',
            'workPermit.violations.table.row3Result',
          ],
          [
            'workPermit.violations.table.row4Situation',
            'workPermit.violations.table.row4Result',
          ],
        ],
      },
    ],
    noteKey: 'workPermit.violations.note',
  },
]
