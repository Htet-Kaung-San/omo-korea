import type { MessageDictionary } from '../../types'

const messages: MessageDictionary = {
  'library.subtitle': 'PNU ቤተ-መጽሐፍት ሞባይል መተግበሪያ (부산대 도서관_PNUL) አጠቃቀም መመሪያ',
  'library.steps': 'ደረጃዎች',
  'library.usageGuide': 'የአጠቃቀም መመሪያ',

  'library.install.title': 'መተግበሪያ ጫን',
  'library.install.step1':
    'በ [Google Play Store](https://play.google.com/store/apps/details?id=kr.ac.pusan.lib) (Android) ወይም Apple App Store (iOS) ላይ "PNUL" ወይም "부산대 도서관" ፈልገው ጫኑ።',
  'library.install.step2':
    'ቀድሞ የ "부산대 도서관" ወይም "PNU Place" መተግበሪያዎችን ተጠቅመዋል ከሆነ፣ እነሱ ተሰርዘዋል — ይህ አዲስ መተግበሪያ ሁለቱንም ይተክላል።',
  'library.install.step3':
    'በ PNU የተማሪ ፖርታል መለያ ይግቡ ([onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main) ጋር ተመሳሳይ ID/የይለፍ ቃል)።',

  'library.seatReservation.title': 'የማንበብ ክፍል መቀመጫ ማስያዝ (열람실 좌석예약)',
  'library.seatReservation.tip1':
    'በመተግበሪያ የተመደቡ መቀመጫዎች ብቻ ትክክለኛ ናቸው — ያልተመደበ መቀመጫ መጠቀም ተገኝቶ የቤተ-መጽሐፍት አጠቃቀም ገደብ ይደርሳል።',
  'library.seatReservation.tip2':
    'ከማስያዝ በኋላ በ 15 ደቂቃ ውስጥ የመግቢያ በር መሻገር አለብዎት፣ ካልሆነ መመደቡ ይሰረዛል።',
  'library.seatReservation.tip3':
    'ማራዘም ከ session መጨረሻ 2 ሰዓት በፊት ይከፈታል። እያንዳንዱ ማራዘም 4 ሰዓት ይጨምራል፣ እስከ 4 ጊዜ ማራዘም ይቻላል።',
  'library.seatReservation.tip4':
    'ማራዘም በመተግበሪያ ወይም በቤተ-መጽሐፍት ውስጥ በ 좌석배정기 (የመቀመጫ መመደቢያ ክiosk) ሊደረግ ይችላል።',
  'library.seatReservation.tip5': 'ጊዜ ሲያልቅ መቀመጫ በራስ-ሰር ይመለሳል።',
  'library.seatReservation.tip6':
    'ማስታወሻ፡ 중앙도서관 (مركزي ቤተ-መጽሐፍት) በዋናነት መጽሐፍት የተከማቸበት ቦታ ነው — አንዳንድ የማንበብ አካባቢዎች መቀመጫ መመደብ አያስፈልግም።',
  'library.seatReservation.step1':
    'በመነሻ ማያ ገጽ ላይ ከላይ አቅራቢያ 좌석예약 (መቀመጫ ማስያዝ) ፓነል ያግኙ። ንቁ ማስያዝ ከሌለ "예약된 정보가 없습니다" (የማስያዝ መረጃ የለም) ይታያል። አዲስ ለማስያዝ 배정신청 (መመደብ ጥያቄ)፣ ለቀድሞው 이용내역 (የአጠቃቀም ታሪክ) ይጫኑ።',
  'library.seatReservation.step2':
    'ከታብ ረድፎች ህንጻ ይምረጡ — 나노생명፣ 의생명፣ 미리내፣ 새벽벌 ወይም 중앙።',
  'library.seatReservation.step3':
    'ወለል (1층፣ 2층፣ ...) ይምረጡ፣ ከዚያ በዚያ ወለል የክፍል አይነት ታብ (ለምሳሌ [새벽벌]열람실 ለማንበብ ክፍል vs. [새벽벌]PC ለ PC zone)።',
  'library.seatReservation.step4':
    'የzone occupancy በቀጥታ እንደ ring chart ይታያል — ለምሳሌ "새벽누리-열람존 34/73" ከ 73 መቀመጫ 34 ተይዞ 39 ባዶ ማለት ነው።',
  'library.seatReservation.step5':
    'ወደ zone ገብተው ግለሰብ መቀመጫ ይምረጡ እና ያረጋግጡ።',
  'library.seatReservation.image.homeScreen':
    'መነሻ ማያ — 배정신청 ቁልፍ ያለው 좌석예약 ፓነል',
  'library.seatReservation.image.buildingFloor':
    'ህንጻ፣ ወለል እና zone ምርጫ ከቀጥታ መቀመጫ መያዣ',

  'library.libraryCard.title': 'የቤተ-መጽሐፍት ካርድ / 이용증',
  'library.libraryCard.step1': 'መተግበሪያን ክፈቱ እና ከላይ 메뉴 (Menu) → LOGIN በመለያ ይግቡ።',
  'library.libraryCard.step2':
    'በታችኛው navigation bar ላይ 이용증 ይጫኑ — ታች nav MY / 1:1 문의 / 홈 / 이용증 / 전체메뉴 ነው፣ ቀጥታ tab ነው፣ በምናሌ ውስጥ አይደበቅም።',
  'library.libraryCard.step3':
    '이용증 ማያ QR code ያሳያል — ይህ የሞባይል ቤተ-መጽሐፍት ካርድዎ ነው። ለመግባት በቤተ-መጽሐፍት በር QR code scan ያድርጉ።',
}

export default messages
