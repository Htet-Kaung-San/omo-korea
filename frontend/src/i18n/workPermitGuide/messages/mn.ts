import type { MessageDictionary } from '../../types'

const messages: MessageDictionary = {
  'workPermit.subtitle': 'Гадаад оюутны цагийн ажлын зөвшөөрлийн заавар (시간제 취업허가)',
  'workPermit.disclaimerTitle': 'Чухал',
  'workPermit.disclaimer':
    'Энэ нь **хил хяналтын хууль** бөгөөд сургуулийн албан бусад биш. Буруу мэдээлэл нь торгууль, ажил хориглох, суралцах эрх цуцлахад хүргэнэ. Өргөдөл гэхээсээ өмнө PNU **Олон улсын хэлтэс (국제처)** эсвэл **1345** дугаарт баталгаажуулна уу.',
  'workPermit.sourceDate':
    'Шүүхийн яамны 2026 оны 2-р сарын зааварт үндэслэсэн. Албан ёсны дүрэм өөрчлөгдөж болно — шинэчлэлийг [Hi Korea](https://www.hikorea.go.kr) сайтаас шалгана уу.',
  'workPermit.keyPoints': 'Гол зүйлс',
  'workPermit.steps': 'Алхам',
  'workPermit.relatedPages': 'Холбоос',
  'workPermit.note': 'Тэмдэглэл',

  'workPermit.basics.title': 'Зөвшөөрөл хэрэгтэй юу? (기본원칙)',
  'workPermit.basics.point1':
    'D-2 визтэй оюутнууд зөвшөөрөлгүйгээр Солонгос дахь **ажиллаж, орлого олох боломжгүй** — цагийн ажил (아르바이트) орно.',
  'workPermit.basics.point2':
    '**Их сургууль болон цагаачны алба хоёул** зөвшөөрсний дараа хязгаарлагдмал цагийн ажил зөвшөөрөгдөнө.',
  'workPermit.basics.point3':
    'Мэргэжлийн ажил (E-1~E-7, жишээ нь хэлний багш) ихэнхдээ тусдаа **체류자격외 활동허가** шаарддаг — энэ зөвшөөрлөөр хамаарахгүй.',
  'workPermit.basics.note':
    'Энэ заавар ерөнхий цагийн ажлыг л хамарна. Судалгаа/гэрийн асрамжийн зөвшөөрөл тусдаа сэдэв.',

  'workPermit.eligibility.title': 'Шалгуур (대상자 요건)',
  'workPermit.eligibility.point1':
    '**GPA:** Сүүлийн семестр C (2.0) ба дээш. Эхний семестр: хэсэг хугацааны дүн байхгүй бол чөлөөлөгдөнө, гэхдээ цаг хагас хязгаартай.',
  'workPermit.eligibility.point2':
    '**Хэл:** Доорх хүснэгтийг үзнэ үү. Хэлний шалгуур биелээгүй ч бусад нь OK бол **хэвийн цагийн хагас** зөвшөөрнө.',
  'workPermit.eligibility.point3':
    '**Хугацаа:** Солилцоо/зочлох оюутнууд (D-2-8) орж ирээд эсвэл статус солисноос **6 сар** хүлээнэ.',
  'workPermit.eligibility.point4':
    '**Зөрчилгүй:** Сүүлийн 3 сард цагийн ажлын зөрчил байхгүй.',
  'workPermit.eligibility.languageTable.title': 'Хэлний шаардлага',
  'workPermit.eligibility.languageTable.colLevel': 'Хэн',
  'workPermit.eligibility.languageTable.colKorean': 'Солонгос хөтөлбөр',
  'workPermit.eligibility.languageTable.colEnglish': 'Англи хөтөлбөр (аль ч курс)',
  'workPermit.eligibility.languageTable.row1Level': 'Бакалavр 1–2-р курс',
  'workPermit.eligibility.languageTable.row1Korean': 'TOPIK 3+ / KIIP 3-р шат+ / Sejong 중급1+',
  'workPermit.eligibility.languageTable.row1English': 'TOEFL 530 (iBT 71) / IELTS 5.5 / CEFR B2 / TEPS 327+',
  'workPermit.eligibility.languageTable.row2Level': 'Бакалavр 3–4 & магistr',
  'workPermit.eligibility.languageTable.row2Korean': 'TOPIK 4+ / KIIP 4-р шат+ / Sejong 중급2+',
  'workPermit.eligibility.languageTable.row2English': 'Дээрхтэй адил',
  'workPermit.eligibility.note':
    'Англи хөтөлбөрийн оюутнууд Солонгос шаардлагын оронд Англи баганыг ашиглана.',

  'workPermit.hours.title': 'Зөвшөөрөгдсөн цаг (허용 시간)',
  'workPermit.hours.table.title': 'Цагийн хязгаар (시간제 취업활동 허용시간 차등 적용 기준)',
  'workPermit.hours.table.colCourse': 'Хөтөлбөр',
  'workPermit.hours.table.colYear': 'Курс',
  'workPermit.hours.table.colKoreanCriteria': 'Солонгос хэлний чадвар',
  'workPermit.hours.table.colMet': 'Биелсэн\nэсэх',
  'workPermit.hours.table.colAllowedHours': 'Зөвшөөрөгдсөн цаг',
  'workPermit.hours.table.colWeekday': 'Ажлын өдөр',
  'workPermit.hours.table.colWeekend': 'Амралт · сургуулийн амралт',
  'workPermit.hours.table.colBonus': 'Баталгаажсан их сургууль,\nгайхамшигтай дүн,\nСолонгос хэл сайн\n(ажлын өдөр)',
  'workPermit.hours.table.bachelor': 'Бакалavр',
  'workPermit.hours.table.bachelorY12': '1–2',
  'workPermit.hours.table.bachelorY34': '3–4',
  'workPermit.hours.table.grad': 'Магistr/PhD',
  'workPermit.hours.table.anyYear': 'Ямар ч',
  'workPermit.hours.table.notMet': 'X',
  'workPermit.hours.table.met': 'O',
  'workPermit.hours.table.hours10': '10 цаг',
  'workPermit.hours.table.hours15': '15 цаг',
  'workPermit.hours.table.hours25': '25 цаг',
  'workPermit.hours.table.hours30': '30 цаг',
  'workPermit.hours.table.hours35': '35 цаг',
  'workPermit.hours.table.unlimited': 'Хязгааргүй',
  'workPermit.hours.table.criteria.bachelorY12':
    '① TOPIK 3-р түvшин\n② KIIP 3-р шат+ эсвэл урьдчилсан үнэлгээ 61+\n③ Sejong Institute Дунд 1+',
  'workPermit.hours.table.criteria.bachelorY34':
    '① TOPIK 4-р түvшин\n② KIIP 4-р шат+ эсвэл урьдчилсан үнэлгээ 81+\n③ Sejong Institute Дунд 2+',
  'workPermit.hours.table.criteria.grad':
    '① TOPIK 4-р түvшин\n② KIIP 4-р шат+ эсвэл урьдчилсан үнэлгээ 81+\n③ Sejong Institute Дунд 2+',
  'workPermit.hours.bonus1':
    'Баруун талын багана нь хэлний шаардлага биелсэн бөгөөд (баталгаажсан их сургуулийн оюутан / өмнөх семестр бүх A / TOPIK 5+·KIIP 5-р шат+) нэг нь тохирох үед хэрэглэгдэнэ.',
  'workPermit.hours.bonus2':
    '**O** гэж тэмдэглэсэн үед бямба, ням, баярын өдөр, албан ёсны сургуулийн амралт **цаг хязгааргүй**.',
  'workPermit.hours.bonus3':
    'Хүснэгтийн цаг автоматаар хэрэгжихгүй — зөвшөөрөл авсан байх ёстой.',
  'workPermit.hours.note':
    '**X** гэж тэмдэглэсэн үед ажлын өдөр, амралт, сургуулийн амралт бүгд ижил хязгаартай. Англи хөтөлбөрийн оюутнууд Солонгос шалгуурын оронд Англи оноо ашиглана.',

  'workPermit.documents.title': 'Шаардлагатай баримт (제출 서류)',
  'workPermit.documents.item1':
    'Өргөдлийн маягт, төлөөlj, Гадаад иргэний бүртгэлийн карт (ARC) — **төлбөргүй**',
  'workPermit.documents.item2': 'Хэсэг хугацааны дүн (성적증명서)',
  'workPermit.documents.item3': 'Солонгос эсвэл англи хэлний чадварын баталгаа',
  'workPermit.documents.item4':
    'Их сургуулийн баталгаа: 외국인 유학생 시간제 취업 확인서 (PNU **Олон улсын хэлтэс**-ээс гаргана)',
  'workPermit.documents.item5':
    'Шалгуур мөрдсөн баталгаа: 외국인 유학생 시간제취업 요건 준수 확인서',
  'workPermit.documents.item6':
    'Ажил олгогчийн бизнес бүртгэл + ажил олгогчийн ID, стандарт хөдөлмөрийн гэрээ (цагийн цалин, үүрэг, цаг заасан)',
  'workPermit.documents.item7':
    'Үйлдвэр/барилгын ажил олгогч: нэмэлт мөрдөх маягт',
  'workPermit.documents.note':
    'Бүртгэлтэй байгууллагатай **шууд** гэрээ байх ёстой — ажил хуваарилах/зуучлал **хориглоно**.',

  'workPermit.apply.title': 'Хэрхэн өргөдөл (신청 방법)',
  'workPermit.apply.step1':
    'Эхлээд их сургуулийн баталгаа авна — PNU-д **Олон улсын хэлтэс (국제처)**-т холбогдон баталгааны маягт авна.',
  'workPermit.apply.step2':
    'Орон нутгийн цагаачны газар эсвэл [Hi Korea](https://www.hikorea.go.kr) онлайн → 민원신청 → 전자민원.',
  'workPermit.apply.step3':
    'Зөвшөөрөл **2 ажлын газар** хүртэл, үлдсэн хугацаанд (нэг удаад хамгийн ихдээ 1 жил).',
  'workPermit.apply.step4':
    '**Ажил солих уу?** Шинэ ажил эхлэхээс **өмнө** шинэ зөвшөөрөл — хуучин ажилд буцааж хамааруулахгүй.',
  'workPermit.apply.related.hiKorea': 'Hi Korea (албан ёсны цагаачны портал)',
  'workPermit.apply.note':
    '**Busan цагаачны газар (부산출입국·외국인청):** Korean Air bldg 1F, Jung-gu Jungang-daero 146 · Metro: Busan Stn (L1) Exit 2 эсвэл Jungang Exit 14 · Д–Ба 9:00–18:00 (өдөр 12:00–13:00) · **1345** (олон хэлний зөвлөх)',

  'workPermit.restrictions.title': 'Хориглосон ажил (제한대상)',
  'workPermit.restrictions.item1':
    'Үйлдвэр/барилга (үйлдвэрт TOPIK 4+ шаардлагатай; барилга бараг хэзээ ч зөвшөөрөхгүй — нэг зөрчил = гарах захирамж)',
  'workPermit.restrictions.item2': 'Хувийн нэг багш (개인과외)',
  'workPermit.restrictions.item3':
    'Насанд хүрэгчдийн үйлчилгээ / nightlife (hostess-тэй bar, massage/усан сан, motel, тоглоомын өрөө г.м.)',
  'workPermit.restrictions.item4':
    'Платформын ажил: хүргэлт, courier, designated driver, даатгал/хаалга хаалгаар борлуулалт',
  'workPermit.restrictions.item5': 'Зөвхөн алсаас ажил',
  'workPermit.restrictions.item6': 'Ажил хуваарилах агентлаг эсвэл хөдөлмөрийн зуучлалаар олсон ажил',

  'workPermit.violations.title': 'Зөрчлийн арга хэмжээ (위반 시 처리)',
  'workPermit.violations.table.colSituation': 'Нөхцөл',
  'workPermit.violations.table.colResult': 'Үр дагавар',
  'workPermit.violations.table.row1Situation': 'Зөвшөөрөлгүй ажил',
  'workPermit.violations.table.row1Result':
    'Хууль бус ажил — торгууль; барилга салбар = гарах захирамж',
  'workPermit.violations.table.row2Situation': '1-р зөрчил (буруу цаг/ажлын газар)',
  'workPermit.violations.table.row2Result': 'Албан ёсны анхааруулга',
  'workPermit.violations.table.row3Situation': '2-р зөрчил',
  'workPermit.violations.table.row3Result': 'Суралцах хугацаанд цагийн ажил хориглогдоно',
  'workPermit.violations.table.row4Situation': '3-р зөрчил',
  'workPermit.violations.table.row4Result': 'Суралцах эрх (유학자격) цуцлагдаж болно',
  'workPermit.violations.note':
    'Зөвшөөрөлгүй ажлын эхний зөрчил ч ноцтой торгуультай. Эргэлзвэл ажил эхлэхээс өмнө **1345**-д залгана уу.',
}

export default messages
