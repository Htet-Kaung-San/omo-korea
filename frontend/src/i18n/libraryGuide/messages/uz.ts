import type { MessageDictionary } from '../../types'

const messages: MessageDictionary = {
  'library.subtitle': 'PNU kutubxonasi mobil ilovasidan (부산대 도서관_PNUL) foydalanish bo\'yicha qo\'llanma',
  'library.steps': 'Qadamlar',
  'library.usageGuide': 'Foydalanish qo\'llanmasi',

  'library.install.title': 'Ilovani o\'rnatish',
  'library.install.step1':
    '[Google Play Store](https://play.google.com/store/apps/details?id=kr.ac.pusan.lib) (Android) yoki Apple App Store (iOS) da "PNUL" yoki "부산대 도서관" qidiring va o\'rnating.',
  'library.install.step2':
    'Agar avval eski "부산대 도서관" yoki "PNU Place" ilovalaridan foydalangan bo\'lsangiz, ular bekor qilingan — bu yangi ilova ikkalasini almashtiradi.',
  'library.install.step3':
    'PNU talaba portali ma\'lumotlari bilan kiring ([onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main) dagi ID/parol bilan bir xil).',

  'library.seatReservation.title': 'O\'qish xonasi o\'rindiq band qilish (열람실 좌석예약)',
  'library.seatReservation.tip1':
    'Faqat ilova orqali tayinlangan o\'rindiqlar haqiqiy — tayinlanmagan o\'rindiqdan foydalanib ushlanilsa, kutubxona foydalanishi cheklanadi.',
  'library.seatReservation.tip2':
    'Band qilgandan keyin 15 daqiqa ichida kirish darvozasidan o\'tish kerak, aks holda tayinlash bekor qilinadi.',
  'library.seatReservation.tip3':
    'Uzaytirish sessiya tugashidan 2 soat oldin ochiladi. Har uzaytirish 4 soat qo\'shadi, maksimal 4 marta uzaytirish mumkin.',
  'library.seatReservation.tip4':
    'Uzaytirishni ilovada yoki kutubxonadagi 좌석배정기 (o\'rindiq tayinlash avtomati) da qilish mumkin.',
  'library.seatReservation.tip5': 'Vaqt tugaganda o\'rindiq avtomatik qaytariladi.',
  'library.seatReservation.tip6':
    'Eslatma: 중앙도서관 (Markaziy kutubxona) asosan fond saqlash joyi — ba\'zi o\'qish maydonlarida o\'rindiq tayinlash umuman talab qilinmaydi.',
  'library.seatReservation.step1':
    'Bosh ekranda yuqorida 좌석예약 (O\'rindiq band qilish) panelini toping. Faol band qilish bo\'lmasa "예약된 정보가 없습니다" (Band qilish ma\'lumoti yo\'q) ko\'rsatiladi. Yangi band qilish uchun 배정신청 (Tayinlash so\'rovi), o\'tganlar uchun 이용내역 (Foydalanish tarixi) ni bosing.',
  'library.seatReservation.step2':
    'Tab qatoridan binoni tanlang — 나노생명, 의생명, 미리내, 새벽벌 yoki 중앙.',
  'library.seatReservation.step3':
    'Qavatni (1층, 2층, ...) tanlang, keyin shu qavatdagi xona turi tabini (masalan [새벽벌]열람실 o\'qish xonasi vs. [새벽벌]PC PC zonasi).',
  'library.seatReservation.step4':
    'Har bir zonaning jonli bandligi halqa diagrammasida ko\'rinadi — masalan "새벽누리-열람존 34/73" 73 tadan 34 band, 39 bo\'sh degani.',
  'library.seatReservation.step5':
    'Zonaga kirib alohida o\'rindiq tanlang va tasdiqlang.',
  'library.seatReservation.image.homeScreen':
    'Bosh ekran — 배정신청 tugmasi bilan 좌석예약 paneli',
  'library.seatReservation.image.buildingFloor':
    'Bino, qavat va zona tanlash hamda jonli o\'rindiq bandligi',

  'library.libraryCard.title': 'Kutubxona kartasi / 이용증',
  'library.libraryCard.step1': 'Ilovani oching va yuqoridagi 메뉴 (Menyu) → LOGIN orqali kiring.',
  'library.libraryCard.step2':
    'Pastki navigatsiya panelida 이용증 ni bosing — pastki nav MY / 1:1 문의 / 홈 / 이용증 / 전체메뉴, to\'g\'ridan-to\'g\'ri tab, menyu ichida emas.',
  'library.libraryCard.step3':
    '이용증 ekrani QR kod ko\'rsatadi — bu mobil kutubxona kartangiz. Kirish uchun kutubxona darvozasida skanerlang.',
}

export default messages
