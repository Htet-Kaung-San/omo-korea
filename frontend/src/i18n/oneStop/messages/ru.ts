import type { MessageDictionary } from '../../types'

const messages: MessageDictionary = {
  'oneStop.subtitle': 'Пошаговые инструкции для onestop.pusan.ac.kr',
  'oneStop.steps': 'Шаги',
  'oneStop.relatedPages': 'Связанные страницы',
  'oneStop.note': 'Примечание',

  'oneStop.registration.title': 'Регистрация на курсы (수강신청)',
  'oneStop.registration.step1':
    'Войдите на [onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main) с номером студента и паролем.',
  'oneStop.registration.step2':
    'Перейдите в 수업 (Classes) → 수강신청및확인 (Registration & Confirmation).',
  'oneStop.registration.step3':
    'Сначала проверьте каталог курсов: [수강편람 (Course Catalog)](https://onestop.pusan.ac.kr/page?menuCD=000000000000335) — поиск по факультету, просмотр открытых групп, проверка лимита мест.',
  'oneStop.registration.step4':
    'В период регистрации фактическая подача происходит в отдельной системе: [sugang.pusan.ac.kr](https://sugang.pusan.ac.kr) (ПК или мобильная версия). Это другой сайт, не One-Stop — не путайтесь, если вас перенаправят сюда.',
  'oneStop.registration.step5':
    'После подачи вернитесь в One-Stop → [수강확인 (Registration Check)](https://onestop.pusan.ac.kr/page?menuCD=000000000000355), чтобы убедиться, что курсы действительно зарегистрированы — делайте это каждый раз, так как "wishlist" (희망과목담기) не равно подтверждённой регистрации.',
  'oneStop.registration.related.addDrop': 'Добавление/снятие курсов (수강신청및수강정정)',
  'oneStop.registration.related.cancellation': 'Отмена курса (수강취소)',
  'oneStop.registration.related.timetable': 'Просмотр расписания (시간표조회)',
  'oneStop.registration.note':
    'Регистрация открывается только в определённые периоды по академическому календарю (обычно указаны на главной странице One-Stop). Проверьте даты заранее — система доступна только в эти периоды.',

  'oneStop.cancellation.title': 'Отмена курса / Отчисление (수강취소)',
  'oneStop.cancellation.step1':
    'Войдите на [onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main).',
  'oneStop.cancellation.step2':
    'Перейдите в 수업 (Classes) → 수강취소 (Course Cancellation): [Course Cancellation (수강취소)](https://onestop.pusan.ac.kr/page?menuCD=000000000000358)',
  'oneStop.cancellation.step3': 'Выберите курс(ы) для отмены и подтвердите.',
  'oneStop.cancellation.step4':
    'Затем снова проверьте [수강확인 (Registration Check)](https://onestop.pusan.ac.kr/page?menuCD=000000000000355), чтобы убедиться, что курс больше не отображается в активном расписании.',
  'oneStop.cancellation.note':
    'Это отличается от 수강정정 (add/drop), которое происходит в начале семестра без оставления записи. 수강취소 открывается позже в семестре (обычно короткий период после середины семестра) и оставляет отметку W (Withdrawal) в транскрипте, а не полностью удаляет курс. Точные даты устанавливаются каждый семестр в академическом календаре.',

  'oneStop.grades.title': 'Проверка оценок (성적확인)',
  'oneStop.grades.step1':
    'Войдите на [onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main).',
  'oneStop.grades.step2': 'Перейдите в 수업 (Classes) → раздел оценок.',
  'oneStop.grades.step3':
    'Текущий семестр: [Current Semester Grades (금학기성적조회)](https://onestop.pusan.ac.kr/page?menuCD=000000000000144)',
  'oneStop.grades.step4':
    'Все семестры: [All Semesters Grades (전체성적조회)](https://onestop.pusan.ac.kr/page?menuCD=000000000000145)',
  'oneStop.grades.note':
    'Оценки текущего семестра обычно видны только после завершения публикации итоговых оценок — если пусто, оценки могут ещё не быть опубликованы.',

  'oneStop.tuition.title': 'Оплата обучения — Счёт и подтверждение оплаты (등록금 고지서 / 납부확인)',
  'oneStop.tuition.step1':
    'Войдите на [onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main).',
  'oneStop.tuition.step2': 'Перейдите в меню 등록 (Registration/Tuition).',
  'oneStop.tuition.step3': 'Распечатать/просмотреть счёт: 고지서출력 (Bill Print).',
  'oneStop.tuition.step4':
    'Запишите код оплаты университета на счёте (зависит от банка — NH, Busan Bank, Hana и т.д.) и оплатите через банковский перевод, банкомат, интернет/телефонный банкинг или в отделении банка.',
  'oneStop.tuition.step5':
    'Подтвердите оплату: 납부확인 (Payment Confirmation / Receipt Print) — проверьте после оплаты, так как оплата не всегда отражается мгновенно.',
  'oneStop.tuition.note':
    'Счёт за обучение нельзя запросить по телефону/электронной почте/факсу от вашего имени — вы должны получить доступ самостоятельно под своим логином.',

  'oneStop.leaveReturn.title': 'Академический отпуск / Возвращение (휴학 / 복학 신청)',
  'oneStop.leaveReturn.step1':
    'Войдите на [onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main).',
  'oneStop.leaveReturn.step2':
    'Подать заявление на академический отпуск: [Leave of Absence Application (휴학신청)](https://onestop.pusan.ac.kr/page?menuCD=000000000000322)',
  'oneStop.leaveReturn.step3':
    'Подать заявление на возвращение: [Return to School Application (복학신청)](https://onestop.pusan.ac.kr/page?menuCD=000000000000323)',
  'oneStop.leaveReturn.note':
    'У обоих есть определённые периоды подачи каждый семестр (см. академический календарь на главной странице One-Stop) — подача вне периода может быть невозможна.',
}

export default messages
