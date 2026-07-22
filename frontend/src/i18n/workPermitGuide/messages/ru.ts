import type { MessageDictionary } from '../../types'

const messages: MessageDictionary = {
  'workPermit.subtitle': 'Разрешение на подработку для иностранных студентов (시간제 취업허가)',
  'workPermit.disclaimerTitle': 'Важно',
  'workPermit.disclaimer':
    'Это **иммиграционное законодательство** — не кампусная форма. Неверные сведения могут привести к штрафам, запрету на работу или потере студенческого статуса. Перед подачей уточните в **Международном отделе PNU (국제처)** или по телефону **1345**.',
  'workPermit.sourceDate':
    'На основе руководства MOJ, февр. 2026. Официальные правила могут измениться — проверяйте [Hi Korea](https://www.hikorea.go.kr).',
  'workPermit.keyPoints': 'Ключевые моменты',
  'workPermit.steps': 'Шаги',
  'workPermit.relatedPages': 'Ссылки',
  'workPermit.note': 'Примечание',

  'workPermit.basics.title': 'Нужно ли разрешение? (기본원칙)',
  'workPermit.basics.point1':
    'Держатели визы D-2 **не могут работать и получать доход** в Корее без разрешения — включая подработку (아르바이트).',
  'workPermit.basics.point2':
    'При одобрении **и** университета, **и** иммиграции допускается ограниченная подработка.',
  'workPermit.basics.point3':
    'Специализированная работа (E-1~E-7, напр. преподавание языка) обычно требует отдельного **체류자격외 활동허가** — не этого разрешения.',
  'workPermit.basics.note':
    'Это руководство только о стандартной подработке. Разрешения на исследования/уход — отдельная тема.',

  'workPermit.eligibility.title': 'Требования (대상자 요건)',
  'workPermit.eligibility.point1':
    '**GPA:** C (2.0) и выше за последний семестр. Первый семестр: освобождение без транскрипта, но часы ограничены наполовину.',
  'workPermit.eligibility.point2':
    '**Язык:** см. таблицу ниже. Если языковое требование не выполнено, но всё остальное в порядке — разрешение на **половину обычных часов**.',
  'workPermit.eligibility.point3':
    '**Срок пребывания:** студенты обмена/гостевые (D-2-8) должны ждать **6 месяцев** после въезда или смены статуса.',
  'workPermit.eligibility.point4':
    '**Чистая история:** без нарушений подработки за последние 3 месяца.',
  'workPermit.eligibility.languageTable.title': 'Языковые требования',
  'workPermit.eligibility.languageTable.colLevel': 'Кто',
  'workPermit.eligibility.languageTable.colKorean': 'Корейская программа',
  'workPermit.eligibility.languageTable.colEnglish': 'Английская программа (любой курс)',
  'workPermit.eligibility.languageTable.row1Level': 'Бакалавриат, 1–2 курс',
  'workPermit.eligibility.languageTable.row1Korean': 'TOPIK 3+ / KIIP 3-step+ / Sejong 중급1+',
  'workPermit.eligibility.languageTable.row1English': 'TOEFL 530 (iBT 71) / IELTS 5.5 / CEFR B2 / TEPS 327+',
  'workPermit.eligibility.languageTable.row2Level': 'Бакалавриат 3–4 & магистратура',
  'workPermit.eligibility.languageTable.row2Korean': 'TOPIK 4+ / KIIP 4-step+ / Sejong 중급2+',
  'workPermit.eligibility.languageTable.row2English': 'Как выше',
  'workPermit.eligibility.note':
    'Студенты английской программы используют английский столбец вместо корейских требований.',

  'workPermit.hours.title': 'Разрешённые часы (허용 시간)',
  'workPermit.hours.table.title': 'Лимиты часов подработки (시간제 취업활동 허용시간 차등 적용 기준)',
  'workPermit.hours.table.colCourse': 'Программа',
  'workPermit.hours.table.colYear': 'Курс',
  'workPermit.hours.table.colKoreanCriteria': 'Уровень корейского',
  'workPermit.hours.table.colMet': 'Выполнено?',
  'workPermit.hours.table.colAllowedHours': 'Разрешённые часы',
  'workPermit.hours.table.colWeekday': 'Будни',
  'workPermit.hours.table.colWeekend': 'Выходные · каникулы',
  'workPermit.hours.table.colBonus': 'Аккредитованный вуз,\nотличная успеваемость,\nотличный корейский\n(будни)',
  'workPermit.hours.table.bachelor': 'Бакалавриат',
  'workPermit.hours.table.bachelorY12': '1–2',
  'workPermit.hours.table.bachelorY34': '3–4',
  'workPermit.hours.table.grad': 'Маг/PhD',
  'workPermit.hours.table.anyYear': 'Любой',
  'workPermit.hours.table.notMet': 'X',
  'workPermit.hours.table.met': 'O',
  'workPermit.hours.table.hours10': '10 ч',
  'workPermit.hours.table.hours15': '15 ч',
  'workPermit.hours.table.hours25': '25 ч',
  'workPermit.hours.table.hours30': '30 ч',
  'workPermit.hours.table.hours35': '35 ч',
  'workPermit.hours.table.unlimited': 'Без ограничений',
  'workPermit.hours.table.criteria.bachelorY12':
    '① TOPIK уровень 3\n② KIIP уровень 3+ или предоценка 61+\n③ Sejong Institute Средний 1+',
  'workPermit.hours.table.criteria.bachelorY34':
    '① TOPIK уровень 4\n② KIIP уровень 4+ или предоценка 81+\n③ Sejong Institute Средний 2+',
  'workPermit.hours.table.criteria.grad':
    '① TOPIK уровень 4\n② KIIP уровень 4+ или предоценка 81+\n③ Sejong Institute Средний 2+',
  'workPermit.hours.bonus1':
    'Крайний правый столбец применяется при выполнении языковых требований И одном из: студент аккредитованного вуза, все A за прошлый семестр, или TOPIK 5+ / KIIP 5-step+.',
  'workPermit.hours.bonus2':
    'При отметке **O** выходные, праздники и официальные каникулы **без лимита часов**.',
  'workPermit.hours.bonus3':
    'Нужно действующее разрешение — лимиты в таблице не применяются автоматически.',
  'workPermit.hours.note':
    'При отметке **X** одинаковый лимит в будни, выходные и каникулы. Студенты английской программы используют английские баллы вместо корейских критериев.',

  'workPermit.documents.title': 'Необходимые документы (제출 서류)',
  'workPermit.documents.item1':
    'Заявление, паспорт, Alien Registration Card (ARC) — **бесплатно**',
  'workPermit.documents.item2': 'Транскрипт (성적증명서)',
  'workPermit.documents.item3': 'Подтверждение корейского или английского языка',
  'workPermit.documents.item4':
    'Подтверждение университета: 외국인 유학생 시간제 취업 확인서 (выдаёт **Международный отдел PNU**)',
  'workPermit.documents.item5':
    'Подтверждение соблюдения: 외국인 유학생 시간제취업 요건 준수 확인서',
  'workPermit.documents.item6':
    'Регистрация бизнеса работодателя + ID работодателя, стандартный трудовой договор (почасовая оплата, обязанности, часы указаны)',
  'workPermit.documents.item7':
    'Работодатели в производстве/строительстве: дополнительная форма соблюдения',
  'workPermit.documents.note':
    'Договор напрямую с зарегистрированным бизнесом — кадровые агентства / диспетчеризация **запрещены**.',

  'workPermit.apply.title': 'Как подать заявление (신청 방법)',
  'workPermit.apply.step1':
    'Сначала одобрение университета — в PNU обратитесь в **Международный отдел (국제처)** за формами подтверждения.',
  'workPermit.apply.step2':
    'Подайте в местное иммиграционное управление или онлайн через [Hi Korea](https://www.hikorea.go.kr) → 민원신청 → 전자민원.',
  'workPermit.apply.step3':
    'Разрешение на **2 места работы** одновременно, на оставшийся срок пребывания (макс. 1 год за одобрение).',
  'workPermit.apply.step4':
    '**Меняете работу?** Получите новое разрешение **до** начала на новом месте — не задним числом.',
  'workPermit.apply.related.hiKorea': 'Hi Korea (официальный иммиграционный портал)',
  'workPermit.apply.note':
    '**Busan Immigration (부산출입국·외국인청):** Korean Air bldg 1F, 146 Jungang-daero, Jung-gu · Metro: Busan Stn (L1) Exit 2 или Jungang Exit 14 · Пн–Пт 9:00–18:00 (обед 12:00–13:00) · **1345** (многоязычная линия)',

  'workPermit.restrictions.title': 'Запрещённые работы (제한대상)',
  'workPermit.restrictions.item1':
    'Производство/строительство (TOPIK 4+ для производства; строительство практически никогда — одно нарушение = приказ о выезде)',
  'workPermit.restrictions.item2': 'Частное репетиторство один на один (개인과외)',
  'workPermit.restrictions.item3':
    'Развлечения для взрослых / nightlife (бары с hostess, массаж/бани, мотели, игровые комнаты и т.д.)',
  'workPermit.restrictions.item4':
    'Платформенная работа: курьеры, доставка, designated driver, страхование/продажи от двери до двери',
  'workPermit.restrictions.item5': 'Только remote / telecommute',
  'workPermit.restrictions.item6': 'Работа через кадровые агентства или диспетчеризацию/посредников',

  'workPermit.violations.title': 'Санкции (위반 시 처리)',
  'workPermit.violations.table.colSituation': 'Ситуация',
  'workPermit.violations.table.colResult': 'Последствие',
  'workPermit.violations.table.row1Situation': 'Работа без разрешения',
  'workPermit.violations.table.row1Result':
    'Незаконная занятость — санкции; строительство = приказ о выезде',
  'workPermit.violations.table.row2Situation': '1-е нарушение разрешения (часы/место)',
  'workPermit.violations.table.row2Result': 'Официальное предупреждение',
  'workPermit.violations.table.row3Situation': '2-е нарушение',
  'workPermit.violations.table.row3Result': 'Запрет подработки до конца обучения',
  'workPermit.violations.table.row4Situation': '3-е нарушение',
  'workPermit.violations.table.row4Result': 'Студенческий статус (유학자격) может быть отозван',
  'workPermit.violations.note':
    'Даже первое нарушение за работу без разрешения может быть серьёзным. При сомнениях звоните **1345** до начала работы.',
}

export default messages
