import type { MessageDictionary } from '../../types'

const messages: MessageDictionary = {
  'workPermit.subtitle': 'ለአለም አቀፍ ተማሪዎች የከፊል ጊዜ ስራ ፈቃድ (시간제 취업허가)',
  'workPermit.disclaimerTitle': 'አስፈላጊ',
  'workPermit.disclaimer':
    'ይህ **የኢሚግሬሽን закон** ነው — የካምፓስ ቅጽ አይደለም። ትክክል ያልሆነ መረጃ ገንዘብ ጥገና፣ የስራ ማገድ ወይም የተማሪ ሁኔታ መሰረዝ ሊያስከትል ይችላል። ከመጠየቅዎ በፊት ከ PNU **ዓለም አቀፍ ጉዳዮች (국제처)** ወይም **1345** ያረጋግጡ።',
  'workPermit.sourceDate':
    'MOJ መመሪያ Feb 2026 መሰረት። ኦፊሴላዊ правила ሊቀየር ይችላል — [Hi Korea](https://www.hikorea.go.kr) ይመልከቱ።',
  'workPermit.keyPoints': 'ዋና ነጥቦች',
  'workPermit.steps': 'ደረጃዎች',
  'workPermit.relatedPages': 'ተዛማጅ ሊንኮች',
  'workPermit.note': 'ማስታወሻ',

  'workPermit.basics.title': 'ፈቃድ ያስፈልጋል? (기본원칙)',
  'workPermit.basics.point1':
    'D-2 ተማሪ ቪዛ ያላቸው **ያለ ፈቃድ መስራት ወይም ገቢ መስራት አይችሉም** — ከፊል ጊዜ ስራ (아르바이트) ጨምሮ።',
  'workPermit.basics.point2':
    '**ዩኒቨርሲቲና ኢሜግሬሽን ሁለቱም** ካጸደቁ ограниченный ከፊል ጊዜ ስራ ይፈቀዳል።',
  'workPermit.basics.point3':
    'ልዩ ስራዎች (E-1~E-7) ብዙ ጊዜ **체류자격외 활동허가** ይፈልጋሉ — ይህ ፈቃድ አይደለም።',
  'workPermit.basics.note':
    'ይህ መመሪያ መደበኛ ከፊል ጊዜ ስራ만 ይሸፍናል።',

  'workPermit.eligibility.title': 'ብቃት (대상자 요건)',
  'workPermit.eligibility.point1':
    '**GPA:** C (2.0) ወይም ከዚያ በላይ። የመጀመሪያ semester exception፣ ግን ሰዓቶች በግማሽ ограничены።',
  'workPermit.eligibility.point2':
    '**ቋንቋ:** ከታች جدول። OK ከሆነ **ግማሽ መደበኛ ሰዓቶች** ፈቃድ።',
  'workPermit.eligibility.point3':
    '**Stay:** D-2-8 **6 ወር** ከpravesh በኋላ።',
  'workPermit.eligibility.point4':
    '**Clean record:** 3 ወር ውስጥ violation 없음።',
  'workPermit.eligibility.languageTable.title': 'Language requirements',
  'workPermit.eligibility.languageTable.colLevel': 'Who',
  'workPermit.eligibility.languageTable.colKorean': 'Korean track',
  'workPermit.eligibility.languageTable.colEnglish': 'English track',
  'workPermit.eligibility.languageTable.row1Level': "Bachelor's Y1–2",
  'workPermit.eligibility.languageTable.row1Korean': 'TOPIK 3+ / KIIP 3-step+ / Sejong 중급1+',
  'workPermit.eligibility.languageTable.row1English': 'TOEFL 530 (iBT 71) / IELTS 5.5 / CEFR B2 / TEPS 327+',
  'workPermit.eligibility.languageTable.row2Level': "Bachelor's Y3–4 & grad",
  'workPermit.eligibility.languageTable.row2Korean': 'TOPIK 4+ / KIIP 4-step+ / Sejong 중급2+',
  'workPermit.eligibility.languageTable.row2English': 'Same as above',
  'workPermit.eligibility.note':
    'English-track students use English column.',

  'workPermit.hours.title': 'Allowed hours (허용 시간)',
  'workPermit.hours.table.title': 'Part-time work hour limits (시간제 취업활동 허용시간 차등 적용 기준)',
  'workPermit.hours.table.colCourse': 'Course',
  'workPermit.hours.table.colYear': 'Year',
  'workPermit.hours.table.colKoreanCriteria': 'Korean proficiency',
  'workPermit.hours.table.colMet': 'Met?',
  'workPermit.hours.table.colAllowedHours': 'Allowed hours',
  'workPermit.hours.table.colWeekday': 'Weekdays',
  'workPermit.hours.table.colWeekend': 'Weekends · break',
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

  'workPermit.documents.title': 'Required documents (제출 서류)',
  'workPermit.documents.item1':
    'Application, passport, ARC — **no fee**',
  'workPermit.documents.item2': 'Transcript (성적증명서)',
  'workPermit.documents.item3': 'Korean or English proof',
  'workPermit.documents.item4':
    'University confirmation: 외국인 유학생 시간제 취업 확인서 (**PNU International Affairs**)',
  'workPermit.documents.item5':
    'Compliance: 외국인 유학생 시간제취업 요건 준수 확인서',
  'workPermit.documents.item6':
    'Employer registration + ID, standard contract (hourly wage, duties, hours)',
  'workPermit.documents.item7':
    'Manufacturing/construction: additional compliance form',
  'workPermit.documents.note':
    'Contract **directly** with registered business — staffing/dispatch **not allowed**.',

  'workPermit.apply.title': 'How to apply (신청 방법)',
  'workPermit.apply.step1':
    'University first — PNU **International Affairs (국제처)** for forms.',
  'workPermit.apply.step2':
    'Local immigration or [Hi Korea](https://www.hikorea.go.kr) → 민원신청 → 전자민원.',
  'workPermit.apply.step3':
    '**2 workplaces**, remaining stay (max 1 year).',
  'workPermit.apply.step4':
    '**Job change?** New permit **before** new job — not retroactive.',
  'workPermit.apply.related.hiKorea': 'Hi Korea (official portal)',
  'workPermit.apply.note':
    '**Busan Immigration (부산출입국·외국인청):** Korean Air bldg 1F, 146 Jungang-daero · **1345**',

  'workPermit.restrictions.title': 'Restricted jobs (제한대상)',
  'workPermit.restrictions.item1':
    'Manufacturing/construction (TOPIK 4+; construction never — exit order)',
  'workPermit.restrictions.item2': 'Private tutoring (개인과외)',
  'workPermit.restrictions.item3':
    'Adult entertainment / nightlife (bars, massage, motels, gaming rooms)',
  'workPermit.restrictions.item4':
    'Platform jobs: delivery, couriers, designated drivers, door-to-door sales',
  'workPermit.restrictions.item5': 'Remote / telecommute only',
  'workPermit.restrictions.item6': 'Staffing agencies or labor dispatch',

  'workPermit.violations.title': 'Penalties (위반 시 처리)',
  'workPermit.violations.table.colSituation': 'Situation',
  'workPermit.violations.table.colResult': 'Result',
  'workPermit.violations.table.row1Situation': 'No permit',
  'workPermit.violations.table.row1Result':
    'Illegal employment — penalty; construction = exit order',
  'workPermit.violations.table.row2Situation': '1st violation',
  'workPermit.violations.table.row2Result': 'Warning',
  'workPermit.violations.table.row3Situation': '2nd violation',
  'workPermit.violations.table.row3Result': 'Barred until graduation',
  'workPermit.violations.table.row4Situation': '3rd violation',
  'workPermit.violations.table.row4Result': 'Status (유학자격) revoked',
  'workPermit.violations.note':
    'First offense can be serious. Call **1345** before starting work.',
}

export default messages
