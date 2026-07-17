import type { LanguageCode } from '../types'
import { formatCalendarTitleKo } from '@/data/academicCalendar'

/** Phrase replacements applied longest-first for non-Korean locales. */
const EN_PHRASES: Array<[string, string]> = [
  ['국문ㆍ영문 교수계획표 입력', 'Korean/English syllabus entry'],
  ['학사학위취득유예신청기간', 'bachelor’s degree completion deferral application'],
  ['계절 및 도약수업 복학신청기간', 'seasonal & leap-class return application'],
  ['겨울계절 및 도약수업 복학신청기간', 'winter session & leap-class return application'],
  ['여름계절수업 재학생 수강신청(학부)', 'summer session course registration (undergrad)'],
  ['여름계절수업 재학생 수강신청(대학원)', 'summer session course registration (graduate)'],
  ['여름계절수업 수강신청(타대생)', 'summer session course registration (visiting)'],
  ['여름계절수업 수강정정(학부,타대생)', 'summer session add/drop (undergrad/visiting)'],
  ['여름계절수업 수강정정(대학원)', 'summer session add/drop (graduate)'],
  ['겨울계절수업 수강정정(학부,타대생)', 'winter session add/drop (undergrad/visiting)'],
  ['겨울계절수업 수강정정(대학원)', 'winter session add/drop (graduate)'],
  ['겨울계절수업 수강신청(학부)', 'winter session course registration (undergrad)'],
  ['겨울계절수업 수강신청(대학원)', 'winter session course registration (graduate)'],
  ['겨울계절수업 수강신청(타대생)', 'winter session course registration (visiting)'],
  ['수강정정(학부,타대생)', 'course add/drop (undergrad/visiting)'],
  ['수강정정(대학원)', 'course add/drop (graduate)'],
  ['수강신청(학부)', 'course registration (undergrad)'],
  ['수강신청(대학원)', 'course registration (graduate)'],
  ['수강신청(타대생)', 'course registration (visiting)'],
  ['대기순번제 적용기간', 'waiting-list system period'],
  ['자동신청결과확인', 'automatic registration result check'],
  ['희망과목담기', 'course wishlist'],
  ['휴·복학 신청기간', 'leave of absence / return application'],
  ['1차 폐강강좌 공고', '1st cancelled-class announcement'],
  ['2차 폐강강좌 공고', '2nd cancelled-class announcement'],
  ['2차(최종) 폐강강좌 공고', '2nd (final) cancelled-class announcement'],
  ['확정출석부 출력', 'final attendance roster print'],
  ['재학생 등록금납부', 'enrolled-student tuition payment'],
  ['등록금납부', 'tuition payment'],
  ['신입생 오리엔테이션', 'new student orientation'],
  ['신입생 입학식, 1학기 개강', 'entrance ceremony & spring semester begins'],
  ['1학기 개강', 'spring semester begins'],
  ['2학기 개강', 'fall semester begins'],
  ['수업일수 1/3선', '1/3 of class days'],
  ['수업일수 1/2선', '1/2 of class days'],
  ['수업일수 2/3선', '2/3 of class days'],
  ['중간고사', 'midterm exams'],
  ['기말고사', 'final exams'],
  ['수강취소', 'course withdrawal'],
  ['여름휴가 시작', 'summer break begins'],
  ['여름계절수업 강의시작종료일', 'summer session class period'],
  ['여름도약수업 강의시작종료일', 'summer leap-class period'],
  ['겨울계절수업 강의시작종료일', 'winter session class period'],
  ['겨울도약수업 강의시작종료일', 'winter leap-class period'],
  ['여름계절수업 희망과목담기', 'summer session course wishlist'],
  ['여름계절수업 자동신청결과확인', 'summer session auto-registration result'],
  ['겨울계절수업 희망과목담기', 'winter session course wishlist'],
  ['겨울계절수업 자동신청결과확인', 'winter session auto-registration result'],
  ['여름계절수업 등록금납부', 'summer session tuition payment'],
  ['여름도약수업 등록금납부', 'summer leap-class tuition payment'],
  ['겨울계절수업 등록금납부', 'winter session tuition payment'],
  ['겨울도약수업 등록금납부', 'winter leap-class tuition payment'],
  ['전기 학위청구자격 종합시험', 'degree qualification comprehensive exam'],
  ['후기 학위수여식', 'late graduation ceremony'],
  ['1학기', 'Spring'],
  ['2학기', 'Fall'],
]

const MY_PHRASES: Array<[string, string]> = [
  ['국문ㆍ영문 교수계획표 입력', 'ကိုရီးယား/အင်္ဂလိပ် ဘာသာ သင်ခန်းစာအစီအစဉ် ထည့်သွင်းခြင်း'],
  ['학사학위취득유예신청기간', 'ဘွဲ့ရရှိမှု ရွှေ့ဆိုင်းလျှောက်ထားကာလ'],
  ['희망과목담기', 'လိုချင်သော ဘာသာရပ် ထည့်သွင်းကာလ'],
  ['자동신청결과확인', 'အလိုအလျောက် စာရင်းသွင်းရလဒ် စစ်ဆေးခြင်း'],
  ['수강신청(학부)', 'ဘာသာရပ်စာရင်းသွင်း (ဘွဲ့ကြို)'],
  ['수강신청(대학원)', 'ဘာသာရပ်စာရင်းသွင်း (ဘွဲ့လွန်)'],
  ['수강신청(타대생)', 'ဘာသာရပ်စာရင်းသွင်း (အခြားတက္ကသိုလ်)'],
  ['대기순번제 적용기간', 'စောင့်ဆိုင်းစာရင်း ကာလ'],
  ['휴·복학 신청기간', 'အားလပ်ခွင့် / ပြန်တက်ရန် လျှောက်ထားကာလ'],
  ['등록금납부', 'ကျောင်းလခ ပေးသွင်းကာလ'],
  ['수강정정(학부,타대생)', 'ဘာသာရပ် ပြင်ဆင်ကာလ (ဘွဲ့ကြို/အခြား)'],
  ['수강정정(대학원)', 'ဘာသာရပ် ပြင်ဆင်ကာလ (ဘွဲ့လွန်)'],
  ['1차 폐강강좌 공고', 'ပယ်ဖျက်သင်တန်း ကြေညာချက် (၁)'],
  ['2차 폐강강좌 공고', 'ပယ်ဖျက်သင်တန်း ကြေညာချက် (၂)'],
  ['중간고사', 'အလယ်စာမေးပွဲ'],
  ['기말고사', 'နောက်ဆုံးစာမေးပွဲ'],
  ['수강취소', 'ဘာသာရပ် ရုပ်သိမ်းကာလ'],
  ['신입생 오리엔테이션', 'ကျောင်းသားသစ် orientation'],
  ['신입생 입학식, 1학기 개강', 'ကျောင်းသားသစ် ဝင်ခွင့်အခမ်းအနားနှင့် ပထမ စာသင်နှစ်ဝက် စတင်'],
  ['1학기 개강', 'ပထမ စာသင်နှစ်ဝက် စတင်ခြင်း'],
  ['2학기 개강', 'ဒုတိယ စာသင်နှစ်ဝက် စတင်ခြင်း'],
  ['여름계절수업 강의시작종료일', 'နွေရာသီ သင်တန်း စတင်/ပြီးဆုံးကာလ'],
  ['겨울계절수업 강의시작종료일', 'ဆောင်းရာသီ သင်တန်း စတင်/ပြီးဆုံးကာလ'],
  ['겨울도약수업 강의시작종료일', 'ဆောင်းရာသီ leap class စတင်/ပြီးဆုံးကာလ'],
  ['1학기', 'စာသင်နှစ်ဝက် ၁'],
  ['2학기', 'စာသင်နှစ်ဝက် ၂'],
]

function applyPhrases(title: string, phrases: Array<[string, string]>): string {
  let result = title
  const sorted = [...phrases].sort((a, b) => b[0].length - a[0].length)
  for (const [ko, translated] of sorted) {
    if (result.includes(ko)) result = result.split(ko).join(translated)
  }
  return result
}

export function translateCalendarTitle(titleKo: string, language: LanguageCode): string {
  const base = formatCalendarTitleKo(titleKo)
  if (language === 'ko') return base
  if (language === 'my') {
    const my = applyPhrases(base, MY_PHRASES)
    // Finish leftover Korean with English gloss
    return applyPhrases(my, EN_PHRASES)
  }
  return applyPhrases(base, EN_PHRASES)
}
