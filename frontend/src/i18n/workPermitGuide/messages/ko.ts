import type { MessageDictionary } from '../../types'

const messages: MessageDictionary = {
  'workPermit.subtitle': '외국인 유학생 시간제 취업허가 안내',
  'workPermit.disclaimerTitle': '중요',
  'workPermit.disclaimer':
    '이는 학교 행정 절차가 아닌 **출입국/체류 관련 법**입니다. 잘못된 정보는 경고, 취업 금지, 유학자격 취소로 이어질 수 있습니다. 신청 전 **국제처** 또는 출입국 상담 **1345**에 반드시 확인하세요.',
  'workPermit.sourceDate': '법무부 시간제 취업 안내(2026년 2월) 기준. 규정은 변경될 수 있으니 [하이코리아](https://www.hikorea.go.kr)에서 최신 정보를 확인하세요.',
  'workPermit.keyPoints': '핵심 사항',
  'workPermit.steps': '단계',
  'workPermit.relatedPages': '관련 링크',
  'workPermit.note': '참고',

  'workPermit.basics.title': '허가가 필요한가요? (기본원칙)',
  'workPermit.basics.point1':
    'D-2 유학생은 허가 없이 **근로·소득 활동을 할 수 없습니다** — 아르바이트 포함.',
  'workPermit.basics.point2':
    '대학과 출입국관리사무소 **양쪽 승인**을 받으면 제한된 시간제 취업이 가능합니다.',
  'workPermit.basics.point3':
    'E-1~E-7 등 전문직(예: 어학 강사)은 별도 **체류자격외 활동허가**가 필요합니다.',
  'workPermit.basics.note':
    '일반 아르바이트 기준 안내입니다. 연구·가사도우미 등 다른 허가는 별도 절차입니다.',

  'workPermit.eligibility.title': '대상자 요건',
  'workPermit.eligibility.point1':
    '**성적:** 직전 학기 GPA C(2.0) 이상. 첫 학기(성적증명서 없음)는 예외이나 허용 시간이 절반으로 제한됩니다.',
  'workPermit.eligibility.point2':
    '**언어:** 아래 표 참고. 언어 요건 미충족 시 다른 조건을 만족하면 **정상 시간의 절반**까지 허가 가능.',
  'workPermit.eligibility.point3':
    '**체류기간:** 교환·방문 유학생(D-2-8)은 입국 또는 자격변경 후 **6개월** 경과 필요.',
  'workPermit.eligibility.point4':
    '**위반 이력:** 최근 3개월 내 시간제 취업 위반 없음.',
  'workPermit.eligibility.languageTable.title': '언어 요건',
  'workPermit.eligibility.languageTable.colLevel': '대상',
  'workPermit.eligibility.languageTable.colKorean': '한국어 과정',
  'workPermit.eligibility.languageTable.colEnglish': '영어권 과정 (학년 무관)',
  'workPermit.eligibility.languageTable.row1Level': '학사 1~2학년',
  'workPermit.eligibility.languageTable.row1Korean': 'TOPIK 3급+ / KIIP 3단계+ / 세종 중급1+',
  'workPermit.eligibility.languageTable.row1English': 'TOEFL 530 (iBT 71) / IELTS 5.5 / CEFR B2 / TEPS 327+',
  'workPermit.eligibility.languageTable.row2Level': '학사 3~4학년 및 대학원',
  'workPermit.eligibility.languageTable.row2Korean': 'TOPIK 4급+ / KIIP 4단계+ / 세종 중급2+',
  'workPermit.eligibility.languageTable.row2English': '위와 동일',
  'workPermit.eligibility.note':
    '영어권 트랙 학생은 한국어 요건 대신 영어 성적을 사용합니다.',

  'workPermit.hours.title': '허용 시간',
  'workPermit.hours.table.title': '시간제 취업활동 허용시간 차등 적용 기준',
  'workPermit.hours.table.colCourse': '과정',
  'workPermit.hours.table.colYear': '학년',
  'workPermit.hours.table.colKoreanCriteria': '한국어 능력 기준',
  'workPermit.hours.table.colMet': '충족\n여부',
  'workPermit.hours.table.colAllowedHours': '허용시간',
  'workPermit.hours.table.colWeekday': '주중',
  'workPermit.hours.table.colWeekend': '주말·방학',
  'workPermit.hours.table.colBonus': '인증대학,\n성적우수,\n한국어우수\n(주중)',
  'workPermit.hours.table.bachelor': '학사',
  'workPermit.hours.table.bachelorY12': '1~2',
  'workPermit.hours.table.bachelorY34': '3~4',
  'workPermit.hours.table.grad': '석·박사',
  'workPermit.hours.table.anyYear': '무관',
  'workPermit.hours.table.notMet': 'X',
  'workPermit.hours.table.met': 'O',
  'workPermit.hours.table.hours10': '10시간',
  'workPermit.hours.table.hours15': '15시간',
  'workPermit.hours.table.hours25': '25시간',
  'workPermit.hours.table.hours30': '30시간',
  'workPermit.hours.table.hours35': '35시간',
  'workPermit.hours.table.unlimited': '무제한',
  'workPermit.hours.table.criteria.bachelorY12':
    '① TOPIK 3급\n② 사회통합프로그램 3단계 이상 이수자 및 사전평가 61점 이상\n③ 세종학당 한국어과정 중급1 이상 이수자',
  'workPermit.hours.table.criteria.bachelorY34':
    '① TOPIK 4급\n② 사회통합프로그램 4단계 이상 이수자 및 사전평가 81점 이상\n③ 세종학당 한국어과정 중급2 이상 이수자',
  'workPermit.hours.table.criteria.grad':
    '① TOPIK 4급\n② 사회통합프로그램 4단계 이상 이수자 및 사전평가 81점 이상\n③ 세종학당 한국어과정 중급2 이상 이수자',
  'workPermit.hours.bonus1':
    '맨 오른쪽 열은 언어 요건 충족 + (인증대학 재학 / 직전 학기 전과목 A / TOPIK 5+·KIIP 5단계+) 해당 시 적용됩니다.',
  'workPermit.hours.bonus2':
    '**O**인 경우 주말·공휴일·방학에는 시간 제한이 없습니다.',
  'workPermit.hours.bonus3':
    '표의 시간은 자동 적용되지 않습니다 — 반드시 허가를 받아야 합니다.',
  'workPermit.hours.note':
    '**X**인 경우 주중·주말·방학 모두 동일한 시간으로 제한됩니다. 영어권 과정 학생은 한국어 기준 대신 영어 성적을 사용합니다.',

  'workPermit.documents.title': '제출 서류',
  'workPermit.documents.item1': '신청서, 여권, 외국인등록증 — **수수료 면제**',
  'workPermit.documents.item2': '성적증명서',
  'workPermit.documents.item3': '한국어 또는 영어 능력 증명',
  'workPermit.documents.item4': '외국인 유학생 시간제 취업 확인서 (대학 **국제처** 발급)',
  'workPermit.documents.item5': '외국인 유학생 시간제취업 요건 준수 확인서',
  'workPermit.documents.item6':
    '사업자등록증 사본, 고용주 신분증, 표준근로계약서 (시급·업무·시간 명시)',
  'workPermit.documents.item7':
    '제조·건설업 고용 시 추가 준수 확인서',
  'workPermit.documents.note':
    '근로계약은 사업자등록증상 사업체와 **직접** 체결해야 합니다 — 파견·중개 고용 불가.',

  'workPermit.apply.title': '신청 방법',
  'workPermit.apply.step1':
    '먼저 대학 확인서를 받으세요 — PNU는 **국제처**에서 시간제 취업 확인서를 발급합니다.',
  'workPermit.apply.step2':
    '관할 출입국관리사무소 방문 또는 [하이코리아](https://www.hikorea.go.kr) 온라인 신청 (민원신청 → 전자민원).',
  'workPermit.apply.step3':
    '승인 시 **최대 2곳** 근무 가능, 잔여 체류기간 내 유효 (1회 최대 1년).',
  'workPermit.apply.step4':
    '**근무지 변경 시** 새 직장 시작 **전** 새 허가를 받아야 합니다 — 소급 적용 불가.',
  'workPermit.apply.related.hiKorea': '하이코리아 (출입국 전자민원)',
  'workPermit.apply.note':
    '**부산출입국·외국인청:** 대한항공빌딩 1층, 중구 중앙대로 146 · 지하철 1호선 부산역 2번 또는 중앙역 14번 출구 · 평일 09:00–18:00 (점심 12:00–13:00) · **1345** (다국어 상담)',

  'workPermit.restrictions.title': '제한 업종·직종',
  'workPermit.restrictions.item1':
    '제조·건설업 (제조는 TOPIK 4+ 필요, 건설은 사실상 불가 — 1회 위반 시 출국명령)',
  'workPermit.restrictions.item2': '개인과외',
  'workPermit.restrictions.item3':
    '유흥·성매매 관련 업종 (단란주점, 안마·목욕탕, 모텔, PC방, 단속업소 등)',
  'workPermit.restrictions.item4':
    '플랫폼 배달·택배·대리운전, 보험·방문판매 등',
  'workPermit.restrictions.item5': '재택·원격 근무만 하는 직종',
  'workPermit.restrictions.item6': '인력파견·알선·브로커를 통한 고용',

  'workPermit.violations.title': '위반 시 처리',
  'workPermit.violations.table.colSituation': '상황',
  'workPermit.violations.table.colResult': '조치',
  'workPermit.violations.table.row1Situation': '허가 없이 근로',
  'workPermit.violations.table.row1Result': '불법 취업 — 제재; 건설업은 출국명령',
  'workPermit.violations.table.row2Situation': '허가 위반 1회 (시간·장소 등)',
  'workPermit.violations.table.row2Result': '경고',
  'workPermit.violations.table.row3Situation': '2회 위반',
  'workPermit.violations.table.row3Result': '졸업까지 시간제 취업 불가',
  'workPermit.violations.table.row4Situation': '3회 위반',
  'workPermit.violations.table.row4Result': '유학자격 취소 가능',
  'workPermit.violations.note':
    '무허가 근로는 1회라도 중대한 불이익이 있을 수 있습니다. 일 시작 전 **1345**에 문의하세요.',
}

export default messages
