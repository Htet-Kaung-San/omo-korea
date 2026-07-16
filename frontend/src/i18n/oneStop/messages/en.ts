import type { MessageDictionary } from '../../types'

const messages: MessageDictionary = {
  'oneStop.subtitle': 'Step-by-step guides for onestop.pusan.ac.kr',
  'oneStop.steps': 'Steps',
  'oneStop.relatedPages': 'Related pages',
  'oneStop.note': 'Note',

  'oneStop.registration.title': 'Course Registration (수강신청)',
  'oneStop.registration.step1':
    'Log in at [onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main) with your student ID and password.',
  'oneStop.registration.step2':
    'Go to 수업 (Classes) → 수강신청및확인 (Registration & Confirmation).',
  'oneStop.registration.step3':
    'Check the course catalog first: [수강편람 (Course Catalog)](https://onestop.pusan.ac.kr/page?menuCD=000000000000335) — search by department, browse open sections, check seat limits.',
  'oneStop.registration.step4':
    'During the registration window, actual submission happens on the separate registration system: [sugang.pusan.ac.kr](https://sugang.pusan.ac.kr) (PC or mobile web). This is a different site from One-Stop — don\'t be confused if you\'re redirected here.',
  'oneStop.registration.step5':
    'After submitting, go back to One-Stop → [수강확인 (Registration Check)](https://onestop.pusan.ac.kr/page?menuCD=000000000000355) to confirm your courses were actually registered — do this every time, since "wishlist" (희망과목담기) does not equal a confirmed registration.',
  'oneStop.registration.related.addDrop': 'Course Add/Drop (수강신청및수강정정)',
  'oneStop.registration.related.cancellation': 'Course Cancellation (수강취소)',
  'oneStop.registration.related.timetable': 'Timetable View (시간표조회)',
  'oneStop.registration.note':
    'Registration only opens during specific windows set by the academic calendar (typically listed on the One-Stop homepage). Check dates in advance — the system is only usable during these windows.',

  'oneStop.cancellation.title': 'Course Cancellation / Withdrawal (수강취소)',
  'oneStop.cancellation.step1':
    'Log in at [onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main).',
  'oneStop.cancellation.step2':
    'Go to 수업 (Classes) → 수강취소 (Course Cancellation): [Course Cancellation (수강취소)](https://onestop.pusan.ac.kr/page?menuCD=000000000000358)',
  'oneStop.cancellation.step3': 'Select the course(s) you want to cancel and confirm.',
  'oneStop.cancellation.step4':
    'Afterward, recheck [수강확인 (Registration Check)](https://onestop.pusan.ac.kr/page?menuCD=000000000000355) to confirm the course no longer appears on your active schedule.',
  'oneStop.cancellation.note':
    'This is different from 수강정정 (add/drop), which happens early in the semester with no record left behind. 수강취소 opens later in the semester (typically a short window after midterms) and leaves a W (Withdrawal) mark on your transcript rather than removing the course entirely. Exact dates are set each semester on the academic calendar.',

  'oneStop.grades.title': 'Checking Grades (성적확인)',
  'oneStop.grades.step1':
    'Log in at [onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main).',
  'oneStop.grades.step2': 'Go to 수업 (Classes) → grades section.',
  'oneStop.grades.step3':
    'For the current semester: [Current Semester Grades (금학기성적조회)](https://onestop.pusan.ac.kr/page?menuCD=000000000000144)',
  'oneStop.grades.step4':
    'For your full academic record: [All Semesters Grades (전체성적조회)](https://onestop.pusan.ac.kr/page?menuCD=000000000000145)',
  'oneStop.grades.note':
    'Current-semester grades are usually only visible after final grade postings close — if it looks empty, grades may not be released yet.',

  'oneStop.tuition.title': 'Tuition — Bill & Payment Confirmation (등록금 고지서 / 납부확인)',
  'oneStop.tuition.step1':
    'Log in at [onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main).',
  'oneStop.tuition.step2': 'Go to 등록 (Registration/Tuition) menu.',
  'oneStop.tuition.step3': 'Print/view your bill: 고지서출력 (Bill Print).',
  'oneStop.tuition.step4':
    'Note your school payment code shown on the bill (varies by bank — NH, Busan Bank, Hana, etc.) and pay via bank transfer, ATM, internet/phone banking, or in-person at the bank.',
  'oneStop.tuition.step5':
    'Confirm payment went through: 납부확인 (Payment Confirmation / Receipt Print) — check this after paying, since payment doesn\'t always reflect instantly.',
  'oneStop.tuition.note':
    'Tuition bills can\'t be requested by phone/email/fax on your behalf — you must access this yourself under your own login.',

  'oneStop.leaveReturn.title': 'Leave of Absence / Return to School (휴학 / 복학 신청)',
  'oneStop.leaveReturn.step1':
    'Log in at [onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main).',
  'oneStop.leaveReturn.step2':
    'To apply for a leave of absence: [Leave of Absence Application (휴학신청)](https://onestop.pusan.ac.kr/page?menuCD=000000000000322)',
  'oneStop.leaveReturn.step3':
    'To apply to return from leave: [Return to School Application (복학신청)](https://onestop.pusan.ac.kr/page?menuCD=000000000000323)',
  'oneStop.leaveReturn.note':
    'Both have specific application windows each semester (check the academic calendar on the One-Stop homepage) — applying outside the window may not be possible.',
}

export default messages
