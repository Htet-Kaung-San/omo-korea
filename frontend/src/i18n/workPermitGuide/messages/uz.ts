import type { MessageDictionary } from '../../types'

const messages: MessageDictionary = {
  'workPermit.subtitle': 'Xalqaro talabalar uchun qisman ish ruxsatnomasi (시간제 취업허가)',
  'workPermit.disclaimerTitle': 'Muhim',
  'workPermit.disclaimer':
    'Bu **immigratsiya qonuni** — kampus shakli emas. Noto\'g\'ri ma\'lumot jarima, ish taqiqi yoki talaba maqomini yo\'qotishga olib kelishi mumkin. Ariza berishdan oldin PNU **Xalqaro ishlar bo\'limi (국제처)** yoki **1345** liniyasi bilan tasdiqlang.',
  'workPermit.sourceDate':
    'Adliya vazirligi yo\'riqnomasi, 2026-yil fevral asosida. Rasmiy qoidalar o\'zgarishi mumkin — yangilanishlar uchun [Hi Korea](https://www.hikorea.go.kr) ni tekshiring.',
  'workPermit.keyPoints': 'Asosiy nuqtalar',
  'workPermit.steps': 'Qadamlar',
  'workPermit.relatedPages': 'Bog\'liq havolalar',
  'workPermit.note': 'Eslatma',

  'workPermit.basics.title': 'Ruxsat kerakmi? (기본원칙)',
  'workPermit.basics.point1':
    'D-2 talaba vizasi egalari Koreyada ruxsatsiz **ishlay olmaydi va daromad topa olmaydi** — qisman ish (아르바이트) ham kiradi.',
  'workPermit.basics.point2':
    '**Universitet va immigratsiya ikkalasi** tasdiqlaganda cheklangan qisman ishga ruxsat beriladi.',
  'workPermit.basics.point3':
    'Mutaxassislik ishlari (E-1~E-7, masalan til o\'qitish) odatda alohida **체류자격외 활동허가** talab qiladi — bu ruxsat emas.',
  'workPermit.basics.note':
    'Bu qo\'llanma faqat standart qisman ishni qamrab oladi. Tadqiqot/uy parvarishi ruxsatlari alohida mavzular.',

  'workPermit.eligibility.title': 'Moslik (대상자 요건)',
  'workPermit.eligibility.point1':
    '**GPA:** Oxirgi semestrda C (2.0) yoki undan yuqori. Birinchi semestr: transkript bo\'lmasa ozod, lekin soatlar yarmiga cheklangan.',
  'workPermit.eligibility.point2':
    '**Til:** Quyidagi jadvalga qarang. Til talabi bajarilmasa, lekin qolgani OK bo\'lsa **oddiy soatlarning yarmi** ruxsat beriladi.',
  'workPermit.eligibility.point3':
    '**Yashash muddati:** Almashinuv/mehmon talabalar (D-2-8) kirish yoki status o\'zgarishidan **6 oy** kutishi kerak.',
  'workPermit.eligibility.point4':
    '**Toza yozuv:** Oxirgi 3 oyda qisman ish buzilishi bo\'lmasin.',
  'workPermit.eligibility.languageTable.title': 'Til talablari',
  'workPermit.eligibility.languageTable.colLevel': 'Kim',
  'workPermit.eligibility.languageTable.colKorean': 'Koreys yo\'nalishi',
  'workPermit.eligibility.languageTable.colEnglish': 'Ingliz yo\'nalishi (har qanday yil)',
  'workPermit.eligibility.languageTable.row1Level': 'Bakalavr, 1–2-kurs',
  'workPermit.eligibility.languageTable.row1Korean': 'TOPIK 3+ / KIIP 3-step+ / Sejong 중급1+',
  'workPermit.eligibility.languageTable.row1English': 'TOEFL 530 (iBT 71) / IELTS 5.5 / CEFR B2 / TEPS 327+',
  'workPermit.eligibility.languageTable.row2Level': 'Bakalavr Y3–4 va magistratura',
  'workPermit.eligibility.languageTable.row2Korean': 'TOPIK 4+ / KIIP 4-step+ / Sejong 중급2+',
  'workPermit.eligibility.languageTable.row2English': 'Yuqoridagidek',
  'workPermit.eligibility.note':
    'Ingliz yo\'nalishidagi talabalar Koreys talablari o\'rniga Ingliz ustunidan foydalanadi.',

  'workPermit.hours.title': 'Ruxsat etilgan soatlar (허용 시간)',
  'workPermit.hours.table.title': 'Qisman ish soatlari chegarasi (시간제 취업활동 허용시간 차등 적용 기준)',
  'workPermit.hours.table.colCourse': 'Dastur',
  'workPermit.hours.table.colYear': 'Kurs',
  'workPermit.hours.table.colKoreanCriteria': 'Koreys tili darajasi',
  'workPermit.hours.table.colMet': 'Bajarildimi?',
  'workPermit.hours.table.colAllowedHours': 'Ruxsat etilgan soat',
  'workPermit.hours.table.colWeekday': 'Ish kunlari',
  'workPermit.hours.table.colWeekend': 'Dam olish · ta\'til',
  'workPermit.hours.table.colBonus': 'Sertifikatlangan univ.,\n\'lo\'a baholar,\n\'lo\'a Koreys\n(ish kunlari)',
  'workPermit.hours.table.bachelor': 'Bakalavr',
  'workPermit.hours.table.bachelorY12': '1–2',
  'workPermit.hours.table.bachelorY34': '3–4',
  'workPermit.hours.table.grad': 'Magistratura',
  'workPermit.hours.table.anyYear': 'Har qanday',
  'workPermit.hours.table.notMet': 'X',
  'workPermit.hours.table.met': 'O',
  'workPermit.hours.table.hours10': '10 soat',
  'workPermit.hours.table.hours15': '15 soat',
  'workPermit.hours.table.hours25': '25 soat',
  'workPermit.hours.table.hours30': '30 soat',
  'workPermit.hours.table.hours35': '35 soat',
  'workPermit.hours.table.unlimited': 'Cheksiz',
  'workPermit.hours.table.criteria.bachelorY12':
    '① TOPIK 3-daraja\n② KIIP 3-bosqich+ yoki oldindan baholash 61+\n③ Sejong Institute O\'rta 1+',
  'workPermit.hours.table.criteria.bachelorY34':
    '① TOPIK 4-daraja\n② KIIP 4-bosqich+ yoki oldindan baholash 81+\n③ Sejong Institute O\'rta 2+',
  'workPermit.hours.table.criteria.grad':
    '① TOPIK 4-daraja\n② KIIP 4-bosqich+ yoki oldindan baholash 81+\n③ Sejong Institute O\'rta 2+',
  'workPermit.hours.bonus1':
    'Eng o\'ng ustun til talablari bajarilgan VA quyidagilardan biri bo\'lsa qo\'llanadi: sertifikatlangan universitet talabasi, o\'tgan semestrda hammasi A, yoki TOPIK 5+ / KIIP 5-step+.',
  'workPermit.hours.bonus2':
    '**O** belgilanganda dam olish kunlari, rasmiy bayramlar va maktab ta\'tillari **soat chegarasisiz**.',
  'workPermit.hours.bonus3':
    'Haqiqiy ruxsat kerak — jadvaldagi chegaralar avtomatik emas.',
  'workPermit.hours.note':
    '**X** belgilanganda ish kunlari, dam olish va ta\'tillarda bir xil chegara. Ingliz yo\'nalishidagi talabalar Koreys mezonlari o\'rniga Ingliz ballaridan foydalanadi.',

  'workPermit.documents.title': 'Kerakli hujjatlar (제출 서류)',
  'workPermit.documents.item1':
    'Ariza shakli, pasport, Chet ellik ro\'yxat kartasi (ARC) — **bepul**',
  'workPermit.documents.item2': 'Transkript (성적증명서)',
  'workPermit.documents.item3': 'Koreys yoki ingliz tilini bilishni tasdiqlovchi hujjat',
  'workPermit.documents.item4':
    'Universitet tasdig\'i: 외국인 유학생 시간제 취업 확인서 (**PNU Xalqaro ishlar** tomonidan beriladi)',
  'workPermit.documents.item5':
    'Talablarga rioya tasdig\'i: 외국인 유학생 시간제취업 요건 준수 확인서',
  'workPermit.documents.item6':
    'Ish beruvchining biznes ro\'yxati + ID, standart mehnat shartnomasi (soatlik maosh, vazifalar, soatlar ko\'rsatilgan)',
  'workPermit.documents.item7':
    'Ishlab chiqarish/qurilish ish beruvchilari: qo\'shimcha rioya shakli',
  'workPermit.documents.note':
    'Shartnoma ro\'yxatdan o\'tgan biznes bilan **to\'g\'ridan-to\'g\'ri** bo\'lishi kerak — kadrlar agentligi / dispatch **ruxsat etilmaydi**.',

  'workPermit.apply.title': 'Qanday ariza berish (신청 방법)',
  'workPermit.apply.step1':
    'Avval universitet tasdig\'i — PNU da tasdiq shakllari uchun **Xalqaro ishlar (국제처)** bilan bog\'laning.',
  'workPermit.apply.step2':
    'Mahalliy immigratsiya idorasida yoki [Hi Korea](https://www.hikorea.go.kr) orqali onlayn → 민원신청 → 전자민원.',
  'workPermit.apply.step3':
    'Tasdiq bir vaqtning o\'zida **2 ish joyi**gacha, qolgan yashash muddati uchun (har tasdiq uchun maks. 1 yil).',
  'workPermit.apply.step4':
    '**Ish o\'zgartiryapsizmi?** Yangi ish joyida boshlashdan **oldin** yangi ruxsat — retroaktiv emas.',
  'workPermit.apply.related.hiKorea': 'Hi Korea (rasmiy immigratsiya portali)',
  'workPermit.apply.note':
    '**Busan Immigration (부산출입국·외국인청):** Korean Air bldg 1F, 146 Jungang-daero, Jung-gu · Metro: Busan Stn (L1) Exit 2 yoki Jungang Exit 14 · Dush–Jum 9:00–18:00 (tushlik 12:00–13:00) · **1345** (ko\'p tilli liniya)',

  'workPermit.restrictions.title': 'Taqiqlangan ishlar (제한대상)',
  'workPermit.restrictions.item1':
    'Ishlab chiqarish/qurilish (ishlab chiqarish uchun TOPIK 4+; qurilish amalda hech qachon — bir buzilish = chiqish buyrug\'i)',
  'workPermit.restrictions.item2': 'Shaxsiy birma-bir repetitorlik (개인과외)',
  'workPermit.restrictions.item3':
    'Kattalar ko\'ngilochar / nightlife (hostess barlar, massaj/hammom, motel, o\'yin xonalari va hokazo)',
  'workPermit.restrictions.item4':
    'Platforma ishlar: yetkazib beruvchi, kuryer, designated driver, sug\'urta/eshikdan-eshikka sotuv',
  'workPermit.restrictions.item5': 'Faqat remote / telecommute lavozimlar',
  'workPermit.restrictions.item6': 'Kadrlar agentligi yoki mehnat dispatch/vositachiligi orqali ishlar',

  'workPermit.violations.title': 'Jazo choralar (위반 시 처리)',
  'workPermit.violations.table.colSituation': 'Vaziyat',
  'workPermit.violations.table.colResult': 'Oqibat',
  'workPermit.violations.table.row1Situation': 'Ruxsatsiz ishlash',
  'workPermit.violations.table.row1Result':
    'Noqonuniy bandlik — jazo; qurilish sektori = chiqish buyrug\'i',
  'workPermit.violations.table.row2Situation': '1-buzilish (noto\'g\'ri soat/ish joyi)',
  'workPermit.violations.table.row2Result': 'Rasmiy ogohlantirish',
  'workPermit.violations.table.row3Situation': '2-buzilish',
  'workPermit.violations.table.row3Result': 'O\'qishning qolgan qismida qisman ish taqiqlanadi',
  'workPermit.violations.table.row4Situation': '3-buzilish',
  'workPermit.violations.table.row4Result': 'Talaba maqomi (유학자격) bekor qilinishi mumkin',
  'workPermit.violations.note':
    'Ruxsatsiz ishlashning birinchi buzilishi ham jiddiy bo\'lishi mumkin. Shubha bo\'lsa, ish boshlashdan oldin **1345** ga qo\'ng\'iroq qiling.',
}

export default messages
