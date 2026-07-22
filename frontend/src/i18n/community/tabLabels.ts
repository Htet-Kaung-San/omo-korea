import { MAJOR_OPTIONS } from '@/data/options'
import type { LanguageCode, MessageDictionary } from '../types'

export function slugifyProfileLabel(raw: string): string {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const NATIONALITY_ISO: Record<string, string> = {
  vietnam: 'VN',
  vietnamese: 'VN',
  china: 'CN',
  chinese: 'CN',
  prc: 'CN',
  japan: 'JP',
  japanese: 'JP',
  uzbekistan: 'UZ',
  uzbek: 'UZ',
  mongolia: 'MN',
  mongolian: 'MN',
  kazakhstan: 'KZ',
  kazakh: 'KZ',
  russia: 'RU',
  russian: 'RU',
  indonesia: 'ID',
  indonesian: 'ID',
  'united states': 'US',
  american: 'US',
  usa: 'US',
  canada: 'CA',
  canadian: 'CA',
  france: 'FR',
  french: 'FR',
  germany: 'DE',
  german: 'DE',
  taiwan: 'TW',
  myanmar: 'MM',
  burma: 'MM',
  burmese: 'MM',
  thailand: 'TH',
  thai: 'TH',
  philippines: 'PH',
  filipino: 'PH',
  malaysia: 'MY',
  malaysian: 'MY',
  nepal: 'NP',
  nepalese: 'NP',
  nepali: 'NP',
  bangladesh: 'BD',
  bangladeshi: 'BD',
  india: 'IN',
  indian: 'IN',
  pakistan: 'PK',
  pakistani: 'PK',
  brazil: 'BR',
  brazilian: 'BR',
  mexico: 'MX',
  mexican: 'MX',
  'united kingdom': 'GB',
  british: 'GB',
  uk: 'GB',
  'south korea': 'KR',
  korean: 'KR',
  korea: 'KR',
}

export function resolveCountryIso(nationality: string): string | null {
  const key = nationality.trim().toLowerCase()
  if (!key) return null
  if (NATIONALITY_ISO[key]) return NATIONALITY_ISO[key]

  const compact = key.replace(/\s+/g, ' ')
  if (NATIONALITY_ISO[compact]) return NATIONALITY_ISO[compact]

  return null
}

export function translateCountryLabel(nationality: string | undefined, locale: string): string {
  const raw = nationality?.trim()
  if (!raw) return ''

  const iso = resolveCountryIso(raw)
  if (!iso) return raw

  try {
    return new Intl.DisplayNames([locale], { type: 'region' }).of(iso) ?? raw
  } catch {
    return raw
  }
}

function majorKey(slug: string): string {
  return `community.major.${slug}`
}

function buildEnglishMajorMessages(): MessageDictionary {
  const messages: MessageDictionary = {}
  for (const major of MAJOR_OPTIONS) {
    const slug = slugifyProfileLabel(major)
    if (slug) messages[majorKey(slug)] = major
  }
  return messages
}

/** Localized major names keyed by slug — overrides English defaults from MAJOR_OPTIONS */
const MAJOR_OVERRIDES: Partial<Record<LanguageCode, Record<string, string>>> = {
  ko: {
    'computer-science-and-engineering': '컴퓨터공학과',
    'computer-engineering': '컴퓨터공학',
    'artificial-intelligence': '인공지능학과',
    'business-administration': '경영학과',
    'mechanical-engineering': '기계공학과',
    'electrical-engineering': '전기공학과',
    'korean-language-and-literature': '국어국문학과',
    'international-studies': '국제학과',
    'data-science': '데이터사이언스',
    mathematics: '수학과',
    physics: '물리학과',
    chemistry: '화학과',
    'biological-sciences': '생물학과',
  },
  zh: {
    'computer-science-and-engineering': '计算机科学与工程',
    'computer-engineering': '计算机工程',
    'artificial-intelligence': '人工智能',
    'business-administration': '经营学',
    'mechanical-engineering': '机械工程',
    'electrical-engineering': '电气工程',
    'korean-language-and-literature': '韩国语言文学',
    mathematics: '数学',
    physics: '物理',
    chemistry: '化学',
  },
  ja: {
    'computer-science-and-engineering': 'コンピュータ工学',
    'computer-engineering': 'コンピュータ工学',
    'artificial-intelligence': '人工知能',
    'business-administration': '経営学',
    'mechanical-engineering': '機械工学',
    'electrical-engineering': '電気工学',
  },
  vi: {
    'computer-science-and-engineering': 'Khoa học máy tính & Kỹ thuật',
    'computer-engineering': 'Kỹ thuật máy tính',
    'artificial-intelligence': 'Trí tuệ nhân tạo',
    'business-administration': 'Quản trị kinh doanh',
  },
  th: {
    'computer-science-and-engineering': 'วิทยาการคอมพิวเตอร์และวิศวกรรม',
    'computer-engineering': 'วิศวกรรมคอมพิวเตอร์',
    'artificial-intelligence': 'ปัญญาประดิษฐ์',
    'business-administration': 'บริหารธุรกิจ',
  },
  my: {
    'computer-science-and-engineering': 'Computer Science & Engineering',
    'artificial-intelligence': 'Artificial Intelligence',
    'business-administration': 'Business Administration',
  },
  mn: {
    'computer-science-and-engineering': 'Компьютерийн шинжлэх ухаан, инженерчлэл',
    'business-administration': 'Бизнесийн удирдлага',
  },
  hi: {
    'computer-science-and-engineering': 'कंप्यूटर विज्ञान और इंजीनियरिंग',
    'business-administration': 'व्यवसाय प्रशासन',
  },
  id: {
    'computer-science-and-engineering': 'Ilmu Komputer & Teknik',
    'business-administration': 'Administrasi Bisnis',
  },
  ru: {
    'computer-science-and-engineering': 'Компьютерные науки и инженерия',
    'business-administration': 'Бизнес-администрирование',
  },
  es: {
    'computer-science-and-engineering': 'Ciencias e ingeniería informáticas',
    'business-administration': 'Administración de empresas',
  },
  tr: {
    'computer-science-and-engineering': 'Bilgisayar Bilimi ve Mühendisliği',
    'business-administration': 'İşletme',
  },
  fa: {
    'computer-science-and-engineering': 'علوم و مهندسی کامپیوتر',
    'business-administration': 'مدیریت بازرگانی',
  },
  uz: {
    'computer-science-and-engineering': 'Kompyuter fanlari va muhandisligi',
    'business-administration': 'Biznes boshqaruvi',
  },
  kk: {
    'computer-science-and-engineering': 'Компьютерлік ғылым және инженерия',
    'business-administration': 'Бизнес әкімшілігі',
  },
  bn: {
    'computer-science-and-engineering': 'কম্পিউটার বিজ্ঞান ও প্রকৌশল',
    'business-administration': 'ব্যবসায় প্রশাসন',
  },
  ur: {
    'computer-science-and-engineering': 'کمپیوٹر سائنس اور انجینئرنگ',
    'business-administration': 'بزنس انتظامیہ',
  },
  am: {
    'computer-science-and-engineering': 'ኮምፒዩተር ሳይንስ እና ምህንድስና',
    'business-administration': 'የቢዝነስ አስተዳደር',
  },
}

const EN_MAJOR_MESSAGES = buildEnglishMajorMessages()

function buildMajorMessages(language: LanguageCode): MessageDictionary {
  const overrides = MAJOR_OVERRIDES[language] ?? {}
  const messages: MessageDictionary = { ...EN_MAJOR_MESSAGES }

  for (const [slug, label] of Object.entries(overrides)) {
    messages[majorKey(slug)] = label
  }

  return messages
}

export function buildCommunityMajorMessages(language: LanguageCode): MessageDictionary {
  return buildMajorMessages(language)
}

export function translateMajorLabel(
  major: string | undefined,
  t: (key: string) => string,
): string {
  const raw = major?.trim()
  if (!raw) return ''

  const slug = slugifyProfileLabel(raw)
  if (!slug) return raw

  const key = majorKey(slug)
  const translated = t(key)
  return translated === key ? raw : translated
}
