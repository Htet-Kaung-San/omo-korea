import type { MessageDictionary } from '../../types'

const messages: MessageDictionary = {
  'workPermit.subtitle': 'Part-time work permit for international students (시간제 취업허가)',
  'workPermit.disclaimerTitle': 'Important',
  'workPermit.disclaimer':
    'This is immigration law — not a campus form. Wrong details can lead to penalties, work bans, or loss of student status. Confirm with PNU International Affairs (국제처) or Immigration helpline **1345** before applying.',
  'workPermit.sourceDate': 'Based on MOJ guidance, Feb 2026. Official rules may change — check [Hi Korea](https://www.hikorea.go.kr) for updates.',
  'workPermit.keyPoints': 'Key points',
  'workPermit.steps': 'Steps',
  'workPermit.relatedPages': 'Related links',
  'workPermit.note': 'Note',

  'workPermit.basics.title': 'Do You Need a Permit? (기본원칙)',
  'workPermit.basics.point1':
    'D-2 student visa holders **cannot work or earn income** in Korea without permission — including part-time jobs (아르바이트).',
  'workPermit.basics.point2':
    'With approval from **both** your university and immigration, limited part-time work is allowed.',
  'workPermit.basics.point3':
    'Specialized jobs (E-1~E-7, e.g. language instruction) generally need a separate **체류자격외 활동허가** — not this permit.',
  'workPermit.basics.note':
    'This guide covers standard part-time work only. Research/domestic-care permits are separate topics.',

  'workPermit.eligibility.title': 'Eligibility (대상자 요건)',
  'workPermit.eligibility.point1':
    '**GPA:** C (2.0) or above in your most recent semester. First semester: exempt if no transcript yet, but hours are capped at half.',
  'workPermit.eligibility.point2':
    '**Language:** See table below. If you miss the language requirement but meet everything else, you can still get a permit at **half the normal hours**.',
  'workPermit.eligibility.point3':
    '**Stay duration:** Exchange/visiting students (D-2-8) must wait **6 months** after entry or status change.',
  'workPermit.eligibility.point4':
    '**Clean record:** No part-time work violation in the last 3 months.',
  'workPermit.eligibility.languageTable.title': 'Language requirements',
  'workPermit.eligibility.languageTable.colLevel': 'Who',
  'workPermit.eligibility.languageTable.colKorean': 'Korean track',
  'workPermit.eligibility.languageTable.colEnglish': 'English track (any year)',
  'workPermit.eligibility.languageTable.row1Level': "Bachelor's, years 1–2",
  'workPermit.eligibility.languageTable.row1Korean': 'TOPIK 3+ / KIIP 3-step+ / Sejong 중급1+',
  'workPermit.eligibility.languageTable.row1English': 'TOEFL 530 (iBT 71) / IELTS 5.5 / CEFR B2 / TEPS 327+',
  'workPermit.eligibility.languageTable.row2Level': "Bachelor's Y3–4 & grad students",
  'workPermit.eligibility.languageTable.row2Korean': 'TOPIK 4+ / KIIP 4-step+ / Sejong 중급2+',
  'workPermit.eligibility.languageTable.row2English': 'Same as above',
  'workPermit.eligibility.note':
    'English-track students use the English column instead of Korean requirements.',

  'workPermit.hours.title': 'Allowed Hours (허용 시간)',
  'workPermit.hours.table.title': 'Part-time work hour limits (시간제 취업활동 허용시간 차등 적용 기준)',
  'workPermit.hours.table.colCourse': 'Course',
  'workPermit.hours.table.colYear': 'Year',
  'workPermit.hours.table.colKoreanCriteria': 'Korean proficiency',
  'workPermit.hours.table.colMet': 'Requirement Met?',
  'workPermit.hours.table.colAllowedHours': 'Allowed hours',
  'workPermit.hours.table.colWeekday': 'Weekdays',
  'workPermit.hours.table.colWeekend': 'Weekends & Semester Breaks',
  'workPermit.hours.table.colBonus': 'Certified uni,\nexcellent grades,\nexcellent Korean\n(weekdays)',
  'workPermit.hours.table.bachelor': "Bachelor's",
  'workPermit.hours.table.bachelorY12': 'Y1–2',
  'workPermit.hours.table.bachelorY34': 'Y3–4',
  'workPermit.hours.table.grad': "Master's/PhD",
  'workPermit.hours.table.anyYear': 'Any',
  'workPermit.hours.table.notMet': 'X',
  'workPermit.hours.table.met': 'O',
  'workPermit.hours.table.hours10': '10 hrs',
  'workPermit.hours.table.hours15': '15 hrs',
  'workPermit.hours.table.hours25': '25 hrs',
  'workPermit.hours.table.hours30': '30 hrs',
  'workPermit.hours.table.hours35': '35 hrs',
  'workPermit.hours.table.unlimited': 'Unlimited',
  'workPermit.hours.table.criteria.bachelorY12':
    '① TOPIK Level 3\n② KIIP Level 3+ or pre-assessment 61+\n③ Sejong Institute Intermediate 1+',
  'workPermit.hours.table.criteria.bachelorY34':
    '① TOPIK Level 4\n② KIIP Level 4+ or pre-assessment 81+\n③ Sejong Institute Intermediate 2+',
  'workPermit.hours.table.criteria.grad':
    '① TOPIK Level 4\n② KIIP Level 4+ or pre-assessment 81+\n③ Sejong Institute Intermediate 2+',
  'workPermit.hours.bonus1':
    'The rightmost column applies if you meet language requirements **and** qualify as certified-university student, straight-A last semester, or TOPIK 5+ / KIIP 5-step+.',
  'workPermit.hours.bonus2':
    'When marked **O**, weekends, public holidays, and official school breaks have **no hour limit**.',
  'workPermit.hours.bonus3':
    'You still need an actual permit — limits in this table are not automatic.',
  'workPermit.hours.note':
    "When marked **X**, the same cap applies on weekdays and weekends/breaks. English-track students use English scores instead of the Korean criteria column.",

  'workPermit.documents.title': 'Required Documents (제출 서류)',
  'workPermit.documents.item1': 'Application form, passport, Alien Registration Card (ARC) — **no fee**',
  'workPermit.documents.item2': 'Transcript (성적증명서)',
  'workPermit.documents.item3': 'Proof of Korean or English ability',
  'workPermit.documents.item4':
    'University confirmation: 외국인 유학생 시간제 취업 확인서 (issued by PNU International Affairs)',
  'workPermit.documents.item5': 'Compliance confirmation: 외국인 유학생 시간제취업 요건 준수 확인서 (Required only for manufacturing or construction as a registered business type.)',
  'workPermit.documents.item6':
    "Employer's business registration + employer ID, and standard labor contract (hourly wage, duties, hours stated)",
  'workPermit.documents.item7':
    'Manufacturing/construction employers: additional compliance form',
  'workPermit.documents.note':
    'Contract must be directly with the registered business — staffing agencies / dispatch arrangements are **not allowed**.',

  'workPermit.apply.title': 'How to Apply (신청 방법)',
  'workPermit.apply.step1':
    'Get university sign-off first — at PNU, contact **International Affairs (국제처)** for the confirmation forms.',
  'workPermit.apply.step2':
    'Apply at your local immigration office or online via [Hi Korea](https://www.hikorea.go.kr) → 민원신청 → 전자민원.',
  'workPermit.apply.step3':
    'Approval covers up to **2 workplaces** at once, valid for your remaining stay (max 1 year per approval).',
  'workPermit.apply.step4':
    '**Changing jobs?** Get a new permit **before** starting at the new workplace — not retroactive.',
  'workPermit.apply.related.hiKorea': 'Hi Korea (official immigration portal)',
  'workPermit.apply.note':
    '**Busan Immigration (부산출입국·외국인청):** 대한항공빌딩 1F, 중앙대로 146, Jung-gu · Subway: Busan Stn (L1) Exit 2 or Jungang Exit 14 · Mon–Fri 9:00–18:00 (lunch 12:00–13:00) · **1345** (multilingual helpline)',

  'workPermit.restrictions.title': 'Restricted Jobs (제한대상)',
  'workPermit.restrictions.item1':
    'Manufacturing/construction (TOPIK 4+ needed for manufacturing; construction essentially never allowed — one violation = exit order)',
  'workPermit.restrictions.item2': 'Private one-on-one tutoring (개인과외)',
  'workPermit.restrictions.item3':
    'Adult entertainment / nightlife-adjacent businesses (bars with hostessing, massage/bathhouses, motels, gaming rooms, etc.)',
  'workPermit.restrictions.item4':
    'Gig-platform jobs: delivery riders, couriers, designated drivers, insurance/door-to-door sales',
  'workPermit.restrictions.item5': 'Remote / telecommute-only positions',
  'workPermit.restrictions.item6': 'Jobs through staffing agencies or labor dispatch/brokerage',

  'workPermit.violations.title': 'Penalties (위반 시 처리)',
  'workPermit.violations.table.colSituation': 'Situation',
  'workPermit.violations.table.colResult': 'Consequence',
  'workPermit.violations.table.row1Situation': 'Working with no permit',
  'workPermit.violations.table.row1Result': 'Illegal employment — penalty; construction sector = exit order',
  'workPermit.violations.table.row2Situation': '1st permit violation (wrong hours/workplace)',
  'workPermit.violations.table.row2Result': 'Formal warning',
  'workPermit.violations.table.row3Situation': '2nd violation',
  'workPermit.violations.table.row3Result': 'Barred from part-time work for rest of studies',
  'workPermit.violations.table.row4Situation': '3rd violation',
  'workPermit.violations.table.row4Result': 'Student status (유학자격) may be revoked',
  'workPermit.violations.note':
    'Even a first offense for unpermitted work can lead to serious penalties. When in doubt, call **1345** before starting any job.',
}

export default messages
