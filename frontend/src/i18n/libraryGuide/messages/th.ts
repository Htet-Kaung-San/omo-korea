import type { MessageDictionary } from '../../types'

const messages: MessageDictionary = {
  'library.subtitle': 'วิธีใช้แอปมือถือห้องสมุด PNU (부산대 도서관_PNUL)',
  'library.steps': 'ขั้นตอน',
  'library.usageGuide': 'คู่มือการใช้งาน',

  'library.install.title': 'ติดตั้งแอป',
  'library.install.step1':
    'ค้นหา "PNUL" หรือ "부산대 도서관" ใน [Google Play Store](https://play.google.com/store/apps/details?id=kr.ac.pusan.lib) (Android) หรือ Apple App Store (iOS) แล้วติดตั้ง',
  'library.install.step2':
    'หากคุณเคยใช้แอป "부산대 도서관" หรือ "PNU Place" เก่า แอปเหล่านั้นเลิกใช้แล้ว — แอปใหม่นี้แทนที่ทั้งสอง',
  'library.install.step3':
    'เข้าสู่ระบบด้วยบัญชีพอร์ทัลนักศึกษา PNU (ID/รหัสผ่านเดียวกับ [onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main))',

  'library.seatReservation.title': 'การจองที่นั่งห้องอ่านหนังสือ (열람실 좌석예약)',
  'library.seatReservation.tip1':
    'ใช้ได้เฉพาะที่นั่งที่ได้รับมอบหมายผ่านแอปเท่านั้น — หากใช้ที่นั่งที่ไม่ได้มอบหมายและถูกจับได้ จะถูกจำกัดการใช้ห้องสมุด',
  'library.seatReservation.tip2':
    'หลังจองแล้วต้องผ่านประตูทางเข้าภายใน 15 นาที มิฉะนั้นการมอบหมายจะถูกยกเลิก',
  'library.seatReservation.tip3':
    'การต่อเวลาเปิด 2 ชั่วโมงก่อนเซสชันสิ้นสุด แต่ละครั้งเพิ่ม 4 ชั่วโมง ต่อได้สูงสุด 4 ครั้ง',
  'library.seatReservation.tip4':
    'ต่อเวลาได้ทั้งในแอปหรือที่ 좌석배정기 (เครื่องมอบหมายที่นั่ง) ในห้องสมุด',
  'library.seatReservation.tip5': 'ที่นั่งจะถูกคืนอัตโนมัติเมื่อหมดเวลา',
  'library.seatReservation.tip6':
    'หมายเหตุ: 중앙도서관 (ห้องสมุดกลาง) เป็นพื้นที่เก็บหนังสือเป็นหลัก — บางพื้นที่อ่านหนังสือไม่ต้องมอบหมายที่นั่งเลย',
  'library.seatReservation.step1':
    'บนหน้าจอหลัก หาแผง 좌석예약 (จองที่นั่ง) ใกล้ด้านบน หากไม่มีการจองจะแสดง "예약된 정보가 없습니다" (ไม่มีข้อมูลการจอง) แตะ 배정신청 (ขอมอบหมาย) เพื่อจองใหม่ หรือ 이용내역 (ประวัติการใช้) เพื่อดูที่ผ่านมา',
  'library.seatReservation.step2':
    'เลือกอาคารจากแถบแท็บ — 나노생명, 의생명, 미리내, 새벽벌 หรือ 중앙',
  'library.seatReservation.step3':
    'เลือกชั้น (1층, 2층, ...) แล้วเลือกแท็บประเภทห้องในชั้นนั้น (เช่น [새벽벌]열람실 สำหรับห้องอ่านหนังสือ vs. [새벽벌]PC สำหรับโซน PC)',
  'library.seatReservation.step4':
    'จะเห็นการใช้งานแต่ละโซนแบบเรียลไทม์เป็นกราฟวง — เช่น "새벽누리-열람존 34/73" หมายถึง 34 จาก 73 ที่นั่งถูกใช้ 39 ที่ว่าง',
  'library.seatReservation.step5':
    'แตะเข้าโซนเพื่อเลือกที่นั่งและยืนยัน',
  'library.seatReservation.image.homeScreen':
    'หน้าจอหลัก — แผง 좌석예약 พร้อมปุ่ม 배정신청',
  'library.seatReservation.image.buildingFloor':
    'การเลือกอาคาร ชั้น และโซน พร้อมการใช้ที่นั่งแบบเรียลไทม์',

  'library.libraryCard.title': 'บัตรห้องสมุด / 이용증',
  'library.libraryCard.step1': 'เปิดแอปและเข้าสู่ระบบผ่าน 메뉴 (เมนู) → LOGIN ด้านบน',
  'library.libraryCard.step2':
    'แตะ 이용증 ในแถบนำทางด้านล่าง — แถบล่างอ่าน MY / 1:1 문의 / 홈 / 이용증 / 전체메뉴 เป็นแท็บโดยตรง ไม่ได้ซ่อนในเมนูย่อย',
  'library.libraryCard.step3':
    'หน้าจอ 이용증 แสดง QR code — นี่คือบัตรห้องสมุดมือถือของคุณ สแกนที่ประตูทางเข้าห้องสมุดเพื่อเข้า',
}

export default messages
