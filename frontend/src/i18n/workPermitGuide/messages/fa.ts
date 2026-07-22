import type { MessageDictionary } from '../../types'

const messages: MessageDictionary = {
  'workPermit.subtitle': 'راهنمای مجوز کار پاره‌وقت برای دانشجویان بین‌المللی (시간제 취업허가)',
  'workPermit.disclaimerTitle': 'مهم',
  'workPermit.disclaimer':
    'این **قانون مهاجرت** است — نه فرم دانشگاه. اطلاعات نادرست می‌تواند منجر به جریمه، ممنوعیت کار یا لغو وضعیت دانشجویی شود. قبل از درخواست با **امور بین‌الملل PNU (국제처)** یا خط **1345** تأیید کنید.',
  'workPermit.sourceDate':
    'بر اساس راهنمای MOJ، فوریه ۲۰۲۶. قوانین رسمی ممکن است تغییر کند — [Hi Korea](https://www.hikorea.go.kr) را برای به‌روزرسانی‌ها بررسی کنید.',
  'workPermit.keyPoints': 'نکات کلیدی',
  'workPermit.steps': 'مراحل',
  'workPermit.relatedPages': 'پیوندهای مرتبط',
  'workPermit.note': 'یادداشت',

  'workPermit.basics.title': 'آیا به مجوز نیاز دارید؟ (기본원칙)',
  'workPermit.basics.point1':
    'دارندگان ویزای دانشجویی D-2 **بدون مجوز نمی‌توانند در کره کار کنند یا درآمد کسب کنند** — شامل کار پاره‌وقت (아르바이트).',
  'workPermit.basics.point2':
    'با تأیید **هر دو** دانشگاه و مهاجرت، کار پاره‌وقت محدود مجاز است.',
  'workPermit.basics.point3':
    'مشاغل تخصصی (E-1~E-7، مثلاً تدریس زبان) معمولاً به **체류자격외 활동허가** جداگانه نیاز دارند — نه این مجوز.',
  'workPermit.basics.note':
    'این راهنما فقط کار پاره‌وقت استاندارد را پوشش می‌دهد. مجوزهای تحقیق/مراقبت خانگی موضوعات جداگانه‌اند.',

  'workPermit.eligibility.title': 'صلاحیت (대상자 요건)',
  'workPermit.eligibility.point1':
    '**GPA:** C (2.0) یا بالاتر در آخرین ترم. ترم اول: معاف اگر ریزنمره نیست، اما ساعات به نصف محدود می‌شود.',
  'workPermit.eligibility.point2':
    '**زبان:** جدول زیر را ببینید. اگر شرط زبان برآورده نشود اما بقیه OK باشد، مجوز با **نصف ساعات عادی** داده می‌شود.',
  'workPermit.eligibility.point3':
    '**مدت اقامت:** دانشجویان تبادل/بازدید (D-2-8) باید **۶ ماه** پس از ورود یا تغییر وضعیت صبر کنند.',
  'workPermit.eligibility.point4':
    '**سابقه پاک:** بدون تخلف کار پاره‌وقت در ۳ ماه گذشته.',
  'workPermit.eligibility.languageTable.title': 'الزامات زبان',
  'workPermit.eligibility.languageTable.colLevel': 'چه کسی',
  'workPermit.eligibility.languageTable.colKorean': 'مسیر کره‌ای',
  'workPermit.eligibility.languageTable.colEnglish': 'مسیر انگلیسی (هر سال)',
  'workPermit.eligibility.languageTable.row1Level': 'کارشناسی، سال ۱–۲',
  'workPermit.eligibility.languageTable.row1Korean': 'TOPIK 3+ / KIIP 3-step+ / Sejong 중급1+',
  'workPermit.eligibility.languageTable.row1English': 'TOEFL 530 (iBT 71) / IELTS 5.5 / CEFR B2 / TEPS 327+',
  'workPermit.eligibility.languageTable.row2Level': 'کارشناسی Y3–4 و تحصیلات تکمیلی',
  'workPermit.eligibility.languageTable.row2Korean': 'TOPIK 4+ / KIIP 4-step+ / Sejong 중급2+',
  'workPermit.eligibility.languageTable.row2English': 'مثل بالا',
  'workPermit.eligibility.note':
    'دانشجویان مسیر انگلیسی به جای الزامات کره‌ای از ستون انگلیسی استفاده می‌کنند.',

  'workPermit.hours.title': 'ساعات مجاز (허용 시간)',
  'workPermit.hours.table.title': 'محدودیت ساعات کار پاره‌وقت (시간제 취업활동 허용시간 차등 적용 기준)',
  'workPermit.hours.table.colCourse': 'برنامه',
  'workPermit.hours.table.colYear': 'سال تحصیلی',
  'workPermit.hours.table.colKoreanCriteria': 'مهارت زبان کره‌ای',
  'workPermit.hours.table.colMet': 'برآورده؟',
  'workPermit.hours.table.colAllowedHours': 'ساعات مجاز',
  'workPermit.hours.table.colWeekday': 'روزهای کاری',
  'workPermit.hours.table.colWeekend': 'آخر هفته · تعطیلات',
  'workPermit.hours.table.colBonus': 'دانشگاه معتبر،\nنمرات عالی،\nکره‌ای عالی\n(روز کاری)',
  'workPermit.hours.table.bachelor': 'کارشناسی',
  'workPermit.hours.table.bachelorY12': 'سال ۱–۲',
  'workPermit.hours.table.bachelorY34': 'سال ۳–۴',
  'workPermit.hours.table.grad': 'MA/PhD',
  'workPermit.hours.table.anyYear': 'هر',
  'workPermit.hours.table.notMet': 'X',
  'workPermit.hours.table.met': 'O',
  'workPermit.hours.table.hours10': '۱۰ ساعت',
  'workPermit.hours.table.hours15': '۱۵ ساعت',
  'workPermit.hours.table.hours25': '۲۵ ساعت',
  'workPermit.hours.table.hours30': '۳۰ ساعت',
  'workPermit.hours.table.hours35': '۳۵ ساعت',
  'workPermit.hours.table.unlimited': 'نامحدود',
  'workPermit.hours.table.criteria.bachelorY12':
    '① TOPIK سطح ۳\n② KIIP سطح ۳+ یا ارزیابی پیش از دوره ۶۱+\n③ Sejong Institute متوسط ۱+',
  'workPermit.hours.table.criteria.bachelorY34':
    '① TOPIK سطح ۴\n② KIIP سطح ۴+ یا ارزیابی پیش از دوره ۸۱+\n③ Sejong Institute متوسط ۲+',
  'workPermit.hours.table.criteria.grad':
    '① TOPIK سطح ۴\n② KIIP سطح ۴+ یا ارزیابی پیش از دوره ۸۱+\n③ Sejong Institute متوسط ۲+',
  'workPermit.hours.bonus1':
    'ستون انتهایی سمت راست در صورت برآورده شدن الزامات زبان و داشتن یکی از این‌ها اعمال می‌شود: دانشجوی دانشگاه معتبر، همه A ترم قبل، یا TOPIK 5+ / KIIP 5-step+.',
  'workPermit.hours.bonus2':
    'با علامت **O**، آخر هفته‌ها، تعطیلات رسمی و تعطیلات مدرسه **بدون محدودیت ساعت**.',
  'workPermit.hours.bonus3':
    'هنوز به مجوز واقعی نیاز دارید — محدودیت‌های جدول خودکار نیستند.',
  'workPermit.hours.note':
    'با علامت **X**، همان محدودیت برای روزهای کاری، آخر هفته و تعطیلات اعمال می‌شود. دانشجویان مسیر انگلیسی به جای ستون کره‌ای از نمرات انگلیسی استفاده می‌کنند.',

  'workPermit.documents.title': 'مدارک مورد نیاز (제출 서류)',
  'workPermit.documents.item1':
    'فرم درخواست، گذرنامه، کارت ثبت نام بیگانگان (ARC) — **بدون هزینه**',
  'workPermit.documents.item2': 'ریزنمره (성적증명서)',
  'workPermit.documents.item3': 'مدرک توانایی کره‌ای یا انگلیسی',
  'workPermit.documents.item4':
    'تأیید دانشگاه: 외국인 유학생 시간제 취업 확인서 (صادر شده توسط **امور بین‌الملل PNU**)',
  'workPermit.documents.item5':
    'تأیید رعایت: 외국인 유학생 시간제취업 요건 준수 확인서',
  'workPermit.documents.item6':
    'ثبت کسب‌وکار کارفرما + شناسنامه کارفرما، و قرارداد کار استاندارد (دستمزد ساعتی، وظایف، ساعات ذکر شده)',
  'workPermit.documents.item7':
    'کارفرمایان تولید/ساخت‌وساز: فرم رعایت اضافی',
  'workPermit.documents.note':
    'قرارداد باید **مستقیم** با کسب‌وکار ثبت‌شده باشد — آژانس استخدام / dispatch **مجاز نیست**.',

  'workPermit.apply.title': 'نحوه درخواست (신청 방법)',
  'workPermit.apply.step1':
    'ابتدا تأیید دانشگاه — در PNU با **امور بین‌الملل (국제처)** برای فرم‌های تأیید تماس بگیرید.',
  'workPermit.apply.step2':
    'در دفتر مهاجرت محلی یا آنلاین از [Hi Korea](https://www.hikorea.go.kr) → 민원신청 → 전자민원.',
  'workPermit.apply.step3':
    'تأیید تا **۲ محل کار** همزمان، برای باقیمانده اقامت (حداکثر ۱ سال در هر تأیید).',
  'workPermit.apply.step4':
    '**شغل عوض می‌کنید؟** مجوز جدید **قبل از** شروع در محل جدید — نه با اثر retroactive.',
  'workPermit.apply.related.hiKorea': 'Hi Korea (پورتال رسمی مهاجرت)',
  'workPermit.apply.note':
    '**Busan Immigration (부산출입국·외국인청):** Korean Air bldg 1F, 146 Jungang-daero, Jung-gu · Metro: Busan Stn (L1) Exit 2 یا Jungang Exit 14 · دو–ج ۹:۰۰–۱۸:۰۰ (ناهار ۱۲:۰۰–۱۳:۰۰) · **1345** (خط چندزبانه)',

  'workPermit.restrictions.title': 'مشاغل ممنوع (제한대상)',
  'workPermit.restrictions.item1':
    'تولید/ساخت‌وساز (TOPIK 4+ برای تولید؛ ساخت‌وساز عملاً هرگز — یک تخلف = دستور خروج)',
  'workPermit.restrictions.item2': 'تدریس خصوصی یک به یک (개인과외)',
  'workPermit.restrictions.item3':
    'سرگرمی بزرگسالان / nightlife (بار با hostess، ماساژ/حمام، متل، اتاق بازی و غیره)',
  'workPermit.restrictions.item4':
    'کارهای پلتفرمی: پیک، پست، designated driver، بیمه/فروش درب‌به‌درب',
  'workPermit.restrictions.item5': 'موقعیت‌های فقط remote / telecommute',
  'workPermit.restrictions.item6': 'مشاغل از طریق آژانس استخدام یا dispatch/واسطه‌گری نیروی کار',

  'workPermit.violations.title': 'مجازات (위반 시 처리)',
  'workPermit.violations.table.colSituation': 'وضعیت',
  'workPermit.violations.table.colResult': 'پیامد',
  'workPermit.violations.table.row1Situation': 'کار بدون مجوز',
  'workPermit.violations.table.row1Result':
    'اشتغال غیرقانونی — مجازات؛ بخش ساخت‌وساز = دستور خروج',
  'workPermit.violations.table.row2Situation': 'اولین تخلف مجوز (ساعات/محل اشتباه)',
  'workPermit.violations.table.row2Result': 'اخطار رسمی',
  'workPermit.violations.table.row3Situation': 'تخلف دوم',
  'workPermit.violations.table.row3Result': 'ممنوعیت کار پاره‌وقت تا پایان تحصیل',
  'workPermit.violations.table.row4Situation': 'تخلف سوم',
  'workPermit.violations.table.row4Result': 'وضعیت دانشجویی (유학자격) ممکن است لغو شود',
  'workPermit.violations.note':
    'حتی اولین تخلف برای کار بدون مجوز می‌تواند جدی باشد. در صورت تردید قبل از شروع کار **1345** را تماس بگیرید.',
}

export default messages
