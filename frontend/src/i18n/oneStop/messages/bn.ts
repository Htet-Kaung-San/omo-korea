import type { MessageDictionary } from '../../types'

const messages: MessageDictionary = {
  'oneStop.subtitle': 'onestop.pusan.ac.kr-এর জন্য ধাপে ধাপে নির্দেশিকা',
  'oneStop.steps': 'ধাপ',
  'oneStop.relatedPages': 'সম্পর্কিত পৃষ্ঠা',
  'oneStop.note': 'নোট',

  'oneStop.registration.title': 'কোর্স নিবন্ধন (수강신청)',
  'oneStop.registration.step1':
    'আপনার ছাত্র আইডি ও পাসওয়ার্ড দিয়ে [onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main)-এ লগইন করুন।',
  'oneStop.registration.step2':
    'যান 수업 (Classes) → 수강신청및확인 (Registration & Confirmation)।',
  'oneStop.registration.step3':
    'প্রথমে কোর্স ক্যাটালগ দেখুন: [수강편람 (Course Catalog)](https://onestop.pusan.ac.kr/page?menuCD=000000000000335) — বিভাগ অনুযায়ী খুঁজুন, খোলা সেকশন ব্রাউজ করুন, আসন সীমা পরীক্ষা করুন।',
  'oneStop.registration.step4':
    'নিবন্ধনের সময়কালে, প্রকৃত জমা দেওয়া হয় আলাদা নিবন্ধন সিস্টেমে: [sugang.pusan.ac.kr](https://sugang.pusan.ac.kr) (PC বা মোবাইল ওয়েব)। এটি One-Stop-এর থেকে ভিন্ন সাইট — এখানে রিডাইরেক্ট হলে বিভ্রান্ত হবেন না।',
  'oneStop.registration.step5':
    'জমা দেওয়ার পর One-Stop-এ ফিরে যান → [수강확인 (Registration Check)](https://onestop.pusan.ac.kr/page?menuCD=000000000000355) দিয়ে নিশ্চিত করুন আপনার কোর্সগুলো সত্যিই নিবন্ধিত হয়েছে — প্রতিবার করুন, কারণ "wishlist" (희망과목담기) নিশ্চিত নিবন্ধনের সমান নয়।',
  'oneStop.registration.related.addDrop': 'কোর্স যোগ/বাতিল (수강신청및수강정정)',
  'oneStop.registration.related.cancellation': 'কোর্স বাতিল (수강취소)',
  'oneStop.registration.related.timetable': 'সময়সূচী দেখুন (시간표조회)',
  'oneStop.registration.note':
    'নিবন্ধন শুধুমাত্র একাডেমিক ক্যালেন্ডারে নির্ধারিত নির্দিষ্ট সময়ে খোলে (সাধারণত One-Stop হোমপেজে তালিকাভুক্ত)। আগে থেকে তারিখ দেখুন — সিস্টেম শুধুমাত্র এই সময়ে ব্যবহারযোগ্য।',

  'oneStop.cancellation.title': 'কোর্স বাতিল / প্রত্যাহার (수강취소)',
  'oneStop.cancellation.step1':
    '[onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main)-এ লগইন করুন।',
  'oneStop.cancellation.step2':
    'যান 수업 (Classes) → 수강취소 (Course Cancellation): [Course Cancellation (수강취소)](https://onestop.pusan.ac.kr/page?menuCD=000000000000358)',
  'oneStop.cancellation.step3': 'যে কোর্স(গুলো) বাতিল করতে চান তা নির্বাচন করে নিশ্চিত করুন।',
  'oneStop.cancellation.step4':
    'পরে, [수강확인 (Registration Check)](https://onestop.pusan.ac.kr/page?menuCD=000000000000355) আবার দেখে নিশ্চিত করুন কোর্সটি আর আপনার সক্রিয় সময়সূচীতে নেই।',
  'oneStop.cancellation.note':
    'এটি 수강정정 (add/drop) থেকে আলাদা, যা সেমিস্টারের শুরুতে হয় এবং কোনো রেকর্ড রেখে যায় না। 수강취소 সেমিস্টারের পরে খোলে (সাধারণত মিডটার্মের পরে সংক্ষিপ্ত সময়) এবং কোর্স সম্পূর্ণ মুছে না বরং ট্রান্সক্রিপ্টে W (Withdrawal) চিহ্ন রাখে। সঠিক তারিখ প্রতি সেমিস্টারে একাডেমিক ক্যালেন্ডারে নির্ধারিত হয়।',

  'oneStop.grades.title': 'গ্রেড দেখা (성적확인)',
  'oneStop.grades.step1':
    '[onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main)-এ লগইন করুন।',
  'oneStop.grades.step2': 'যান 수업 (Classes) → গ্রেড বিভাগ।',
  'oneStop.grades.step3':
    'বর্তমান সেমিস্টারের জন্য: [Current Semester Grades (금학기성적조회)](https://onestop.pusan.ac.kr/page?menuCD=000000000000144)',
  'oneStop.grades.step4':
    'সম্পূর্ণ একাডেমিক রেকর্ডের জন্য: [All Semesters Grades (전체성적조회)](https://onestop.pusan.ac.kr/page?menuCD=000000000000145)',
  'oneStop.grades.note':
    'বর্তমান সেমিস্টারের গ্রেড সাধারণত চূড়ান্ত গ্রেড প্রকাশ শেষ হওয়ার পরেই দেখা যায় — খালি থাকলে গ্রেড এখনো প্রকাশিত হয়নি।',

  'oneStop.tuition.title': 'টিউশন — বিল ও পেমেন্ট নিশ্চিতকরণ (등록금 고지서 / 납부확인)',
  'oneStop.tuition.step1':
    '[onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main)-এ লগইন করুন।',
  'oneStop.tuition.step2': 'যান 등록 (Registration/Tuition) মেনু।',
  'oneStop.tuition.step3': 'বিল প্রিন্ট/দেখুন: 고지서출력 (Bill Print)।',
  'oneStop.tuition.step4':
    'বিলে দেখানো স্কুল পেমেন্ট কোড নোট করুন (ব্যাংক অনুযায়ী ভিন্ন — NH, Busan Bank, Hana ইত্যাদি) এবং ব্যাংক ট্রান্সফার, ATM, ইন্টারনেট/ফোন ব্যাংকিং বা ব্যাংকে সরাসরি পেমেন্ট করুন।',
  'oneStop.tuition.step5':
    'পেমেন্ট হয়েছে কিনা নিশ্চিত করুন: 납부확인 (Payment Confirmation / Receipt Print) — পেমেন্টের পর দেখুন, কারণ পেমেন্ট সবসময় তাৎক্ষণিক প্রতিফলিত হয় না।',
  'oneStop.tuition.note':
    'টিউশন বিল ফোন/ইমেইল/ফ্যাক্সে আপনার পক্ষে অনুরোধ করা যায় না — আপনাকে নিজের লগইনে সরাসরি অ্যাক্সেস করতে হবে।',

  'oneStop.leaveReturn.title': 'অবকাশ / স্কুলে ফিরে আসা (휴학 / 복학 신청)',
  'oneStop.leaveReturn.step1':
    '[onestop.pusan.ac.kr](https://onestop.pusan.ac.kr/main)-এ লগইন করুন।',
  'oneStop.leaveReturn.step2':
    'অবকাশের জন্য আবেদন: [Leave of Absence Application (휴학신청)](https://onestop.pusan.ac.kr/page?menuCD=000000000000322)',
  'oneStop.leaveReturn.step3':
    'অবকাশ থেকে ফিরে আসার জন্য আবেদন: [Return to School Application (복학신청)](https://onestop.pusan.ac.kr/page?menuCD=000000000000323)',
  'oneStop.leaveReturn.note':
    'উভয়ের প্রতি সেমিস্টারে নির্দিষ্ট আবেদনের সময় থাকে (One-Stop হোমপেজের একাডেমিক ক্যালেন্ডার দেখুন) — সময়ের বাইরে আবেদন করা সম্ভব নাও হতে পারে।',
}

export default messages
