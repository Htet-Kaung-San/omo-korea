import type { MessageDictionary } from '../../types'

const messages: MessageDictionary = {
  'oneStop.subtitle': 'คู่มือทีละขั้นตอนสำหรับ onestop.pusan.ac.kr',
  'oneStop.steps': 'ขั้นตอน',
  'oneStop.relatedPages': 'หน้าที่เกี่ยวข้อง',
  'oneStop.note': 'หมายเหตุ',

  'oneStop.registration.title': 'การลงทะเบียนเรียน (수강신청)',
  'oneStop.registration.step1':
    'เข้าสู่ระบบที่ [onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main) ด้วยรหัสนักศึกษาและรหัสผ่านของคุณ',
  'oneStop.registration.step2':
    'ไปที่ 수업 (Classes) → 수강신청및확인 (Registration & Confirmation)',
  'oneStop.registration.step3':
    'ตรวจสอบรายวิชาก่อน: [수강편람 (Course Catalog)](https://onestop.pusan.ac.kr/page?menuCD=000000000000335) — ค้นหาตามภาควิชา ดูกลุ่มเรียนที่เปิด ตรวจสอบจำนวนที่นั่ง',
  'oneStop.registration.step4':
    'ในช่วงลงทะเบียน การส่งจริงจะทำในระบบลงทะเบียนแยกต่างหาก: [sugang.pusan.ac.kr](https://sugang.pusan.ac.kr) (เว็บ PC หรือมือถือ) นี่เป็นเว็บไซต์ที่ต่างจาก One-Stop — อย่าสับสนหากถูกเปลี่ยนเส้นทางมาที่นี่',
  'oneStop.registration.step5':
    'หลังส่งแล้ว กลับไปที่ One-Stop → [수강확인 (Registration Check)](https://onestop.pusan.ac.kr/page?menuCD=000000000000355) เพื่อยืนยันว่าวิชาถูกลงทะเบียนจริง — ทำทุกครั้ง เพราะ "wishlist" (희망과목담기) ไม่เท่ากับการลงทะเบียนที่ยืนยันแล้ว',
  'oneStop.registration.related.addDrop': 'เพิ่ม/ถอนวิชา (수강신청및수강정정)',
  'oneStop.registration.related.cancellation': 'ยกเลิกวิชา (수강취소)',
  'oneStop.registration.related.timetable': 'ดูตารางเรียน (시간표조회)',
  'oneStop.registration.note':
    'การลงทะเบียนเปิดเฉพาะช่วงเวลาที่กำหนดในปฏิทินการศึกษา (มักแสดงในหน้าแรก One-Stop) ตรวจสอบวันที่ล่วงหน้า — ระบบใช้งานได้เฉพาะในช่วงเวลาเหล่านี้',

  'oneStop.cancellation.title': 'ยกเลิกวิชา / ถอนการเรียน (수강취소)',
  'oneStop.cancellation.step1':
    'เข้าสู่ระบบที่ [onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main)',
  'oneStop.cancellation.step2':
    'ไปที่ 수업 (Classes) → 수강취소 (Course Cancellation): [Course Cancellation (수강취소)](https://onestop.pusan.ac.kr/page?menuCD=000000000000358)',
  'oneStop.cancellation.step3': 'เลือกวิชาที่ต้องการยกเลิกและยืนยัน',
  'oneStop.cancellation.step4':
    'หลังจากนั้น ตรวจสอบอีกครั้งที่ [수강확인 (Registration Check)](https://onestop.pusan.ac.kr/page?menuCD=000000000000355) เพื่อยืนยันว่าวิชาไม่อยู่ในตารางเรียนที่ใช้งานอยู่',
  'oneStop.cancellation.note':
    'แตกต่างจาก 수강정정 (add/drop) ซึ่งทำในช่วงต้นภาคเรียนโดยไม่มีบันทึกค้างอยู่ 수강취소 เปิดในช่วงหลังของภาคเรียน (มักเป็นช่วงสั้นๆ หลังสอบกลางภาค) และจะทิ้งเครื่องหมาย W (Withdrawal) ในผลการเรียนแทนการลบวิชาออกทั้งหมด วันที่แน่นอนกำหนดในแต่ละภาคเรียนตามปฏิทินการศึกษา',

  'oneStop.grades.title': 'ตรวจสอบเกรด (성적확인)',
  'oneStop.grades.step1':
    'เข้าสู่ระบบที่ [onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main)',
  'oneStop.grades.step2': 'ไปที่ 수업 (Classes) → ส่วนเกรด',
  'oneStop.grades.step3':
    'ภาคเรียนปัจจุบัน: [Current Semester Grades (금학기성적조회)](https://onestop.pusan.ac.kr/page?menuCD=000000000000144)',
  'oneStop.grades.step4':
    'ผลการเรียนทั้งหมด: [All Semesters Grades (전체성적조회)](https://onestop.pusan.ac.kr/page?menuCD=000000000000145)',
  'oneStop.grades.note':
    'เกรดภาคเรียนปัจจุบันมักจะเห็นได้หลังประกาศเกรดสิ้นสุดเท่านั้น — หากว่างเปล่า อาจยังไม่ประกาศเกรด',

  'oneStop.tuition.title': 'ค่าเล่าเรียน — ใบแจ้งชำระ / ยืนยันการชำระ (등록금 고지서 / 납부확인)',
  'oneStop.tuition.step1':
    'เข้าสู่ระบบที่ [onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main)',
  'oneStop.tuition.step2': 'ไปที่เมนู 등록 (Registration/Tuition)',
  'oneStop.tuition.step3': 'พิมพ์/ดูใบแจ้งชำระ: 고지서출력 (Bill Print)',
  'oneStop.tuition.step4':
    'จดรหัสชำระของโรงเรียนที่แสดงในใบแจ้ง (แตกต่างตามธนาคาร — NH, Busan Bank, Hana ฯลฯ) และชำระผ่านโอนเงิน ATM ธนาคารออนไลน์/โทรศัพท์ หรือที่สาขาธนาคาร',
  'oneStop.tuition.step5':
    'ยืนยันการชำระ: 납부확인 (Payment Confirmation / Receipt Print) — ตรวจสอบหลังชำระ เพราะการชำระอาจไม่แสดงทันที',
  'oneStop.tuition.note':
    'ไม่สามารถขอใบแจ้งค่าเล่าเรียนทางโทรศัพท์/อีเมล/แฟกซ์แทนคุณได้ — คุณต้องเข้าถึงด้วยบัญชีของตนเอง',

  'oneStop.leaveReturn.title': 'ลาพักการเรียน / กลับมาเรียน (휴학 / 복학 신청)',
  'oneStop.leaveReturn.step1':
    'เข้าสู่ระบบที่ [onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main)',
  'oneStop.leaveReturn.step2':
    'สมัครลาพักการเรียน: [Leave of Absence Application (휴학신청)](https://onestop.pusan.ac.kr/page?menuCD=000000000000322)',
  'oneStop.leaveReturn.step3':
    'สมัครกลับมาเรียน: [Return to School Application (복학신청)](https://onestop.pusan.ac.kr/page?menuCD=000000000000323)',
  'oneStop.leaveReturn.note':
    'ทั้งสองมีช่วงสมัครเฉพาะในแต่ละภาคเรียน (ตรวจสอบปฏิทินการศึกษาในหน้าแรก One-Stop) — การสมัครนอกช่วงเวลาอาจทำไม่ได้',
}

export default messages
