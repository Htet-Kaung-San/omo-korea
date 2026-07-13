const SUPPORTED_LANGUAGES = [
  'en', 'ko', 'zh', 'th', 'bn', 'mn', 'vi', 'hi', 'kk', 'id',
  'fa', 'uz', 'ja', 'my', 'ur', 'ru', 'am', 'tr', 'es',
];

const LANGUAGE_ALIASES = {
  english: 'en',
  en: 'en',
  korean: 'ko',
  ko: 'ko',
  chinese: 'zh',
  zh: 'zh',
  thai: 'th',
  th: 'th',
  bengali: 'bn',
  bn: 'bn',
  mongolian: 'mn',
  mn: 'mn',
  vietnamese: 'vi',
  vi: 'vi',
  hindi: 'hi',
  hi: 'hi',
  kazakh: 'kk',
  kk: 'kk',
  indonesian: 'id',
  id: 'id',
  persian: 'fa',
  farsi: 'fa',
  fa: 'fa',
  uzbek: 'uz',
  uz: 'uz',
  japanese: 'ja',
  ja: 'ja',
  burmese: 'my',
  myanmar: 'my',
  my: 'my',
  urdu: 'ur',
  ur: 'ur',
  russian: 'ru',
  ru: 'ru',
  amharic: 'am',
  am: 'am',
  turkish: 'tr',
  tr: 'tr',
  spanish: 'es',
  es: 'es',
};

function entry(translations) {
  const normalized = { en: translations.en };
  SUPPORTED_LANGUAGES.forEach((lang) => {
    normalized[lang] = translations[lang] || translations.en;
  });
  return normalized;
}

const TRANSLATION_CATALOG = {
  'Database connection successful': entry({
    en: 'Database connection successful',
    ko: '데이터베이스 연결에 성공했습니다',
    zh: '数据库连接成功',
    th: 'เชื่อมต่อฐานข้อมูลสำเร็จ',
    bn: 'ডাটাবেস সংযোগ সফল হয়েছে',
    mn: 'Өгөгдлийн сангийн холболт амжилттай',
    vi: 'Kết nối cơ sở dữ liệu thành công',
    hi: 'डेटाबेस कनेक्शन सफल',
    kk: 'Дерекқорға қосылу сәтті өтті',
    id: 'Koneksi database berhasil',
    fa: 'اتصال پایگاه داده با موفقیت انجام شد',
    uz: "Ma'lumotlar bazasiga ulanish muvaffaqiyatli",
    ja: 'データベース接続に成功しました',
    my: 'ဒေတာဘေ့စ်ချိတ်ဆက်မှု အောင်မြင်ပါသည်',
    ur: 'ڈیٹا بیس کنکشن کامیاب',
    ru: 'Подключение к базе данных успешно',
    am: 'የውሂብ ጎታ ግንኙነት ተሳክቷል',
    tr: 'Veritabanı bağlantısı başarılı',
    es: 'Conexión a la base de datos exitosa',
  }),
  'Access denied. No token provided.': entry({
    en: 'Access denied. No token provided.',
    ko: '접근이 거부되었습니다. 토큰이 제공되지 않았습니다.',
    zh: '访问被拒绝。未提供令牌。',
    th: 'การเข้าถึงถูกปฏิเสธ ไม่มีโทเค็น',
    bn: 'অ্যাক্সেস অস্বীকৃত। কোনো টোকেন দেওয়া হয়নি।',
    mn: 'Хандах эрхгүй. Токен өгөөгүй байна.',
    vi: 'Truy cập bị từ chối. Không có token được cung cấp.',
    hi: 'पहुंच अस्वीकृत। कोई टोकन प्रदान नहीं किया गया।',
    kk: 'Қол жеткізу қабылданбады. Токен берілмеген.',
    id: 'Akses ditolak. Token tidak disediakan.',
    fa: 'دسترسی رد شد. توکن ارائه نشده است.',
    uz: 'Kirish rad etildi. Token berilmagan.',
    ja: 'アクセスが拒否されました。トークンが提供されていません。',
    my: 'ဝင်ခွင့်ငြင်းပယ်ခံရသည်။ တိုကင်မပေးထားပါ။',
    ur: 'رسائی مسترد۔ کوئی ٹوکن فراہم نہیں کیا گیا۔',
    ru: 'Доступ запрещён. Токен не предоставлен.',
    am: 'መዳረሻ ተከልክሏል። ቶከን አልተሰጠም።',
    tr: 'Erişim reddedildi. Token sağlanmadı.',
    es: 'Acceso denegado. No se proporcionó token.',
  }),
  'Invalid or expired token.': entry({
    en: 'Invalid or expired token.',
    ko: '유효하지 않거나 만료된 토큰입니다.',
    zh: '令牌无效或已过期。',
    th: 'โทเค็นไม่ถูกต้องหรือหมดอายุ',
    bn: 'অবৈধ বা মেয়াদোত্তীর্ণ টোকেন।',
    mn: 'Хүчингүй эсвэл хугацаа дууссан токен.',
    vi: 'Token không hợp lệ hoặc đã hết hạn.',
    hi: 'अमान्य या समाप्त टोकन।',
    kk: 'Жарамсыз немесе мерзімі өткен токен.',
    id: 'Token tidak valid atau kedaluwarsa.',
    fa: 'توکن نامعتبر یا منقضی شده است.',
    uz: "Yaroqsiz yoki muddati o'tgan token.",
    ja: '無効または期限切れのトークンです。',
    my: 'တိုကင်မမှန်ကန်ပါ သို့မဟုတ် သက်တမ်းကုန်ပါသည်။',
    ur: 'غلط یا میعاد ختم ٹوکن۔',
    ru: 'Недействительный или просроченный токен.',
    am: 'ልክ ያልሆነ ወይም ጊዜው ያለፈ ቶከን።',
    tr: 'Geçersiz veya süresi dolmuş token.',
    es: 'Token inválido o expirado.',
  }),
  'Validation failed': entry({
    en: 'Validation failed',
    ko: '유효성 검사에 실패했습니다',
    zh: '验证失败',
    th: 'การตรวจสอบล้มเหลว',
    bn: 'যাচাইকরণ ব্যর্থ হয়েছে',
    mn: 'Баталгаажуулалт амжилтгүй',
    vi: 'Xác thực thất bại',
    hi: 'सत्यापन विफल',
    kk: 'Тексеру сәтсіз аяқталды',
    id: 'Validasi gagal',
    fa: 'اعتبارسنجی ناموفق بود',
    uz: 'Tekshiruv muvaffaqiyatsiz',
    ja: 'バリデーションに失敗しました',
    my: 'အတည်ပြုခြင်း မအောင်မြင်ပါ',
    ur: 'توثیق ناکام',
    ru: 'Проверка не пройдена',
    am: 'ማረጋገጫ አልተሳካም',
    tr: 'Doğrulama başarısız',
    es: 'Validación fallida',
  }),
  'Student ID not registered': entry({
    en: 'Student ID not registered',
    ko: '등록되지 않은 학번입니다',
    zh: '学号未注册',
    th: 'รหัสนักศึกษายังไม่ได้ลงทะเบียน',
    bn: 'ছাত্র আইডি নিবন্ধিত নয়',
    mn: 'Оюутны ID бүртгэгдээгүй байна',
    vi: 'Mã sinh viên chưa được đăng ký',
    hi: 'छात्र आईडी पंजीकृत नहीं है',
    kk: 'Студент ID тіркелмеген',
    id: 'ID mahasiswa tidak terdaftar',
    fa: 'شناسه دانشجو ثبت نشده است',
    uz: "Talaba ID ro'yxatdan o'tmagan",
    ja: '登録されていない学籍番号です',
    my: 'ကျောင်းသား ID မမှတ်ပုံတင်ရသေးပါ',
    ur: 'طالب علم کی شناخت رجسٹرڈ نہیں',
    ru: 'ID студента не зарегистрирован',
    am: 'የተማሪ መታወቂያ አልተመዘገበም',
    tr: 'Öğrenci kimliği kayıtlı değil',
    es: 'ID de estudiante no registrado',
  }),
  'Profile configurations synchronized successfully': entry({
    en: 'Profile configurations synchronized successfully',
    ko: '프로필 설정이 성공적으로 동기화되었습니다',
    zh: '个人资料配置已成功同步',
    th: 'ซิงค์การตั้งค่าโปรไฟล์สำเร็จ',
    bn: 'প্রোফাইল কনফিগারেশন সফলভাবে সিঙ্ক হয়েছে',
    mn: 'Профайл тохиргоо амжилттай синхрончлогдлоо',
    vi: 'Đồng bộ cấu hình hồ sơ thành công',
    hi: 'प्रोफ़ाइल कॉन्फ़िगरेशन सफलतापूर्वक सिंक हुआ',
    kk: 'Профиль баптаулары сәтті синхрондалды',
    id: 'Konfigurasi profil berhasil disinkronkan',
    fa: 'تنظیمات پروفایل با موفقیت همگام‌سازی شد',
    uz: 'Profil sozlamalari muvaffaqiyatli sinxronlandi',
    ja: 'プロフィール設定が正常に同期されました',
    my: 'ပရိုဖိုင်ဆက်တင်များ အောင်မြင်စွာ ထပ်တူပြုပြီး',
    ur: 'پروفائل ترتیبات کامیابی سے ہم آہنگ',
    ru: 'Настройки профиля успешно синхронизированы',
    am: 'የመገለጫ ቅንብሮች በተሳካ ሁኔታ ተመሳሰሉ',
    tr: 'Profil ayarları başarıyla senkronize edildi',
    es: 'Configuración del perfil sincronizada correctamente',
  }),
  'AI personalized recommendation metrics compiled successfully': entry({
    en: 'AI personalized recommendation metrics compiled successfully',
    ko: 'AI 맞춤 추천 지표가 성공적으로 생성되었습니다',
    zh: 'AI 个性化推荐指标已成功生成',
    th: 'สร้างเมตริกคำแนะนำ AI ส่วนบุคคลสำเร็จ',
    bn: 'AI ব্যক্তিগত সুপারিশ মেট্রিক্স সফলভাবে তৈরি হয়েছে',
    mn: 'AI хувийн зөвлөмжийн үзүүлэлтүүд амжилттай бэлтгэгдлээ',
    vi: 'Chỉ số đề xuất AI cá nhân hóa đã được tạo thành công',
    hi: 'AI व्यक्तिगत सिफारिश मेट्रिक्स सफलतापूर्वक तैयार',
    kk: 'AI жекелендірілген ұсыныс көрсеткіштері сәтті дайындалды',
    id: 'Metrik rekomendasi AI personal berhasil dibuat',
    fa: 'شاخص‌های توصیه شخصی‌سازی‌شده هوش مصنوعی با موفقیت تهیه شد',
    uz: 'AI shaxsiy tavsiya ko‘rsatkichlari muvaffaqiyatli tayyorlandi',
    ja: 'AIパーソナライズ推薦指標が正常に生成されました',
    my: 'AI ကိုယ်ပိုင်အကြံပြုချက် မက်ထရစ်များ အောင်မြင်စွာ ပြုစုပြီး',
    ur: 'AI ذاتی سفارش میٹرکس کامیابی سے تیار',
    ru: 'Персонализированные AI-рекомендации успешно сформированы',
    am: 'የ AI ግላዊ ምክሮች በተሳካ ሁኔታ ተዘጋጅተዋል',
    tr: 'AI kişiselleştirilmiş öneri metrikleri başarıyla oluşturuldu',
    es: 'Métricas de recomendación personalizada de IA compiladas con éxito',
  }),
  'Unable to generate major recommendations.': entry({
    en: 'Unable to generate major recommendations.',
    ko: '전공 추천을 생성할 수 없습니다.',
    zh: '无法生成专业推荐。',
    th: 'ไม่สามารถสร้างคำแนะนำสาขาวิชาได้',
    bn: 'মেজর সুপারিশ তৈরি করা যায়নি।',
    mn: 'Мэргэжлийн зөвлөмжийг үүсгэж чадсангүй.',
    vi: 'Không thể tạo đề xuất ngành học.',
    hi: 'मेजर सिफारिशें उत्पन्न नहीं कर सके।',
    kk: 'Мамандық ұсыныстарын жасау мүмкін болмады.',
    id: 'Tidak dapat membuat rekomendasi jurusan.',
    fa: 'امکان تولید توصیه رشته وجود ندارد.',
    uz: 'Mutaxassislik tavsiyalarini yaratib bo‘lmadi.',
    ja: '専攻の推薦を生成できませんでした。',
    my: 'ဘာသာရပ်အကြံပြုချက်များ မထုတ်နိုင်ပါ',
    ur: 'میجر سفارشات نہیں بنا سکے۔',
    ru: 'Не удалось сформировать рекомендации по специальности.',
    am: 'የትምህርት መስክ ምክሮች ማመንጨት አልተቻለም።',
    tr: 'Bölüm önerileri oluşturulamadı.',
    es: 'No se pudieron generar recomendaciones de carrera.',
  }),
  'An unexpected server error occurred.': entry({
    en: 'An unexpected server error occurred.',
    ko: '예기치 않은 서버 오류가 발생했습니다.',
    zh: '发生意外服务器错误。',
    th: 'เกิดข้อผิดพลาดของเซิร์ฟเวอร์ที่ไม่คาดคิด',
    bn: 'একটি অপ্রত্যাশিত সার্ভার ত্রুটি ঘটেছে।',
    mn: 'Санамсаргүй серверийн алдаа гарлаа.',
    vi: 'Đã xảy ra lỗi máy chủ không mong muốn.',
    hi: 'एक अप्रत्याशित सर्वर त्रुटि हुई।',
    kk: 'Күтпеген сервер қатесі орын алды.',
    id: 'Terjadi kesalahan server yang tidak terduga.',
    fa: 'خطای غیرمنتظره سرور رخ داد.',
    uz: 'Kutilmagan server xatosi yuz berdi.',
    ja: '予期しないサーバーエラーが発生しました。',
    my: 'မမျှော်လင့်ထားသော ဆာဗာအမှား ဖြစ်ပွားခဲ့သည်',
    ur: 'ایک غیر متوقع سرور خرابی ہوئی۔',
    ru: 'Произошла непредвиденная ошибка сервера.',
    am: 'ያልተጠበቀ የሰርቨር ስህተት ተከስቷል።',
    tr: 'Beklenmeyen bir sunucu hatası oluştu.',
    es: 'Ocurrió un error inesperado del servidor.',
  }),
  'Title cannot be empty.': entry({
    en: 'Title cannot be empty.',
    ko: '제목은 비워둘 수 없습니다.',
    zh: '标题不能为空。',
    th: 'หัวข้อต้องไม่ว่าง',
    bn: 'শিরোনাম খালি রাখা যাবে না।',
    mn: 'Гарчиг хоосон байж болохгүй.',
    vi: 'Tiêu đề không được để trống.',
    hi: 'शीर्षक खाली नहीं हो सकता।',
    kk: 'Тақырып бос болмауы керек.',
    id: 'Judul tidak boleh kosong.',
    fa: 'عنوان نمی‌تواند خالی باشد.',
    uz: 'Sarlavha bo‘sh bo‘lmasligi kerak.',
    ja: 'タイトルは空にできません。',
    my: 'ခေါင်းစဉ် ဗလာမဖြစ်ရပါ',
    ur: 'عنوان خالی نہیں ہو سکتا۔',
    ru: 'Заголовок не может быть пустым.',
    am: 'ርዕስ ባዶ ሊሆን አይችልም።',
    tr: 'Başlık boş olamaz.',
    es: 'El título no puede estar vacío.',
  }),
  'Content cannot be empty.': entry({
    en: 'Content cannot be empty.',
    ko: '내용은 비워둘 수 없습니다.',
    zh: '内容不能为空。',
    th: 'เนื้อหาต้องไม่ว่าง',
    bn: 'বিষয়বস্তু খালি রাখা যাবে না।',
    mn: 'Агуулга хоосон байж болохгүй.',
    vi: 'Nội dung không được để trống.',
    hi: 'सामग्री खाली नहीं हो सकती।',
    kk: 'Мазмұн бос болмауы керек.',
    id: 'Konten tidak boleh kosong.',
    fa: 'محتوا نمی‌تواند خالی باشد.',
    uz: 'Kontent bo‘sh bo‘lmasligi kerak.',
    ja: '内容は空にできません。',
    my: 'အကြောင်းအရာ ဗလာမဖြစ်ရပါ',
    ur: 'مواد خالی نہیں ہو سکتا۔',
    ru: 'Содержимое не может быть пустым.',
    am: 'ይዘት ባዶ ሊሆን አይችልም።',
    tr: 'İçerik boş olamaz.',
    es: 'El contenido no puede estar vacío.',
  }),
  'Content must be at least 5 characters long.': entry({
    en: 'Content must be at least 5 characters long.',
    ko: '내용은 최소 5자 이상이어야 합니다.',
    zh: '内容至少需要 5 个字符。',
    th: 'เนื้อหาต้องมีอย่างน้อย 5 ตัวอักษร',
    bn: 'বিষয়বস্তু কমপক্ষে ৫ অক্ষরের হতে হবে।',
    mn: 'Агуулга дор хаяж 5 тэмдэгт байх ёстой.',
    vi: 'Nội dung phải có ít nhất 5 ký tự.',
    hi: 'सामग्री कम से कम 5 अक्षरों की होनी चाहिए।',
    kk: 'Мазмұн кемінде 5 таңбадан тұруы керек.',
    id: 'Konten harus minimal 5 karakter.',
    fa: 'محتوا باید حداقل ۵ کاراکتر باشد.',
    uz: 'Kontent kamida 5 belgidan iborat bo‘lishi kerak.',
    ja: '内容は5文字以上である必要があります。',
    my: 'အကြောင်းအရာသည် အနည်းဆုံး စာလုံး ၅ လုံး ရှိရမည်',
    ur: 'مواد کم از کم 5 حروف کا ہونا چاہیے۔',
    ru: 'Содержимое должно быть не менее 5 символов.',
    am: 'ይዘት ቢያንስ 5 ቁምፊዎች መሆን አለበት።',
    tr: 'İçerik en az 5 karakter olmalıdır.',
    es: 'El contenido debe tener al menos 5 caracteres.',
  }),
  'Content must be at least 2 characters long.': entry({
    en: 'Content must be at least 2 characters long.',
    ko: '내용은 최소 2자 이상이어야 합니다.',
    zh: '内容至少需要 2 个字符。',
    th: 'เนื้อหาต้องมีอย่างน้อย 2 ตัวอักษร',
    bn: 'বিষয়বস্তু কমপক্ষে ২ অক্ষরের হতে হবে।',
    mn: 'Агуулга дор хаяж 2 тэмдэгт байх ёстой.',
    vi: 'Nội dung phải có ít nhất 2 ký tự.',
    hi: 'सामग्री कम से कम 2 अक्षरों की होनी चाहिए।',
    kk: 'Мазмұн кемінде 2 таңбадан тұруы керек.',
    id: 'Konten harus minimal 2 karakter.',
    fa: 'محتوا باید حداقل ۲ کاراکتر باشد.',
    uz: 'Kontent kamida 2 belgidan iborat bo‘lishi kerak.',
    ja: '内容は2文字以上である必要があります。',
    my: 'အကြောင်းအရာသည် အနည်းဆုံး စာလုံး ၂ လုံး ရှိရမည်',
    ur: 'مواد کم از کم 2 حروف کا ہونا چاہیے۔',
    ru: 'Содержимое должно быть не менее 2 символов.',
    am: 'ይዘት ቢያንስ 2 ቁምፊዎች መሆን አለበት።',
    tr: 'İçerik en az 2 karakter olmalıdır.',
    es: 'El contenido debe tener al menos 2 caracteres.',
  }),
};

const TRANSLATABLE_KEYS = new Set([
  'message',
  'reason',
  'matchHint',
  'suggestedAction',
  'action',
  'eligibilityNote',
  'title',
  'description',
  'body',
]);

function normalizeLanguage(rawHeader = '') {
  const firstToken = String(rawHeader).split(',')[0].trim().toLowerCase();
  const baseCode = firstToken.split('-')[0];

  const resolved =
    LANGUAGE_ALIASES[firstToken] ||
    LANGUAGE_ALIASES[baseCode] ||
    'en';

  return SUPPORTED_LANGUAGES.includes(resolved) ? resolved : 'en';
}

function translateString(value, lang) {
  if (typeof value !== 'string' || !value.trim()) {
    return value;
  }

  if (lang === 'en') {
    return value;
  }

  const catalogEntry = TRANSLATION_CATALOG[value];
  if (catalogEntry && catalogEntry[lang]) {
    return catalogEntry[lang];
  }

  return value;
}

function translateObject(payload, lang) {
  if (lang === 'en' || payload == null) {
    return payload;
  }

  if (Array.isArray(payload)) {
    return payload.map((item) => translateObject(item, lang));
  }

  if (typeof payload !== 'object') {
    return typeof payload === 'string' ? translateString(payload, lang) : payload;
  }

  const translated = {};

  Object.entries(payload).forEach(([key, value]) => {
    if (key === 'errors' && Array.isArray(value)) {
      translated[key] = value.map((item) =>
        typeof item === 'string' ? translateString(item, lang) : translateObject(item, lang)
      );
      return;
    }

    if (typeof value === 'string' && (TRANSLATABLE_KEYS.has(key) || TRANSLATION_CATALOG[value])) {
      translated[key] = translateString(value, lang);
      return;
    }

    translated[key] = translateObject(value, lang);
  });

  return translated;
}

function languageInterceptor(req, res, next) {
  const lang = normalizeLanguage(req.headers['accept-language']);
  req.lang = lang;

  const originalJson = res.json.bind(res);

  res.json = (body) => {
    const localizedBody = translateObject(body, lang);
    res.setHeader('Content-Language', lang);
    return originalJson(localizedBody);
  };

  next();
}

module.exports = {
  SUPPORTED_LANGUAGES,
  normalizeLanguage,
  translateString,
  translateObject,
  languageInterceptor,
};
