import type { MessageDictionary } from '../../types'

const messages: MessageDictionary = {
  'workPermit.subtitle': 'Uluslararası öğrenciler için yarı zamanlı çalışma izni (시간제 취업허가)',
  'workPermit.disclaimerTitle': 'Önemli',
  'workPermit.disclaimer':
    'Bu **göçmenlik yasasıdır** — kampüs formu değil. Yanlış bilgiler ceza, çalışma yasağı veya öğrenci statüsünün kaybına yol açabilir. Başvurmadan önce PNU **Uluslararası İşler (국제처)** veya **1345** hattıyla teyit edin.',
  'workPermit.sourceDate':
    'Adalet Bakanlığı rehberi, Şub 2026 temel alınmıştır. Resmi kurallar değişebilir — güncellemeler için [Hi Korea](https://www.hikorea.go.kr) adresine bakın.',
  'workPermit.keyPoints': 'Ana noktalar',
  'workPermit.steps': 'Adımlar',
  'workPermit.relatedPages': 'İlgili bağlantılar',
  'workPermit.note': 'Not',

  'workPermit.basics.title': 'İzin Gerekli mi? (기본원칙)',
  'workPermit.basics.point1':
    'D-2 öğrenci vizesi sahipleri izinsiz Kore\'de **çalışamaz ve gelir elde edemez** — yarı zamanlı işler (아르바이트) dahil.',
  'workPermit.basics.point2':
    '**Hem** üniversite **hem de** göçmenlik onayıyla sınırlı yarı zamanlı çalışmaya izin verilir.',
  'workPermit.basics.point3':
    'Uzmanlık işleri (E-1~E-7, örn. dil öğretimi) genellikle ayrı **체류자격외 활동허가** gerektirir — bu izin değil.',
  'workPermit.basics.note':
    'Bu rehber yalnızca standart yarı zamanlı işi kapsar. Araştırma/ev bakımı izinleri ayrı konulardır.',

  'workPermit.eligibility.title': 'Uygunluk (대상자 요건)',
  'workPermit.eligibility.point1':
    '**GPA:** Son dönemde C (2.0) veya üzeri. İlk dönem: transkript yoksa muaf, ancak saatler yarıya sınırlı.',
  'workPermit.eligibility.point2':
    '**Dil:** Aşağıdaki tabloya bakın. Dil şartı karşılanmasa da diğerleri tamamsa **normal saatin yarısı** izin verilebilir.',
  'workPermit.eligibility.point3':
    '**Kalış süresi:** Değişim/ziyaret öğrencileri (D-2-8) giriş veya statü değişiminden **6 ay** sonra.',
  'workPermit.eligibility.point4':
    '**Temiz kayıt:** Son 3 ayda yarı zamanlı çalışma ihlali yok.',
  'workPermit.eligibility.languageTable.title': 'Dil gereksinimleri',
  'workPermit.eligibility.languageTable.colLevel': 'Kim',
  'workPermit.eligibility.languageTable.colKorean': 'Korece program',
  'workPermit.eligibility.languageTable.colEnglish': 'İngilizce program (her yıl)',
  'workPermit.eligibility.languageTable.row1Level': 'Lisans, 1–2. yıl',
  'workPermit.eligibility.languageTable.row1Korean': 'TOPIK 3+ / KIIP 3-step+ / Sejong 중급1+',
  'workPermit.eligibility.languageTable.row1English': 'TOEFL 530 (iBT 71) / IELTS 5.5 / CEFR B2 / TEPS 327+',
  'workPermit.eligibility.languageTable.row2Level': 'Lisans Y3–4 ve lisansüstü',
  'workPermit.eligibility.languageTable.row2Korean': 'TOPIK 4+ / KIIP 4-step+ / Sejong 중급2+',
  'workPermit.eligibility.languageTable.row2English': 'Yukarıdakiyle aynı',
  'workPermit.eligibility.note':
    'İngilizce program öğrencileri Korece gereksinimler yerine İngilizce sütunu kullanır.',

  'workPermit.hours.title': 'İzin Verilen Saatler (허용 시간)',
  'workPermit.hours.table.title': 'Yarı zamanlı çalışma saat limitleri (시간제 취업활동 허용시간 차등 적용 기준)',
  'workPermit.hours.table.colCourse': 'Program',
  'workPermit.hours.table.colYear': 'Sınıf',
  'workPermit.hours.table.colKoreanCriteria': 'Korece yeterlilik',
  'workPermit.hours.table.colMet': 'Karşılandı?',
  'workPermit.hours.table.colAllowedHours': 'İzin verilen saat',
  'workPermit.hours.table.colWeekday': 'Hafta içi',
  'workPermit.hours.table.colWeekend': 'Hafta sonu · tatil',
  'workPermit.hours.table.colBonus': 'Sertifikalı üni.,\nmükemmel not,\nmükemmel Korece\n(hafta içi)',
  'workPermit.hours.table.bachelor': 'Lisans',
  'workPermit.hours.table.bachelorY12': 'Y1–2',
  'workPermit.hours.table.bachelorY34': 'Y3–4',
  'workPermit.hours.table.grad': 'YL/Doktora',
  'workPermit.hours.table.anyYear': 'Herhangi',
  'workPermit.hours.table.notMet': 'X',
  'workPermit.hours.table.met': 'O',
  'workPermit.hours.table.hours10': '10 sa',
  'workPermit.hours.table.hours15': '15 sa',
  'workPermit.hours.table.hours25': '25 sa',
  'workPermit.hours.table.hours30': '30 sa',
  'workPermit.hours.table.hours35': '35 sa',
  'workPermit.hours.table.unlimited': 'Sınırsız',
  'workPermit.hours.table.criteria.bachelorY12':
    '① TOPIK Seviye 3\n② KIIP Seviye 3+ veya ön değerlendirme 61+\n③ Sejong Institute Orta 1+',
  'workPermit.hours.table.criteria.bachelorY34':
    '① TOPIK Seviye 4\n② KIIP Seviye 4+ veya ön değerlendirme 81+\n③ Sejong Institute Orta 2+',
  'workPermit.hours.table.criteria.grad':
    '① TOPIK Seviye 4\n② KIIP Seviye 4+ veya ön değerlendirme 81+\n③ Sejong Institute Orta 2+',
  'workPermit.hours.bonus1':
    'En sağdaki sütun, dil şartı karşılandığında VE (sertifikalı üniversite öğrencisi / geçen dönem tüm A / TOPIK 5+·KIIP 5-step+) koşullarından biri sağlandığında uygulanır.',
  'workPermit.hours.bonus2':
    '**O** işaretlendiğinde hafta sonları, resmi tatiller ve okul tatillerinde **saat sınırı yok**.',
  'workPermit.hours.bonus3':
    'Gerçek bir izin gerekli — tablodaki limitler otomatik değil.',
  'workPermit.hours.note':
    '**X** işaretlendiğinde hafta içi, hafta sonu ve tatillerde aynı limit geçerli. İngilizce program öğrencileri Korece kriter sütunu yerine İngilizce puan kullanır.',

  'workPermit.documents.title': 'Gerekli Belgeler (제출 서류)',
  'workPermit.documents.item1':
    'Başvuru formu, pasaport, Yabancı Kimlik Kartı (ARC) — **ücretsiz**',
  'workPermit.documents.item2': 'Transkript (성적증명서)',
  'workPermit.documents.item3': 'Korece veya İngilizce yeterlilik belgesi',
  'workPermit.documents.item4':
    'Üniversite onayı: 외국인 유학생 시간제 취업 확인서 (**PNU Uluslararası İşler** tarafından verilir)',
  'workPermit.documents.item5':
    'Uyum onayı: 외국인 유학생 시간제취업 요건 준수 확인서',
  'workPermit.documents.item6':
    'İşverenin işletme kaydı + kimliği ve standart iş sözleşmesi (saatlik ücret, görevler, saatler belirtilmiş)',
  'workPermit.documents.item7':
    'İmalat/insaat işverenleri: ek uyum formu',
  'workPermit.documents.note':
    'Sözleşme kayıtlı işletmeyle **doğrudan** olmalı — personel ajansı / dispatch **yasak**.',

  'workPermit.apply.title': 'Nasıl Başvurulur (신청 방법)',
  'workPermit.apply.step1':
    'Önce üniversite onayı — PNU\'da onay formları için **Uluslararası İşler (국제처)** ile iletişime geçin.',
  'workPermit.apply.step2':
    'Yerel göçmenlik ofisine veya [Hi Korea](https://www.hikorea.go.kr) üzerinden online → 민원신청 → 전자민원.',
  'workPermit.apply.step3':
    'Onay aynı anda **2 iş yeri**ne kadar, kalan kalış süresi için geçerli (onay başına en fazla 1 yıl).',
  'workPermit.apply.step4':
    '**İş değiştiriyor musunuz?** Yeni işe başlamadan **önce** yeni izin — geriye dönük değil.',
  'workPermit.apply.related.hiKorea': 'Hi Korea (resmi göçmenlik portalı)',
  'workPermit.apply.note':
    '**Busan Immigration (부산출입국·외국인청):** Korean Air bldg 1F, 146 Jungang-daero, Jung-gu · Metro: Busan Stn (L1) Exit 2 veya Jungang Exit 14 · Pzt–Cum 9:00–18:00 (öğle 12:00–13:00) · **1345** (çok dilli hat)',

  'workPermit.restrictions.title': 'Yasaklı İşler (제한대상)',
  'workPermit.restrictions.item1':
    'İmalat/insaat (imalat için TOPIK 4+; inşaat pratikte asla — bir ihlal = çıkış emri)',
  'workPermit.restrictions.item2': 'Özel bire bir ders (개인과외)',
  'workPermit.restrictions.item3':
    'Yetişkin eğlence / nightlife (hostess barları, masaj/hamam, motel, oyun odaları vb.)',
  'workPermit.restrictions.item4':
    'Platform işleri: kurye, teslimat, designated driver, sigorta/kapı kapı satış',
  'workPermit.restrictions.item5': 'Yalnızca remote / telecommute pozisyonlar',
  'workPermit.restrictions.item6': 'Personel ajansı veya iş gücü dispatch/aracılığıyla işler',

  'workPermit.violations.title': 'Yaptırımlar (위반 시 처리)',
  'workPermit.violations.table.colSituation': 'Durum',
  'workPermit.violations.table.colResult': 'Sonuç',
  'workPermit.violations.table.row1Situation': 'İzinsiz çalışma',
  'workPermit.violations.table.row1Result':
    'Yasadışı istihdam — yaptırım; inşaat sektörü = çıkış emri',
  'workPermit.violations.table.row2Situation': '1. izin ihlali (yanlış saat/iş yeri)',
  'workPermit.violations.table.row2Result': 'Resmi uyarı',
  'workPermit.violations.table.row3Situation': '2. ihlal',
  'workPermit.violations.table.row3Result': 'Eğitimin geri kalanında yarı zamanlı çalışma yasağı',
  'workPermit.violations.table.row4Situation': '3. ihlal',
  'workPermit.violations.table.row4Result': 'Öğrenci statüsü (유학자격) iptal edilebilir',
  'workPermit.violations.note':
    'İzinsiz çalışmada ilk ihlal bile ciddi olabilir. Şüphede işe başlamadan önce **1345**\'i arayın.',
}

export default messages
