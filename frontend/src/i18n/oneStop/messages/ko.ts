import type { MessageDictionary } from '../../types'

const messages: MessageDictionary = {
  'oneStop.subtitle': 'onestop.pusan.ac.kr 단계별 이용 안내',
  'oneStop.steps': '단계',
  'oneStop.relatedPages': '관련 페이지',
  'oneStop.note': '참고',

  'oneStop.registration.title': '수강신청',
  'oneStop.registration.step1':
    '학번과 비밀번호로 [onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main)에 로그인하세요.',
  'oneStop.registration.step2': '수업 → 수강신청및확인 메뉴로 이동하세요.',
  'oneStop.registration.step3':
    '먼저 [수강편람](https://onestop.pusan.ac.kr/page?menuCD=000000000000335)에서 개설 강좌를 확인하세요 — 학과별 검색, 개설 분반 조회, 정원 확인이 가능합니다.',
  'oneStop.registration.step4':
    '수강신청 기간에는 별도의 수강신청 시스템에서 실제 신청이 이루어집니다: [sugang.pusan.ac.kr](https://sugang.pusan.ac.kr) (PC 또는 모바일 웹). 원스톱과 다른 사이트이므로 이곳으로 이동해도 당황하지 마세요.',
  'oneStop.registration.step5':
    '신청 후 원스톱으로 돌아와 [수강확인](https://onestop.pusan.ac.kr/page?menuCD=000000000000355)에서 실제로 수강신청이 완료되었는지 확인하세요 — 매번 확인해야 합니다. 희망과목담기는 확정된 수강신청이 아닙니다.',
  'oneStop.registration.related.addDrop': '수강신청및수강정정',
  'oneStop.registration.related.cancellation': '수강취소',
  'oneStop.registration.related.timetable': '시간표조회',
  'oneStop.registration.note':
    '수강신청은 학사일정에 정해진 특정 기간에만 열립니다(보통 원스톱 홈페이지에 안내됨). 일정을 미리 확인하세요 — 해당 기간에만 시스템을 이용할 수 있습니다.',

  'oneStop.cancellation.title': '수강취소',
  'oneStop.cancellation.step1':
    '[onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main)에 로그인하세요.',
  'oneStop.cancellation.step2':
    '수업 → 수강취소: [수강취소](https://onestop.pusan.ac.kr/page?menuCD=000000000000358)',
  'oneStop.cancellation.step3': '취소할 과목을 선택하고 확인하세요.',
  'oneStop.cancellation.step4':
    '이후 [수강확인](https://onestop.pusan.ac.kr/page?menuCD=000000000000355)에서 해당 과목이 수강 내역에서 사라졌는지 다시 확인하세요.',
  'oneStop.cancellation.note':
    '이것은 수강정정과 다릅니다. 수강정정은 학기 초에 이루어지며 기록이 남지 않습니다. 수강취소는 학기 중반 이후(보통 중간고사 직후 짧은 기간)에 열리며, 과목이 완전히 삭제되는 것이 아니라 성적표에 W(Withdrawal) 표시가 남습니다. 정확한 일정은 매 학기 학사일정에서 확인하세요.',

  'oneStop.grades.title': '성적확인',
  'oneStop.grades.step1':
    '[onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main)에 로그인하세요.',
  'oneStop.grades.step2': '수업 → 성적 메뉴로 이동하세요.',
  'oneStop.grades.step3':
    '금학기 성적: [금학기성적조회](https://onestop.pusan.ac.kr/page?menuCD=000000000000144)',
  'oneStop.grades.step4':
    '전체 학기 성적: [전체성적조회](https://onestop.pusan.ac.kr/page?menuCD=000000000000145)',
  'oneStop.grades.note':
    '금학기 성적은 보통 최종 성적 공시가 끝난 후에야 조회할 수 있습니다 — 비어 있다면 아직 성적이 공개되지 않은 것일 수 있습니다.',

  'oneStop.tuition.title': '등록금 고지서 / 납부확인',
  'oneStop.tuition.step1':
    '[onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main)에 로그인하세요.',
  'oneStop.tuition.step2': '등록 메뉴로 이동하세요.',
  'oneStop.tuition.step3': '고지서 출력: 고지서출력.',
  'oneStop.tuition.step4':
    '고지서에 표시된 학교 납부 코드(은행마다 다름 — NH, 부산은행, 하나 등)를 확인하고, 계좌이체, ATM, 인터넷/전화뱅킹 또는 은행 창구에서 납부하세요.',
  'oneStop.tuition.step5':
    '납부 확인: 납부확인 — 납부 후 반드시 확인하세요. 납부가 즉시 반영되지 않을 수 있습니다.',
  'oneStop.tuition.note':
    '등록금 고지서는 전화/이메일/팩스로 대리 발급받을 수 없습니다 — 본인 계정으로 직접 접속해야 합니다.',

  'oneStop.leaveReturn.title': '휴학 / 복학 신청',
  'oneStop.leaveReturn.step1':
    '[onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main)에 로그인하세요.',
  'oneStop.leaveReturn.step2':
    '휴학 신청: [휴학신청](https://onestop.pusan.ac.kr/page?menuCD=000000000000322)',
  'oneStop.leaveReturn.step3':
    '복학 신청: [복학신청](https://onestop.pusan.ac.kr/page?menuCD=000000000000323)',
  'oneStop.leaveReturn.note':
    '둘 다 매 학기 정해진 신청 기간이 있습니다(원스톱 홈페이지의 학사일정 확인) — 기간 외에는 신청이 불가능할 수 있습니다.',
}

export default messages
